const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const financialService = require("../services/financialService");
const mongoose = require("mongoose");
const Category = require("../models/Category");
const ReportSchedule = require("../models/ReportSchedule");
const multer = require('multer');
const fs = require('fs');

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

    let conversation = await Conversation.findOne({ conversationId });
    if (!conversation) {
      conversation = new Conversation({ conversationId, messages: [], userId });
    }

    conversation.messages.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    const categories = await Category.find({ $or: [{ user_id: new mongoose.Types.ObjectId(userId) }, { is_default: true }] });
    const categoryNames = categories.map(c => c.name);

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
      
      The available categories are: ${categoryNames.join(", ")}.
      The user's message is: "${message}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    const responseObject = JSON.parse(jsonMatch ? jsonMatch[1] : text);

    let responseText;

    if (responseObject.action === "create_transaction") {
      const { type, amount, category, description, date } = responseObject.data;
      const newTransaction = await financialService.createTransaction(
        userId,
        type,
        amount,
        category,
        description || "",
        date
      );
      responseText = `I have created the ${type} for you: ${newTransaction.amount} for ${newTransaction.category_id.name}.`;
    } else if (responseObject.action === "create_scheduled_report") {
      if (responseObject.missing && responseObject.missing.length > 0) {
        responseText = `Để tạo báo cáo, tôi cần các thông tin sau: email, loại báo cáo (income/expense/total), chế độ gửi (now/weekly/monthly/later), thời gian (nếu cần), ngày (nếu cần). Vui lòng cung cấp đầy đủ thông tin.`;
      } else {
        const { email, reportType, sendMode, time, date } = responseObject.data;
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
      }
    } else if (responseObject.action === "query") {
      const data = await financialService.executeQuery(userId, responseObject.query);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `
        You are a helpful assistant that generates a summary of the user's financial data.
        The user's data is: ${JSON.stringify(data)}
        Please generate a summary of the user's data in Vietnamese.
      `;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      responseText = response.text();
    } else {
      const chat = model.startChat({
        history: conversation.messages.map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        })),
        generationConfig: {
          maxOutputTokens: 100,
        },
      });
      const result = await chat.sendMessage(message);
      const response = await result.response;
      responseText = response.text();
    }

    conversation.messages.push({
      role: "model",
      content: responseText,
      timestamp: new Date(),
    });

    await conversation.save();

    res.json({
      success: true,
      message: responseText,
      conversationId,
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
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
    res.status(500).json({ success: false, error: a.message });
  }
});

const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const { userId, conversationId } = req.body;
        const imageFile = req.file;

        if (!imageFile) {
            return res.status(400).json({ success: false, error: 'No image file uploaded.' });
        }

        let conversation = await Conversation.findOne({ conversationId });
        if (!conversation) {
            conversation = new Conversation({ conversationId, messages: [], userId });
        }

        const categories = await Category.find({ $or: [{ user_id: new mongoose.Types.ObjectId(userId) }, { is_default: true }] });
        const categoryNames = categories.map(c => c.name);

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
            You are an expert financial assistant specializing in analyzing receipts and invoices.
            Analyze the attached image. Determine if it is a receipt, invoice, or any other proof of a financial transaction.

            If it is a financial document, extract the following information:
            - type: "expense" or "income". IMPORTANT: If the image is a bank transfer slip, a bill payment receipt, or a screenshot of a successful transfer confirmation from a mobile banking app, the type should always be "expense".
            - amount: The total amount of the transaction as a number.
            - category: The most appropriate category from the following list: ${categoryNames.join(", ")}.
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
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        const responseObject = JSON.parse(jsonMatch ? jsonMatch[1] : text);

        let responseText;

        if (responseObject.action === "create_transaction") {
            const { type, amount, category, description, date } = responseObject.data;
            const newTransaction = await financialService.createTransaction(
                userId,
                type,
                amount,
                category,
                description || "",
                date
            );
            responseText = `I have created the ${type} for you from the image: ${newTransaction.amount} for ${newTransaction.category_id.name}.`;
        } else {
            responseText = responseObject.message || "I could not process the image.";
        }

        conversation.messages.push({
            role: "user",
            content: `[Image uploaded: ${imageFile.originalname}]`,
            timestamp: new Date(),
        });
        conversation.messages.push({
            role: "model",
            content: responseText,
            timestamp: new Date(),
        });

        await conversation.save();

        res.json({
            success: true,
            message: responseText,
            conversationId,
        });

    } catch (error) {
        console.error("Image upload error:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

module.exports = router;
