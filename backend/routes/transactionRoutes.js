const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
const router = express.Router();

//Lấy danh sách transaction
router.get("/", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token là bắt buộc!" });

    const decoded = jwt.verify(token, "secretkey");
    const {
      page = 1,
      limit = 10,
      type,
      category,
      startDate,
      endDate,
    } = req.query;

    const filter = { user_id: new mongoose.Types.ObjectId(decoded.userId) };

    if (type && ["expense", "income"].includes(type)) filter.type = type;
    if (category) filter.category_id = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(filter)
      .populate("category_id", "name icon type")
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(filter);

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError")
      return res.status(403).json({ message: "Token không hợp lệ!" });
    console.error("Lỗi khi lấy danh sách transactions:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

//Lấy 1 transaction theo ID
router.get("/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token là bắt buộc!" });

    const decoded = jwt.verify(token, "secretkey");
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user_id: new mongoose.Types.ObjectId(decoded.userId),
    }).populate("category_id", "name");

    if (!transaction)
      return res.status(404).json({ message: "Transaction không tồn tại!" });

    res.json(transaction);
  } catch (error) {
    if (error.name === "JsonWebTokenError")
      return res.status(403).json({ message: "Token không hợp lệ!" });
    console.error("Lỗi khi lấy transaction:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

//Tạo transaction mới
router.post("/", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token là bắt buộc!" });

    const decoded = jwt.verify(token, "secretkey");
    const { amount, date, description, type, category_id } = req.body;

    if (!amount || !type || !category_id) {
      return res
        .status(400)
        .json({ message: "Vui lòng điền đầy đủ amount, type và category_id!" });
    }

    if (!["expense", "income"].includes(type)) {
      return res
        .status(400)
        .json({ message: "Type phải là 'expense' hoặc 'income'!" });
    }

    const category = await Category.findOne({
      _id: category_id,
      $or: [
        { user_id: new mongoose.Types.ObjectId(decoded.userId) },
        { is_default: true },
      ],
    });

    if (!category) {
      return res.status(404).json({ message: "Category không tồn tại!" });
    }

    const newTransaction = new Transaction({
      amount,
      date: date || new Date(),
      description: description || "",
      type,
      user_id: decoded.userId,
      category_id,
    });

    await newTransaction.save();
    await newTransaction.populate("category_id", "name");

    res.status(201).json({
      message: "Tạo transaction thành công!",
      transaction: newTransaction,
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError")
      return res.status(403).json({ message: "Token không hợp lệ!" });
    console.error("Lỗi khi tạo transaction:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

//Cập nhật transaction
router.put("/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token là bắt buộc!" });

    const decoded = jwt.verify(token, "secretkey");
    const { amount, date, description, type, category_id } = req.body;

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user_id: new mongoose.Types.ObjectId(decoded.userId),
    });

    if (!transaction)
      return res.status(404).json({ message: "Transaction không tồn tại!" });

    if (category_id) {
      const category = await Category.findOne({
        _id: category_id,
        $or: [
          { user_id: new mongoose.Types.ObjectId(decoded.userId) },
          { is_default: true },
        ],
      });
      if (!category)
        return res.status(404).json({ message: "Category không tồn tại!" });
      transaction.category_id = category_id;
    }

    if (amount !== undefined) transaction.amount = amount;
    if (date !== undefined) transaction.date = date;
    if (description !== undefined) transaction.description = description;
    if (type && ["expense", "income"].includes(type)) transaction.type = type;

    await transaction.save();
    await transaction.populate("category_id", "name");

    res.json({
      message: "Cập nhật transaction thành công!",
      transaction,
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError")
      return res.status(403).json({ message: "Token không hợp lệ!" });
    console.error("Lỗi khi cập nhật transaction:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

//Xóa transaction
router.delete("/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token là bắt buộc!" });

    const decoded = jwt.verify(token, "secretkey");

    const deletedTransaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user_id: new mongoose.Types.ObjectId(decoded.userId),
    });

    if (!deletedTransaction)
      return res.status(404).json({ message: "Transaction không tồn tại!" });

    res.json({ message: "Xóa transaction thành công!" });
  } catch (error) {
    if (error.name === "JsonWebTokenError")
      return res.status(403).json({ message: "Token không hợp lệ!" });
    console.error("Lỗi khi xóa transaction:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

//Thống kê tổng quan
router.get("/stats/overview", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token là bắt buộc!" });

    const decoded = jwt.verify(token, "secretkey");
    const { startDate, endDate } = req.query;

    const match = { user_id: new mongoose.Types.ObjectId(decoded.userId) };
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    }

    const stats = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const income = stats.find((s) => s._id === "income")?.total || 0;
    const expense = stats.find((s) => s._id === "expense")?.total || 0;
    const balance = income - expense;

    res.json({
      income,
      expense,
      balance,
      transactionCount:
        (stats.find((s) => s._id === "income")?.count || 0) +
        (stats.find((s) => s._id === "expense")?.count || 0),
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError")
      return res.status(403).json({ message: "Token không hợp lệ!" });
    console.error("Lỗi khi lấy thống kê:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

//Thống kê theo category
router.get("/stats/by-category", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token là bắt buộc!" });

    const decoded = jwt.verify(token, "secretkey");
    const { type } = req.query;

    const match = { user_id: new mongoose.Types.ObjectId(decoded.userId) };
    if (type && ["expense", "income"].includes(type)) match.type = type;

    const categoryStats = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$category_id",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          total: 1,
          count: 1,
          category: {
            name: { $ifNull: ["$category.name", "Không xác định"] },
            icon: { $ifNull: ["$category.icon", "default-icon"] },
          },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.json(categoryStats);
  } catch (error) {
    if (error.name === "JsonWebTokenError")
      return res.status(403).json({ message: "Token không hợp lệ!" });
    console.error("Lỗi khi lấy thống kê theo category:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
});
// Thống kê theo khoảng thời gian (tuần, tháng)
router.get("/stats/range", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token là bắt buộc!" });

    const decoded = jwt.verify(token, "secretkey");
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ message: "Thiếu tham số start hoặc end!" });
    }

    const match = {
      user_id: new mongoose.Types.ObjectId(decoded.userId),
      date: {
        $gte: new Date(start),
        $lte: new Date(end),
      },
    };

    //Group theo loại (thu, chi) và category
    const stats = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: { type: "$type", category: "$category_id" },
          total: { $sum: "$amount" },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id.category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          type: "$_id.type",
          category: {
            name: { $ifNull: ["$category.name", "Không xác định"] },
            icon: { $ifNull: ["$category.icon", null] },
          },
          total: 1,
          _id: 0,
        },
      },
    ]);

    const expenses = stats.filter((s) => s.type === "expense");
    const incomes = stats.filter((s) => s.type === "income");

    const totalExpense = expenses.reduce((sum, e) => sum + e.total, 0);
    const totalIncome = incomes.reduce((sum, e) => sum + e.total, 0);

    const overview = {
      expense: totalExpense,
      income: totalIncome,
      balance: totalIncome - totalExpense,
    };

    res.json({ overview, expenses, incomes });
  } catch (error) {
    if (error.name === "JsonWebTokenError")
      return res.status(403).json({ message: "Token không hợp lệ!" });
    console.error("Lỗi khi thống kê theo khoảng thời gian:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

module.exports = router;
