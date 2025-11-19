const express = require("express");
const Reminder = require("../models/Reminder");
const reminderService = require("../services/reminderService");
const router = express.Router();

//Lấy tất cả reminders của user
router.get("/", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token là bắt buộc!" });
    }

    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, "secretkey");

    const reminders = await Reminder.find({ user_id: decoded.userId }).sort({
      date: 1,
    });

    res.json(reminders);
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ message: "Token không hợp lệ!" });
    }
    console.error("Lỗi khi lấy danh sách reminders:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

//Lấy reminder theo ID
router.get("/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token là bắt buộc!" });
    }

    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, "secretkey");

    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user_id: decoded.userId,
    });

    if (!reminder) {
      return res.status(404).json({ message: "Reminder không tồn tại!" });
    }

    res.json(reminder);
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ message: "Token không hợp lệ!" });
    }
    console.error("Lỗi khi lấy reminder:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

//Tạo reminder mới
router.post("/", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token là bắt buộc!" });
    }

    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, "secretkey");

    const { title, date, time, repeat } = req.body;

    if (!title || !date) {
      return res.status(400).json({
        message: "Vui lòng điền đầy đủ title và date!",
      });
    }

    const newReminder = new Reminder({
      title,
      date: new Date(date),
      time: time || "08:00",
      repeat: repeat || "Never",
      user_id: decoded.userId,
    });

    await newReminder.save();

    const populatedReminder = await Reminder.findById(newReminder._id).populate(
      "user_id"
    );
    reminderService.scheduleReminder(populatedReminder);

    res.status(201).json({
      message: "Tạo reminder thành công!",
      reminder: newReminder,
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ message: "Token không hợp lệ!" });
    }
    console.error("Lỗi khi tạo reminder:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

//Cập nhật reminder
router.put("/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token là bắt buộc!" });
    }

    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, "secretkey");

    const { title, date, time, repeat } = req.body;

    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user_id: decoded.userId,
    });

    if (!reminder) {
      return res.status(404).json({ message: "Reminder không tồn tại!" });
    }

    if (title !== undefined) reminder.title = title;
    if (date !== undefined) reminder.date = new Date(date);
    if (time !== undefined) reminder.time = time;
    if (repeat !== undefined) reminder.repeat = repeat;

    await reminder.save();

    const populatedReminder = await Reminder.findById(reminder._id).populate(
      "user_id"
    );
    reminderService.updateReminder(populatedReminder);

    res.json({
      message: "Cập nhật reminder thành công!",
      reminder,
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ message: "Token không hợp lệ!" });
    }
    console.error("Lỗi khi cập nhật reminder:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

//Xóa reminder
router.delete("/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token là bắt buộc!" });
    }

    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, "secretkey");

    const deletedReminder = await Reminder.findOneAndDelete({
      _id: req.params.id,
      user_id: decoded.userId,
    });

    if (!deletedReminder) {
      return res.status(404).json({ message: "Reminder không tồn tại!" });
    }

    reminderService.cancelReminder(req.params.id);

    res.json({ message: "Xóa reminder thành công!" });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ message: "Token không hợp lệ!" });
    }
    console.error("Lỗi khi xóa reminder:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

module.exports = router;
