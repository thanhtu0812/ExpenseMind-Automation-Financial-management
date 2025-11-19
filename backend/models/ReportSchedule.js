const mongoose = require('mongoose');

const reportScheduleSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true },
    reportType: {
        type: String,
        enum: ['income', 'expense', 'total'],
        required: true
    },
    time: { type: String },
    date: { type: String },
    sendMode: {
        type: String,
        enum: ["now", "weekly", "monthly", "later"],
        default: "now"
    },
    createdAt: { type: Date, default: Date.now }
});

const ReportSchedule = mongoose.model('ReportSchedule', reportScheduleSchema);

module.exports = ReportSchedule;
