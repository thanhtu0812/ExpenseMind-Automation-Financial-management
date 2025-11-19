const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const router = express.Router();



const auth = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    return res.status(401).json({ message: "No token, access denied!" });
  }

  const token = authHeader.replace("Bearer ", "");
  try {
    const decoded = jwt.verify(token, "secretkey");
    req.user = decoded; 
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token!" });
  }
};
// API to get user info
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password"); // Hide password
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET: Get user list
router.get("/", auth, async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Get all info except password
    res.json(users);
  } catch (error) {
    console.error("Error getting user list:", error);
    res.status(500).json({ message: "Server error!" });
  }
});

// PUT: Update user info
router.put("/:id", auth, async (req, res) => {
  try {
    const {id } = req.params;
    const { bio, avatar, dob, email, password, currentPassword, gender, newUsername } = req.body;

    let user = await User.findById(id);

    if (!user) return res.status(404).json({ message: "User not found!" });

    if (password && password.length >= 6) {
      if (!currentPassword) {
        return res
          .status(400)
          .json({ message: "You must confirm your current password!" });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect!" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }
// Đổi username cập nhật 
     if (newUsername && newUsername !== user.username) {
      const existingUser = await User.findOne({ username: newUsername });
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists!" });
      }
      user.username = newUsername;
    }

    user.email = email || user.email;
    user.bio = bio || user.bio;
    user.dob = dob || user.dob;
    user.avatar = avatar || user.avatar;
    user.gender = gender || user.gender;

    await user.save();

    // Trả về user mới
   res.json({
      message: "Update successful!",
      user: {
        username: user.username,
        email: user.email,
        gender: user.gender,
        dob: user.dob,
        bio: user.bio,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error!" });
  }
});

// DELETE: Delete user
router.delete("/:username", async (req, res) => {
  try {
    const deletedUser = await User.findOneAndDelete({
      username: req.params.username,
    });

    if (!deletedUser)
      return res.status(404).json({ message: "User not found!" });

    res.json({ message: "User deleted successfully!" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error!" });
  }
});

// File storage configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// API to update avatar
router.put("/:id/avatar", upload.single("avatar"), async (req, res) => {
  try {
    const {id } = req.params;
    if (!req.file)
      return res.status(400).json({ message: "Please select an image!" });

    const avatarBase64 = `data:${
      req.file.mimetype
    };base64,${req.file.buffer.toString("base64")}`;

    let user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found!" });

    user.avatar = avatarBase64;
    await user.save();

    res.json({ message: "Avatar updated successfully!", avatar: avatarBase64 });
  } catch (error) {
    console.error("Error updating avatar:", error);
    res.status(500).json({ message: "Server error!" });
  }
});

module.exports = router;
