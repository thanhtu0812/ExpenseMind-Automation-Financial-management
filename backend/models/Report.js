const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    email: { type: String, required: true },
    reportType: {
        type: String,
        enum: ['income', 'expense', 'total'],
        required: true
    },
    scheduledTime: { type: Date },
    status: { type: String, default: 'pending' },
    filePath: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
