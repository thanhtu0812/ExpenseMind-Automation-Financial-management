const mongoose = require("mongoose");

const limitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    remaining: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index for quick lookups
limitSchema.index({ userId: 1, startDate: -1 });

module.exports = mongoose.model("Limit", limitSchema);
