const express = require("express");
const Category = require("../models/Category");
const jwt = require("jsonwebtoken");
const router = express.Router();
const mongoose = require("mongoose");

//List category
router.get("/", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token là bắt buộc!" });

    const decoded = jwt.verify(token, "secretkey");
    const { type } = req.query;

    const filter = {
      user_id: new mongoose.Types.ObjectId(decoded.userId),
    };
    if (type) filter.type = type;

    const categories = await Category.find(filter);
    res.json(categories);
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res
        .status(401)
        .json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
    }
    console.error("Lỗi khi lấy danh mục:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh mục!" });
  }
});

//Create category
router.post("/", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token là bắt buộc!" });

    const decoded = jwt.verify(token, "secretkey");
    const { name, icon, type } = req.body;

    if (!name || !icon || !type)
      return res.status(400).json({ message: "Thiếu name, icon hoặc type!" });

    const newCat = new Category({
      name,
      icon,
      type,
      user_id: decoded.userId,
      is_default: false,
    });

    await newCat.save();
    res.status(201).json(newCat);
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res
        .status(401)
        .json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
    }

    if (error.code === 11000) {
      return res.status(400).json({ message: "Category name already exists!" });
    }

    console.error("Lỗi khi thêm category:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

module.exports = router;
