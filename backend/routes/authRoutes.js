const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Category = require("../models/Category");
const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, role, dob, gender } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email or username already exists!" });
    }


    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role || "user",
      dob,
      gender,
    });

    await newUser.save();

    const defaultExpenseCategories = [
      { name: "Food and beverage", icon: "/icons/food-and-beverage.png" },
      { name: "Daily expenses", icon: "/icons/daily-expenses.png" },
      { name: "Clothes", icon: "/icons/clothes.png" },
      { name: "Medical", icon: "/icons/medical.png" },
      { name: "Cosmetics", icon: "/icons/cosmetics.png" },
      { name: "Contact fee", icon: "/icons/contact-fee.png" },
      { name: "Communication", icon: "/icons/communication-fees.png" },
      { name: "Travel", icon: "/icons/travel-expenses.png" },
      { name: "Education", icon: "/icons/education.png" },
      { name: "Electricity bill", icon: "/icons/electricity-bill.png" },
      { name: "Rent", icon: "/icons/rent.png" },
    ].map((cat) => ({ ...cat, type: "expense" }));

    const defaultIncomeCategories = [
      { name: "Salary", icon: "/icons/icon-12.png" },
      { name: "Bonus", icon: "/icons/icon-13.png" },
      { name: "Investment", icon: "/icons/icon-14.png" },
      { name: "Freelance", icon: "/icons/icon-15.png" },
      { name: "Side Job", icon: "/icons/icon-16.png" },
    ].map((cat) => ({ ...cat, type: "income" }));

    const allDefaultCategories = [
      ...defaultExpenseCategories,
      ...defaultIncomeCategories,
    ];

    await Category.insertMany(
      allDefaultCategories.map((cat) => ({
        ...cat,
        user_id: newUser._id,
      }))
    );

    res.status(201).json({
      message: "Registration successful!",
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        dob: newUser.dob,
        gender: newUser.gender,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error!" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Please enter username and password!" });
    }

    const user = await User.findOne({
      $or: [
        { username: new RegExp(`^${username}$`, "i") },
        { email: new RegExp(`^${username}$`, "i") }
      ]
    });

    if (!user) {
      return res.status(400).json({ message: "Incorrect username or email!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password!" });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, "secretkey", {
      expiresIn: "3h",
    });

    res.json({
      message: "Login successful!",
      token,
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error!" });
  }
});

router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, gender, dob } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    if (username) user.username = username;
    if (email) user.email = email;
    if (gender) user.gender = gender;
    if (dob) user.dob = dob;

    await user.save();

    res.json({
      message: "User information updated successfully!",
      userId: user._id,
      username: user.username,
      email: user.email,
      gender: user.gender,
      dob: user.dob,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Server error while updating user!" });
  }
});

module.exports = router;
