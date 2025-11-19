const express = require("express");
const jwt = require("jsonwebtoken");
const Limit = require("../models/Limit");
const Transaction = require("../models/Transaction");
const router = express.Router();

// Middleware to verify JWT
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token required!" });

  try {
    const decoded = jwt.verify(token, "secretkey");
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(403).json({ message: "Invalid token!" });
  }
};

//Set new limit
router.post("/", authenticate, async (req, res) => {
  try {
    const { amount, startDate, endDate } = req.body;

    if (!amount || !startDate || !endDate)
      return res.status(400).json({ message: "Missing required fields!" });

    //Calculate expenses within range
    const expenses = await Transaction.find({
      user_id: req.userId,
      type: "expense",
      date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    });

    const totalSpent = expenses.reduce((sum, tx) => sum + tx.amount, 0);
    const remaining = amount - totalSpent;

    const newLimit = new Limit({
      userId: req.userId,
      amount,
      startDate,
      endDate,
      remaining,
    });

    await newLimit.save();

    res.status(201).json({
      message: "Limit saved successfully!",
      remaining,
      limit: newLimit,
    });
  } catch (err) {
    console.error("Error creating limit:", err);
    res.status(500).json({ message: "Server error!" });
  }
});

//Get all limits for user
router.get("/:userId", authenticate, async (req, res) => {
  try {
    const limits = await Limit.find({ userId: req.params.userId }).sort({
      createdAt: -1,
    });
    res.json(limits);
  } catch (err) {
    console.error("Error fetching limits:", err);
    res.status(500).json({ message: "Server error!" });
  }
});

//Get active limit (if any)
router.get("/active/current", authenticate, async (req, res) => {
  try {
    const now = new Date();
    const activeLimit = await Limit.findOne({
      userId: req.userId,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ createdAt: -1 });

    if (!activeLimit) return res.json({ message: "No active limit found!" });
    res.json(activeLimit);
  } catch (err) {
    console.error("Error fetching active limit:", err);
    res.status(500).json({ message: "Server error!" });
  }
});

//Update remaining after a new expense/income
router.post("/updateRemaining", authenticate, async (req, res) => {
  try {
    const { remaining } = req.body;
    const limit = await Limit.findOneAndUpdate(
      { userId: req.userId },
      { remaining },
      { new: true }
    );

    if (!limit) {
      return res.status(404).json({ message: "No limit found to update!" });
    }

    res.json({
      message: "Remaining updated successfully!",
      remaining: limit.remaining,
    });
  } catch (err) {
    console.error("Error updating remaining:", err);
    res.status(500).json({ message: "Server error while updating remaining!" });
  }
});

module.exports = router;
