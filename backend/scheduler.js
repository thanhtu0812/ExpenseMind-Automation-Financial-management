const cron = require('node-cron');
const ReportSchedule = require('./models/ReportSchedule');
const { createReportPDF, sendReportEmail } = require('./routes/reportRoutes');

const startScheduler = () => {
    cron.schedule('* * * * *', async () => {


        try {
            const now = new Date();
            const formatter = new Intl.DateTimeFormat('en-CA', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: 'Asia/Ho_Chi_Minh'
            });

            const parts = formatter.formatToParts(now);

            // Trích xuất ngày (YYYY-MM-DD)
            const year = parts.find(p => p.type === 'year').value;
            const month = parts.find(p => p.type === 'month').value;
            const day = parts.find(p => p.type === 'day').value;
            const currentDate = `${year}-${month}-${day}`;

            // Trích xuất giờ:phút (HH:MM)
            const hour = parts.find(p => p.type === 'hour').value;
            const minute = parts.find(p => p.type === 'minute').value;
            const currentTime = `${hour}:${minute}`;



            //  Tìm các lịch hẹn đã đến giờ gửi
            const schedulesToSend = await ReportSchedule.find({
                time: currentTime,
                date: currentDate,
                sendMode: 'later'
            });

            if (schedulesToSend.length > 0) {
                console.log(`Match found: ${schedulesToSend.length} reports to send now.`);

                for (const schedule of schedulesToSend) {
                    const dateRange = { start: schedule.date, end: schedule.date };
                    const pdfPath = await createReportPDF(schedule.userId, schedule.reportType, dateRange);
                    await sendReportEmail(schedule.email, schedule.reportType, pdfPath);
                    await ReportSchedule.findByIdAndDelete(schedule._id);

                    console.log(`Successfully sent and deleted schedule ID: ${schedule._id}`);
                }
            } else {
            }

        } catch (error) {
            console.error('Scheduler Error:', error);
        }
    });
    console.log('Scheduler started.');
};

module.exports = { startScheduler };