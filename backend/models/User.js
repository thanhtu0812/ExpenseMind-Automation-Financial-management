const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    avatar: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/847/847969.png",
    },
    joinAt: {
      type: String,
      default: new Date().toLocaleString("en-GB", {
        month: "long",
        year: "numeric",
      }),
    },
    dob: { type: String, required: false },
    bio: {
      type: String,
      default: function () {
        return `${this.username} hasn't written a bio yet.`;
      },
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("User", UserSchema);
