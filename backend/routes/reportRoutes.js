const express = require("express");
const router = express.Router();
const mongoose = require("mongoose"); // Cần thiết để xử lý ObjectId
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const Transaction = require("../models/Transaction");
const Report = require("../models/Report");
const ReportSchedule = require('../models/ReportSchedule');
const { protect } = require('../middleware/authMiddleware');

// Cấu hình gửi email
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "thanhtutrinh26@gmail.com",
        pass: "ddsyqzarojqjrjcg",
    },
});

// Tạo file PDF từ dữ liệu thu chi
async function createReportPDF(userId, reportType, dateRange) {
    const reportsDir = path.join(__dirname, "../reports");
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }
    const filePath = path.join(__dirname, `../reports/${userId}_${reportType}.pdf`);
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Chuyển đổi userId (string) thành ObjectId để truy vấn DB
    const validUserId = new mongoose.Types.ObjectId(userId);

    let dateFilter = {};
    if (dateRange && dateRange.start && dateRange.end) {
        const startDate = new Date(dateRange.start);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        dateFilter = {
            date: { $gte: startDate, $lte: endDate },
        };
    }

    // Lọc giao dịch theo user_id + thời gian + loại
    let filter = { user_id: validUserId, ...dateFilter };
    if (reportType === "income" || reportType === "expense") {
        filter.type = reportType;
    }

    // Lấy dữ liệu từ DB
    const transactions = await Transaction.find(filter)
        .populate({
            path: 'category_id',
            select: 'name icon'
        });

    const totalIncome = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    // Ghi nội dung PDF
    doc.fontSize(20).text(`Financial Report (${reportType})`, { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Total Income: ${totalIncome} VND`);
    doc.text(`Total Expense: ${totalExpense} VND`);
    doc.text(`Balance: ${balance} VND`);
    doc.moveDown();

    doc.fontSize(12).text("Details:");
    transactions.forEach(t => {
        doc.text(`- ${t.date.toLocaleDateString()}: ${t.category_id.name} - ${t.type} - ${t.amount} VND`);
    });

    doc.end();

    // Chờ file được ghi xong
    await new Promise(resolve => stream.on("finish", resolve));
    return filePath;
}

async function sendReportEmail(email, reportType, pdfPath) {
    const mailOptions = {
        from: "thanhtutrinh26@gmail.com",
        to: email,
        subject: `Your ${reportType} Financial Report`,
        text: `Here is your ${reportType} financial report.`,
        attachments: [{ filename: `${reportType}_report.pdf`, path: pdfPath }],
    };
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Gmail response:", info.response);

    fs.unlinkSync(pdfPath);
}

// Lấy danh sách lịch hẹn (FIXED 1: Dùng ObjectId để tìm kiếm)

router.get("/schedule", protect, async (req, res) => {
    try {
        const userId = req.userId;

        const validUserId = new mongoose.Types.ObjectId(userId);

        const schedules = await ReportSchedule.find({ userId: validUserId, sendMode: 'later' }).select('-userId -__v');
        return res.status(200).json(schedules);
    } catch (error) {
        console.error(" Error fetching scheduled reports:", error);
        res.status(500).json({ message: "Error fetching scheduled reports" });
    }
});

router.post("/schedule", protect, async (req, res) => {
    const userId = req.userId;
    const { reportType, time, date, email, sendMode, dateRange } = req.body;

    if (!reportType || !email) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        if (sendMode === "now") {
            // Tạo và gửi ngay
            const pdfPath = await createReportPDF(userId, reportType, dateRange);
            await sendReportEmail(email, reportType, pdfPath);
            return res.status(200).json({ message: "Report sent successfully!" });
        }
        else {
            // Lưu vào MongoDB để gửi sau (Book Now)
            const newSchedule = new ReportSchedule({
                email: email,
                reportType,
                time,
                date,
                sendMode,
                userId,
            });
            await newSchedule.save();



            return res.status(201).json({ message: "Report scheduled successfully!" });
        }
    } catch (error) {
        console.error("Error scheduling/sending report:", error);
        res.status(500).json({ message: "Error scheduling/sending report" });
    }
});


router.delete("/schedule/:id", protect, async (req, res) => {
    try {
        const scheduleId = req.params.id;
        const userId = req.userId;


        const validUserId = new mongoose.Types.ObjectId(userId);


        const result = await ReportSchedule.findOneAndDelete({
            _id: scheduleId,
            userId: validUserId
        });

        if (!result) {

            return res.status(404).json({ message: "Schedule not found or unauthorized" });
        }

        return res.status(200).json({ message: "Schedule deleted successfully" });

    } catch (error) {
        console.error("Error deleting scheduled report:", error);
        res.status(500).json({ message: "Error deleting scheduled report" });
    }
});


module.exports = { router, createReportPDF, sendReportEmail };