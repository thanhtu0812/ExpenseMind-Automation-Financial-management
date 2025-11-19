const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const financialService = require("../services/financialService");
const mongoose = require("mongoose");
const Category = require("../models/Category");
const ReportSchedule = require("../models/ReportSchedule");
const multer = require("multer");
const fs = require("fs");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const conversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  conversationId: { type: String, required: true, unique: true },
  messages: [
    {
      role: { type: String, enum: ["user", "model"], required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      metadata: { type: Object },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Conversation = mongoose.model("Conversation", conversationSchema);

router.post("/message", async (req, res) => {
  try {
    const { message, conversationId, userId } = req.body;

    // Validate input
    if (!message || !conversationId || !userId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: message, conversationId, or userId",
      });
    }

    let conversation = await Conversation.findOne({ conversationId });
    if (!conversation) {
      conversation = new Conversation({ conversationId, messages: [], userId });
    }

    conversation.messages.push({
      role: "user",
      content: message.substring(0, 1000),
      timestamp: new Date(),
    });

    const categories = await Category.find({
      $or: [
        { user_id: new mongoose.Types.ObjectId(userId) },
        { is_default: true },
      ],
    });
    const expenseCategories = categories
      .filter((c) => c.type === "expense")
      .map((c) => c.name);

    const incomeCategories = categories
      .filter((c) => c.type === "income")
      .map((c) => c.name);

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
      You are an intelligent financial assistant. Your task is to analyze the user's message and determine the appropriate action.
      The possible actions are: "create_transaction", "create_scheduled_report", "query", "chat".

      If the user wants to create a scheduled report, return a JSON object with the action "create_scheduled_report" and the report data.
      The report data should include: email, reportType ("income", "expense", or "total"), sendMode ("now", "weekly", "monthly", "later"), time (if applicable), date (if applicable).
      If some parameters are missing, include a "missing" field with the list of missing parameters.

      For example:
      User message: "tạo báo cáo thu nhập hàng tháng gửi đến email@example.com"
      {
        "action": "create_scheduled_report",
        "data": {
          "email": "email@example.com",
          "reportType": "income",
          "sendMode": "monthly"
        }
      }

      If missing parameters:
      {
        "action": "create_scheduled_report",
        "missing": ["email", "reportType"]
      }

      If the user wants to create a new transaction, return a JSON object with the action "create_transaction" and the transaction data.
      The transaction type can be "expense" or "income".
      If the user specifies a date or time (e.g., "hôm qua", "3 giờ chiều nay"), extract it and include it as a "date" field in ISO 8601 format.
      
      For example:
      User message: "thêm chi tiêu 50k tiền xăng hôm qua"
      {
        "action": "create_transaction",
        "data": {
          "type": "expense",
          "amount": 50000,
          "category": "xăng",
          "description": "tiền xăng",
          "date": "2025-11-20T00:00:00"
        }
      }

      If the user is asking a question about their finances, return a JSON object with the action "query" and the query parameters.
      The available query types are: "spending_report", "income_report", "monthly_report", "savings_suggestion".

      When the user asks about a specific time period, you should extract it and put it in the 'time_period' parameter.
      The possible values for 'time_period' are: 'day', 'week', 'month', 'quarter', 'year'.
      If the user mentions a specific date (e.g., "hôm qua", "tuần trước", "tháng 10"), you should also extract the date and put it in the 'date' parameter in 'YYYY-MM-DD' format. If no date is mentioned, you don't need to include the 'date' parameter.

      - Use "spending_report" for questions about expenses.
      - Use "income_report" for questions about income.
      - Use "monthly_report" for a general report of the current month. You can also specify a "type" in the params ("income" or "expense").
      - Use "savings_suggestion" to get a savings suggestion.

      Examples:

      User message: "chi tiêu hôm nay của tôi là bao nhiêu?"
      {
        "action": "query",
        "query": {
          "type": "spending_report",
          "params": {
            "time_period": "day"
          }
        }
      }

      User message: "chi tiêu quý này của tôi là bao nhiêu?"
      {
        "action": "query",
        "query": {
          "type": "spending_report",
          "params": {
            "time_period": "quarter"
          }
        }
      }

      User message: "thu nhập năm nay của tôi là bao nhiêu?"
      {
        "action": "query",
        "query": {
          "type": "income_report",
          "params": {
            "time_period": "year"
          }
        }
      }

      User message: "thu nhập tháng 10 của tôi là bao nhiêu?"
      {
        "action": "query",
        "query": {
          "type": "income_report",
          "params": {
            "time_period": "month",
            "date": "2025-10-01"
          }
        }
      }

      User message: "báo cáo tháng này"
      {
        "action": "query",
        "query": {
          "type": "monthly_report",
          "params": {}
        }
      }

      If the user's message is not a request to create a transaction or a query, return a JSON object with the action "chat".
      For example:
      {
        "action": "chat"
      }
      
      The available categories are:
        - Expense categories: ${expenseCategories.join(", ")}
        - Income categories: ${incomeCategories.join(", ")}

      IMPORTANT:
        - If the transaction type is "expense", you must pick a category only from expense categories.
        - If the transaction type is "income", you must pick a category only from income categories.
        - If category is missing or cannot be determined, ALWAYS choose the closest matching one from the correct category list.
        - NEVER leave category empty.
        - If cannot determine anything, default to "Undefined".

      The user's message is: "${message}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("AI response is empty");
    }

    let responseObject;
    try {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
      responseObject = JSON.parse(jsonMatch ? jsonMatch[1] : text);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      responseObject = { action: "chat" };
    }

    let responseText = "";

    if (responseObject.action === "create_transaction") {
      const { type, amount, category, description, date } = responseObject.data;

      if (!type || !amount || !category) {
        responseText =
          "Thiếu thông tin cần thiết để tạo giao dịch. Vui lòng cung cấp đầy đủ loại, số tiền và danh mục.";
      } else {
        try {
          const newTransaction = await financialService.createTransaction(
            userId,
            type,
            amount,
            category,
            description || "",
            date
          );
          responseText = `Đã tạo ${
            type === "expense" ? "chi tiêu" : "thu nhập"
          } cho bạn: ${newTransaction.amount} VNĐ cho ${
            newTransaction.category_id?.name || category
          }.`;
        } catch (transactionError) {
          console.error("Transaction creation error:", transactionError);
          responseText =
            "Xin lỗi, tôi gặp sự cố khi tạo giao dịch. Vui lòng thử lại.";
        }
      }
    } else if (responseObject.action === "create_scheduled_report") {
      if (responseObject.missing && responseObject.missing.length > 0) {
        responseText = `Để tạo báo cáo, tôi cần các thông tin sau: email, loại báo cáo (income/expense/total), chế độ gửi (now/weekly/monthly/later), thời gian (nếu cần), ngày (nếu cần). Vui lòng cung cấp đầy đủ thông tin.`;
      } else {
        const { email, reportType, sendMode, time, date } = responseObject.data;
        try {
          const newReport = new ReportSchedule({
            userId,
            email,
            reportType,
            sendMode,
            time,
            date,
          });
          await newReport.save();
          responseText = `Đã tạo báo cáo ${reportType} gửi đến ${email} với chế độ ${sendMode}.`;
        } catch (reportError) {
          console.error("Report creation error:", reportError);
          responseText =
            "Xin lỗi, tôi gặp sự cố khi tạo báo cáo. Vui lòng thử lại.";
        }
      }
    } else if (responseObject.action === "query") {
      try {
        const data = await financialService.executeQuery(
          userId,
          responseObject.query
        );
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const prompt = `
          You are a helpful assistant that generates a summary of the user's financial data.
          The user's data is: ${JSON.stringify(data)}
          
          Please generate a summary of the user's data in Vietnamese with the following formatting:
          
          - Use clear, natural language with proper line breaks
          - Avoid excessive markdown formatting like **bold** or other symbols
          - Structure the information logically with proper spacing
          - Make it easy to read with appropriate paragraph breaks
          - Use bullet points with simple dashes (-) instead of asterisks
          - Keep the tone professional but friendly
          
          Format the response like this example:
          
          Dưới đây là bản tóm tắt tình hình tài chính của bạn:
          
          Tổng quan:
          - Thu nhập: 5,750,000 VNĐ
          - Chi tiêu: 3,793,999 VNĐ
          
          Chi tiết thu nhập:
          - Đầu tư: 5,000,000 VNĐ
          - Việc làm thêm: 700,000 VNĐ
          - Tiền bố cho: 50,000 VNĐ
          
          Chi tiết chi tiêu:
          - Mất trộm: 3,000,000 VNĐ
          - Ăn uống: 84,999 VNĐ
          - Đi lại/Du lịch: 55,000 VNĐ
          - Giáo dục: 215,000 VNĐ
          
          Nhận xét:
          Khoản chi tiêu lớn nhất là do bị mất trộm, ảnh hưởng đáng kể đến tình hình tài chính.
          
          Chi tiêu cho ăn uống và mua sắm chiếm phần lớn trong các khoản chi tiêu hàng ngày.
          
          Thu nhập chủ yếu đến từ đầu tư và các công việc làm thêm.
          
          Cần lưu ý khoản mất trộm để có các biện pháp phòng tránh trong tương lai.
        `;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        responseText = response.text() || "Không có dữ liệu để hiển thị.";
      } catch (queryError) {
        console.error("Query execution error:", queryError);
        responseText =
          "Xin lỗi, tôi gặp sự cố khi truy vấn dữ liệu tài chính của bạn.";
      }
    } else {
      try {
        const chat = model.startChat({
          history: conversation.messages.map((msg) => ({
            role: msg.role,
            parts: [{ text: msg.content }],
          })),
          generationConfig: {
            maxOutputTokens: 500,
          },
        });
        const result = await chat.sendMessage(message);
        const response = await result.response;
        responseText =
          response.text() ||
          "Xin lỗi, tôi không thể tạo phản hồi ngay lúc này.";
      } catch (chatError) {
        console.error("Chat error:", chatError);
        responseText = "Xin lỗi, tôi gặp sự cố khi xử lý tin nhắn của bạn.";
      }
    }

    if (!responseText || responseText.trim() === "") {
      responseText =
        "Xin lỗi, tôi không thể tạo phản hồi phù hợp ngay lúc này.";
    }

    conversation.messages.push({
      role: "model",
      content: responseText.substring(0, 3000), // Giới hạn độ dài
      timestamp: new Date(),
    });

    try {
      await conversation.save();
    } catch (saveError) {
      console.error("Save conversation error:", saveError);
    }

    res.json({
      success: true,
      message: responseText,
      conversationId,
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({
      success: false,
      error: "Đã xảy ra lỗi khi xử lý tin nhắn của bạn.",
    });
  }
});

router.get("/conversation/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findOne({ conversationId });

    res.json({
      success: true,
      messages: conversation?.messages || [],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const { userId, conversationId } = req.body;
    const imageFile = req.file;

    // Validate input
    if (!userId || !conversationId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userId or conversationId",
      });
    }

    if (!imageFile) {
      return res.status(400).json({
        success: false,
        error: "No image file uploaded.",
      });
    }

    let conversation = await Conversation.findOne({ conversationId });
    if (!conversation) {
      conversation = new Conversation({ conversationId, messages: [], userId });
    }

    const categories = await Category.find({
      $or: [
        { user_id: new mongoose.Types.ObjectId(userId) },
        { is_default: true },
      ],
    });
    const expenseCategories = categories
      .filter((c) => c.type === "expense")
      .map((c) => c.name);

    const incomeCategories = categories
      .filter((c) => c.type === "income")
      .map((c) => c.name);

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
            You are an expert financial assistant specializing in analyzing receipts and invoices.
            Analyze the attached image. Determine if it is a receipt, invoice, or any other proof of a financial transaction.

            If it is a financial document, extract the following information:
            - type: "expense" or "income". IMPORTANT: If the image is a bank transfer slip, a bill payment receipt, or a screenshot of a successful transfer confirmation from a mobile banking app, the type should always be "expense".
            - amount: The total amount of the transaction as a number.
            - category: The most appropriate category from the following list: Expense categories: ${expenseCategories.join(
              ", "
            )} and Income categories: ${incomeCategories.join(", ")}.
            - description: A brief description of the transaction.
            - date: The date and time of the transaction, if visible on the document. Return it in ISO 8601 format.

            Return the result as a JSON object. For example:
            {
              "action": "create_transaction",
              "data": {
                "type": "expense",
                "amount": 150000,
                "category": "food-and-beverage",
                "description": "Lunch at restaurant",
                "date": "2025-11-21T13:30:00"
              }
            }

            If the image is not a recognizable financial document, return a JSON object with action "chat".
            {
              "action": "chat",
              "message": "I'm sorry, I don't recognize this as a receipt or invoice. Could you please provide a clearer image or a different document?"
            }
        `;

    const imagePart = {
      inlineData: {
        data: imageFile.buffer.toString("base64"),
        mimeType: imageFile.mimetype,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("AI response is empty");
    }

    let responseObject;
    try {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
      responseObject = JSON.parse(jsonMatch ? jsonMatch[1] : text);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      responseObject = {
        action: "chat",
        message: "Xin lỗi, tôi không thể phân tích hình ảnh này.",
      };
    }

    let responseText = "";

    if (responseObject.action === "create_transaction") {
      const { type, amount, category, description, date } = responseObject.data;

      if (!type || !amount || !category) {
        responseText =
          "Không thể trích xuất đủ thông tin từ hình ảnh. Vui lòng thử với hình ảnh rõ hơn hoặc nhập thủ công.";
      } else {
        try {
          const newTransaction = await financialService.createTransaction(
            userId,
            type,
            amount,
            category,
            description || "",
            date
          );
          responseText = `Đã tạo ${
            type === "expense" ? "chi tiêu" : "thu nhập"
          } từ hình ảnh: ${newTransaction.amount} VNĐ cho ${
            newTransaction.category_id?.name || category
          }.`;
        } catch (transactionError) {
          console.error("Transaction creation error:", transactionError);
          responseText =
            "Xin lỗi, tôi gặp sự cố khi tạo giao dịch từ hình ảnh.";
        }
      }
    } else {
      responseText =
        responseObject.message ||
        "Tôi không nhận diện được đây là hóa đơn hay biên lai. Vui lòng thử với hình ảnh khác.";
    }

    if (!responseText || responseText.trim() === "") {
      responseText = "Xin lỗi, tôi không thể xử lý hình ảnh này.";
    }

    conversation.messages.push({
      role: "user",
      content: `[Đã tải lên hình ảnh: ${imageFile.originalname}]`,
      timestamp: new Date(),
    });

    conversation.messages.push({
      role: "model",
      content: responseText.substring(0, 2000),
      timestamp: new Date(),
    });

    try {
      await conversation.save();
    } catch (saveError) {
      console.error("Save conversation error:", saveError);
    }

    res.json({
      success: true,
      message: responseText,
      conversationId,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    res.status(500).json({
      success: false,
      error: "Đã xảy ra lỗi khi xử lý hình ảnh của bạn.",
    });
  }
});

module.exports = router;
