const mongoose = require("mongoose");

const ReminderSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
      default: "08:00",
      validate: {
        validator: function (v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: "Time format should be HH:MM",
      },
    },
    repeat: {
      type: String,
      enum: ["Every month", "Every week", "Every day", "Never"],
      default: "Never",
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Tạo index để tối ưu truy vấn
ReminderSchema.index({ user_id: 1, date: 1 });

module.exports = mongoose.model("Reminder", ReminderSchema);
