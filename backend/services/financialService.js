const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
const mongoose = require("mongoose");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function getDateRange(timePeriod, refDateStr) {
  const refDate = refDateStr ? new Date(refDateStr) : new Date();
  let startDate, endDate;

  switch (timePeriod) {
    case "day":
      startDate = new Date(refDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(refDate);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "week":
      startDate = new Date(
        refDate.setDate(refDate.getDate() - refDate.getDay())
      );
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "month":
      startDate = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
      endDate = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "quarter":
      const quarter = Math.floor(refDate.getMonth() / 3);
      startDate = new Date(refDate.getFullYear(), quarter * 3, 1);
      endDate = new Date(refDate.getFullYear(), quarter * 3 + 3, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "year":
      startDate = new Date(refDate.getFullYear(), 0, 1);
      endDate = new Date(refDate.getFullYear(), 11, 31);
      endDate.setHours(23, 59, 59, 999);
      break;
    default:
      // Default to week
      startDate = new Date(
        refDate.setDate(refDate.getDate() - refDate.getDay())
      );
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
  }
  return { startDate, endDate };
}

async function getSpendingReport(userId, timePeriod, date) {
  const { startDate, endDate } = getDateRange(timePeriod, date);

  const transactions = await Transaction.find({
    user_id: new mongoose.Types.ObjectId(userId),
    type: "expense",
    date: { $gte: startDate, $lte: endDate },
  }).populate("category_id", "name");

  return transactions;
}

async function getIncomeReport(userId, timePeriod, date) {
  const { startDate, endDate } = getDateRange(timePeriod, date);

  const transactions = await Transaction.find({
    user_id: new mongoose.Types.ObjectId(userId),
    type: "income",
    date: { $gte: startDate, $lte: endDate },
  }).populate("category_id", "name");

  return transactions;
}

async function getSavingsSuggestion(userId) {
  // 1. Fetch user's transactions from the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const transactions = await Transaction.find({
    user_id: new mongoose.Types.ObjectId(userId),
    date: { $gte: thirtyDaysAgo },
  })
    .populate("category_id", "name")
    .sort({ date: -1 });

  if (transactions.length === 0) {
    return "Tôi chưa có đủ dữ liệu giao dịch của bạn để đưa ra lời khuyên. Hãy thử thêm một vài giao dịch chi tiêu và thu nhập nhé!";
  }

  // 2. Prepare data for the AI
  const simplifiedTransactions = transactions.map((t) => ({
    type: t.type,
    amount: t.amount,
    category: t.category_id.name,
    date: t.date.toISOString().split("T")[0], // Just the date part
  }));

  // 3. Create the prompt for the AI
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `
        You are a friendly and insightful Vietnamese financial advisor named ExpenseMind.
        Below is a summary of a user's income and expenses for the last 30 days.
        Your task is to analyze their spending patterns and provide 3-5 personalized, actionable tips to help them save money.

        **Analysis Guidelines:**
        - Identify the top 2-3 spending categories.
        - Compare total income vs. total expenses.
        - Look for non-essential spending or areas where costs seem high.
        - Frame your advice in a positive, encouraging, and non-judgmental tone.
        - Address the user directly ("Bạn").
        - Explain the reasoning behind your suggestions clearly and simply.
        - Keep the advice concise and easy to understand.
        - ALWAYS respond in Vietnamese.

        **User's Financial Data:**
        \`\`\`json
        ${JSON.stringify(simplifiedTransactions, null, 2)}
        \`\`\`

        **Example Response Structure:**
        "Chào bạn, tôi là ExpenseMind đây! Sau khi xem qua các giao dịch gần đây của bạn, tôi có một vài gợi ý nhỏ để giúp bạn tối ưu việc chi tiêu của mình:\n\n1. **[Lời khuyên 1]**: [Giải thích ngắn gọn tại sao và cách thực hiện].\n2. **[Lời khuyên 2]**: [Giải thích ngắn gọn tại sao và cách thực hiện].\n3. **[Lời khuyên 3]**: [Giải thích ngắn gọn tại sao và cách thực hiện].\n\nHy vọng những gợi ý này sẽ hữu ích cho bạn!"
    `;

  // 4. Generate content and return
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating savings suggestion:", error);
    return "Xin lỗi, tôi đang gặp sự cố khi phân tích dữ liệu của bạn. Vui lòng thử lại sau.";
  }
}

async function getMonthlyReport(userId, type, date) {
  const { startDate, endDate } = getDateRange("month", date);

  const query = {
    user_id: new mongoose.Types.ObjectId(userId),
    date: { $gte: startDate, $lte: endDate },
  };

  if (type) {
    query.type = type;
  }

  const transactions = await Transaction.find(query).populate(
    "category_id",
    "name"
  );

  return transactions;
}

async function createTransaction(
  userId,
  type,
  amount,
  categoryName,
  description,
  transactionDate
) {
  if (!userId) throw new Error("userId is required");
  if (!type) throw new Error("Transaction type is required");

  // Normalize category
  categoryName = (categoryName || "").trim();
  if (categoryName === "") {
    categoryName = "Khác"; // fallback
  }

  // Trước tiên tìm Category dành cho user
  let category = await Category.findOne({
    user_id: new mongoose.Types.ObjectId(userId),
    type,
    name: categoryName,
  });

  // Nếu không có, thử tìm bản default cùng tên (nếu sử dụng is_default)
  if (!category) {
    category = await Category.findOne({
      is_default: true,
      type,
      name: categoryName,
    });
  }

  // Nếu vẫn không có, tạo mới Category cho user
  if (!category) {
    category = new Category({
      name: categoryName,
      type,
      user_id: new mongoose.Types.ObjectId(userId),
      is_default: true,
      icon: "/icons/icon-21.png",
    });

    try {
      await category.save();
      console.log(
        `[createTransaction] Created new category "${categoryName}" for user ${userId} -> ${category._id}`
      );
    } catch (err) {
      console.error("[createTransaction] Error creating new category:", err);

      category = await Category.findOne({
        user_id: new mongoose.Types.ObjectId(userId),
        type,
        name: categoryName,
      });

      if (!category) throw new Error("Cannot create or fetch category.");
    }
  }

  // Tạo transaction với ID category hợp lệ
  const newTransaction = new Transaction({
    amount,
    date: transactionDate ? new Date(transactionDate) : new Date(),
    description,
    type,
    user_id: new mongoose.Types.ObjectId(userId),
    category_id: category._id,
  });

  await newTransaction.save();
  await newTransaction.populate("category_id");
  return newTransaction;
}

async function executeQuery(userId, query) {
  const { type, params } = query;
  const { time_period, date, type: transactionType } = params || {};

  switch (type) {
    case "spending_report":
      return await getSpendingReport(userId, time_period, date);
    case "income_report":
      return await getIncomeReport(userId, time_period, date);
    case "savings_suggestion":
      return await getSavingsSuggestion(userId);
    case "monthly_report":
      return await getMonthlyReport(userId, transactionType, date);
    default:
      throw new Error(`Unknown query type: ${type}`);
  }
}

module.exports = {
  getSpendingReport,
  getIncomeReport,
  getSavingsSuggestion,
  getMonthlyReport,
  createTransaction,
  executeQuery,
};
