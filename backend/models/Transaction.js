const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    type: {
      type: String,
      required: true,
      enum: ["expense", "income"],
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ user_id: 1, date: -1 });
transactionSchema.index({ user_id: 1, category_id: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
