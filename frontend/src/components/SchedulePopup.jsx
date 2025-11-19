import React, { useState, useEffect, useRef } from "react"; // ✅ Đã thêm import useRef
import "../styles/Report.css";

// Hàm tiện ích để lấy token từ localStorage
const getToken = () => {
    return localStorage.getItem("token"); // Dùng logic lấy token của bạn
};

// Thêm buttonRef vào props
export const SchedulePopup = ({ onClose, mode, dateRange, buttonRef }) => {
    const [timeSettings, setTimeSettings] = useState("");
    const [dateSettings, setDateSettings] = useState("");
    const [sendTo, setSendTo] = useState("");
    const [reportType, setReportType] = useState("");
    const [isNotBot, setIsNotBot] = useState(false);
    const [scheduledReports, setScheduledReports] = useState([]);

    // Đã loại bỏ state showForm vì component cha (Report.jsx) đã quản lý việc hiển thị

    const popupRef = useRef(null);
    const [popoverStyle, setPopoverStyle] = useState({});

    const API_URL = "http://localhost:5000/api/reports/schedule";

    // --- 1. LOGIC LẤY DATA (Chạy 1 lần khi mount) ---
    const fetchScheduledReports = async () => {
        try {
            const token = getToken();
            if (!token) return;

            const response = await fetch(API_URL, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });

            if (response.ok) {
                const data = await response.json();
                setScheduledReports(data);
            } else {
                console.error("Failed to fetch scheduled reports:", response.statusText);
            }
        } catch (err) {
            console.error("Error loading reports:", err);
        }
    };

    useEffect(() => {
        fetchScheduledReports();
    }, []);


    useEffect(() => {
        // 1. Tính toán vị trí Popover
        if (buttonRef && buttonRef.current && popupRef && popupRef.current) {
            const buttonRect = buttonRef.current.getBoundingClientRect();
            const popupHeight = popupRef.current.offsetHeight; // ✅ LẤY CHIỀU CAO CỦA POPUP

            setPopoverStyle({

                top: buttonRect.top - popupHeight - 10,
                right: window.innerWidth - buttonRect.right,
                position: 'fixed',
            });
        }
        // 2.2. Logic Click Outside
        function handleClickOutside(event) {
            if (
                popupRef.current &&
                !popupRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target) // Không đóng nếu click vào nút kích hoạt
            ) {
                onClose();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [buttonRef, onClose]);

    const resetForm = () => {
        setTimeSettings("");
        setDateSettings("");
        setSendTo("");
        setReportType("");
        setIsNotBot(false);
    }

    // --- 3. Xử lý Đặt Lịch (Book Now) ---
    const handleBookNow = async () => {
        if (!isNotBot || !timeSettings || !dateSettings || !reportType || !sendTo) {
            alert("Please fill in all fields (Time/Date/Email/Report Type) and confirm you're not a bot!");
            return;
        }

        const token = getToken();
        if (!token) {
            alert("Authentication failed. Please log in again.");
            return;
        }

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    reportType,
                    time: timeSettings,
                    date: dateSettings,
                    email: sendTo,
                    sendMode: "later",
                    mode,
                    dateRange,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                alert("Report scheduled successfully!");
                fetchScheduledReports();
            } else {
                alert(result.message || "Failed to schedule report.");
            }

            resetForm();

        } catch (error) {
            console.error("Error saving report:", error);
            alert("An error occurred while scheduling the report.");
        }
    };

    // --- 4. Xử lý Gửi Ngay (Send Now) ---
    const handleSendNow = async () => {
        if (!sendTo || !reportType || !isNotBot) {
            return alert("Please enter an email, select a report type, and confirm you're not a bot.");
        }
        const token = getToken();
        if (!token) {
            alert("Authentication failed. Please log in again.");
            return;
        }

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    reportType,
                    email: sendTo,
                    sendMode: "now",
                    mode,
                    dateRange,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                alert("Report sent immediately!");
                onClose();
            } else {
                alert(result.message || "Failed to send report immediately.");
            }

        } catch (error) {
            console.error("Error sending now:", error);
            alert("An error occurred while sending the report.");
        }
    };

    // --- 5. Xử lý Hủy (Cancel) ---
    const handleCancel = () => {
        resetForm();
        onClose();
    };

    // --- 6. Xử lý Xóa Lịch Hẹn ---
    const handleDeleteReport = async (scheduleId) => {
        if (!window.confirm("Are you sure you want to delete this scheduled report?")) return;

        const token = getToken();
        if (!token) {
            alert("Authentication failed. Please log in again.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/${scheduleId}`, {
                method: "DELETE",
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setScheduledReports((prev) => prev.filter((r) => r._id !== scheduleId));
                alert("Schedule cancelled successfully.");
            } else {
                const result = await response.json();
                alert(result.message || "Failed to cancel schedule.");
            }
        } catch (error) {
            console.error("Error deleting schedule:", error);
            alert("An error occurred while cancelling the schedule.");
        }
    };


    return (
        //  Dùng schedule-popover và áp style đã tính toán
        <div className="schedule-popover" style={popoverStyle}>

            <div className="schedule-popup-box animate-popup" ref={popupRef}>
                <header>
                    <h2>Schedule Report</h2>
                </header>

                <form>
                    <div className="form-row">
                        <label>Time Settings</label>
                        <input
                            type="time"
                            value={timeSettings}
                            onChange={(e) => setTimeSettings(e.target.value)}
                        />
                    </div>

                    <div className="form-row">
                        <label>Date Settings</label>
                        <input
                            type="date"
                            value={dateSettings}
                            onChange={(e) => setDateSettings(e.target.value)}
                        />
                    </div>

                    <div className="form-row">
                        <label>Send To</label>
                        <input
                            type="email"
                            placeholder="Email"
                            value={sendTo}
                            onChange={(e) => setSendTo(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <label>Report Type</label>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            required
                        >
                            <option value="">Select</option>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                            <option value="total">Total</option>
                        </select>
                    </div>

                    <div className="form-checkbox">
                        <input
                            type="checkbox"
                            checked={isNotBot}
                            onChange={(e) => setIsNotBot(e.target.checked)}
                            required
                        />
                        <span>Confirm you're not a Bot</span>
                    </div>

                    <div className="button-group">
                        <button type="button" onClick={handleBookNow}>Book Now</button>
                        <button type="button" onClick={handleSendNow}>Send Now</button>
                        <button type="button" onClick={handleCancel}>Cancel</button>
                    </div>
                </form>

                <section>
                    <h3>Scheduled Reports ({scheduledReports.length})</h3>
                    {scheduledReports.length === 0 ? (
                        <p>No reports scheduled.</p>
                    ) : (
                        scheduledReports.map((report) => (
                            <article key={report._id}>
                                <div>
                                    <strong>{report.reportType} Report</strong>
                                    <p>Time: {report.time}, Date: {report.date}, Send to: {report.email}</p>
                                </div>
                                <button onClick={() => handleDeleteReport(report._id)}>✖</button>
                            </article>
                        ))
                    )}
                </section>
            </div>
        </div>
    );
};

export default SchedulePopup;