const cron = require("node-cron");
const Reminder = require("../models/Reminder");
const emailService = require("./emailService");

class ReminderService {
  constructor() {
    this.scheduledJobs = new Map();
    this.init();
  }

  init() {
    this.restartScheduledReminders();

    cron.schedule("* * * * *", () => {
      this.checkAndSendReminders();
    });
  }

  async restartScheduledReminders() {
    try {
      const now = new Date();
      const reminders = await Reminder.find({
        date: { $gte: now },
      }).populate("user_id");

      for (const reminder of reminders) {
        this.scheduleReminder(reminder);
      }
    } catch (error) {}
  }

  scheduleReminder(reminder) {
    const reminderDate = new Date(reminder.date);
    const [hours, minutes] = reminder.time.split(":");
    reminderDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    if (reminderDate <= new Date()) {
      return;
    }

    const jobId = reminder._id.toString();

    if (this.scheduledJobs.has(jobId)) {
      this.scheduledJobs.get(jobId).stop();
    }

    const delay = reminderDate.getTime() - Date.now();

    const timeoutId = setTimeout(async () => {
      try {
        await emailService.sendReminderEmail(
          reminder.user_id._id || reminder.user_id,
          reminder
        );
        await this.handleRepeatReminder(reminder);
      } catch (error) {}
    }, delay);

    this.scheduledJobs.set(jobId, { stop: () => clearTimeout(timeoutId) });
  }

  async handleRepeatReminder(reminder) {
    if (reminder.repeat === "Never") {
      return;
    }

    try {
      const newReminder = new Reminder({
        title: reminder.title,
        date: this.calculateNextDate(reminder),
        time: reminder.time,
        repeat: reminder.repeat,
        user_id: reminder.user_id,
      });

      const savedReminder = await newReminder.save();
      await savedReminder.populate("user_id");
      this.scheduleReminder(savedReminder);
    } catch (error) {}
  }

  calculateNextDate(reminder) {
    const nextDate = new Date(reminder.date);

    switch (reminder.repeat) {
      case "Every day":
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case "Every week":
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case "Every month":
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
    }

    return nextDate;
  }

  async checkAndSendReminders() {
    try {
      const now = new Date();
      const oneMinuteFromNow = new Date(now.getTime() + 60 * 1000);

      const upcomingReminders = await Reminder.find({
        date: {
          $gte: now,
          $lte: oneMinuteFromNow,
        },
      }).populate("user_id");

      for (const reminder of upcomingReminders) {
        const reminderTime = new Date(reminder.date);
        const [hours, minutes] = reminder.time.split(":");
        reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        if (reminderTime <= new Date()) {
          await emailService.sendReminderEmail(
            reminder.user_id._id || reminder.user_id,
            reminder
          );

          if (reminder.repeat === "Never") {
            await Reminder.findByIdAndDelete(reminder._id);
            this.cancelReminder(reminder._id);
          } else {
            await this.handleRepeatReminder(reminder);
            await Reminder.findByIdAndDelete(reminder._id);
            this.cancelReminder(reminder._id);
          }
        }
      }
    } catch (error) {}
  }

  cancelReminder(reminderId) {
    const jobId = reminderId.toString();
    if (this.scheduledJobs.has(jobId)) {
      this.scheduledJobs.get(jobId).stop();
      this.scheduledJobs.delete(jobId);
    }
  }

  updateReminder(reminder) {
    this.cancelReminder(reminder._id);
    this.scheduleReminder(reminder);
  }
}

module.exports = new ReminderService();
