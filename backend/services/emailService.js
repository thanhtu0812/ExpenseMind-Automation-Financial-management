const transporter = require("./emailConfig");
const User = require("../models/User");

class EmailService {
  // Gửi email nhắc nhở từ hệ thống đến user
  async sendReminderEmail(userId, reminder) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.email) {
        console.error("User not found or no email address");
        return false;
      }

      const reminderDate = new Date(reminder.date);
      const formattedDate = reminderDate.toLocaleDateString("vi-VN");
      const formattedTime = reminder.time;

      const mailOptions = {
        from: `"Expense Mind" <${process.env.SYSTEM_EMAIL}>`,
        to: user.email,
        replyTo: "no-reply@moneymanagement.com", // Email no-reply
        subject: `🔔 Reminder: ${reminder.title}`,
        html: this.generateReminderTemplate(
          user,
          reminder,
          formattedDate,
          formattedTime
        ),
      };

      const result = await transporter.sendMail(mailOptions);
      console.log(`✅ Reminder email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error("❌ Error sending reminder email:", error);
      return false;
    }
  }

  // Template email nhắc nhở
  generateReminderTemplate(user, reminder, formattedDate, formattedTime) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ff9c9c, #ff6b6b); padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">💰 Expense Mind</h1>
          <p style="margin: 5px 0 0 0; font-size: 16px;">Reminder Notification</p>
        </div>
        
        <div style="padding: 20px; background: #f9f9f9;">
          <h2 style="color: #333;">Hello ${user.username}!</h2>
          <p style="font-size: 16px; color: #555;">This is a reminder for your scheduled task:</p>
          
          <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #ff6b6b; margin: 15px 0;">
            <h3 style="color: #ff6b6b; margin: 0 0 10px 0;">${reminder.title}</h3>
            <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${formattedDate}</p>
            <p style="margin: 5px 0;"><strong>⏰ Time:</strong> ${formattedTime}</p>
            <p style="margin: 5px 0;"><strong>🔄 Repeat:</strong> ${reminder.repeat}</p>
          </div>
          
          <p style="font-size: 14px; color: #888;">
            This is an automated reminder from Expense Mind.
            <br>Please do not reply to this email.
          </p>
        </div>
        
        <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© 2025 Expense Mind. All rights reserved.</p>
        </div>
      </div>
    `;
  }
}

module.exports = new EmailService();
