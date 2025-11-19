const nodemailer = require("nodemailer");

// Cấu hình EMAIL HỆ THỐNG duy nhất
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SYSTEM_EMAIL,
    pass: process.env.SYSTEM_EMAIL_PASSWORD,
  },
});

module.exports = transporter;
