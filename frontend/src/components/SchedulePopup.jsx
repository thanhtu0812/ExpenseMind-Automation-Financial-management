import React, { useState, useEffect, useRef } from "react";
import "../styles/Report.css";

// Helper to get JWT token from localStorage
const getToken = () => localStorage.getItem("token");

export const SchedulePopup = ({ onClose, mode, dateRange, buttonRef }) => {
  const [timeSettings, setTimeSettings] = useState("");
  const [dateSettings, setDateSettings] = useState("");
  const [sendTo, setSendTo] = useState("");
  const [reportType, setReportType] = useState("");
  const [isNotBot, setIsNotBot] = useState(false);
  const [scheduledReports, setScheduledReports] = useState([]);

  const popupRef = useRef(null);
  const [popoverStyle, setPopoverStyle] = useState({});

  const API_URL = "http://localhost:5000/api/reports/schedule";

  // Fetch existing scheduled reports on mount
  const fetchScheduledReports = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setScheduledReports(data);
      }
    } catch (err) {
      console.error("Error loading scheduled reports:", err);
    }
  };

  useEffect(() => {
    fetchScheduledReports();
  }, []);

  // Position popup above the trigger button + click-outside handler
  useEffect(() => {
    if (!buttonRef?.current || !popupRef?.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const popupHeight = popupRef.current.offsetHeight;

    setPopoverStyle({
      top: buttonRect.top - popupHeight - 10,
      right: window.innerWidth - buttonRect.right,
      position: "fixed",
    });

    const handleClickOutside = (event) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [buttonRef, onClose]);

  const resetForm = () => {
    setTimeSettings("");
    setDateSettings("");
    setSendTo("");
    setReportType("");
    setIsNotBot(false);
  };

  // Schedule report for later
  const handleBookNow = async () => {
    if (!isNotBot || !timeSettings || !dateSettings || !reportType || !sendTo) {
      alert("Please fill all fields and confirm you're not a bot.");
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
          Authorization: `Bearer ${token}`,
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
        resetForm();
      } else {
        alert(result.message || "Failed to schedule report.");
      }
    } catch (error) {
      console.error("Error scheduling report:", error);
      alert("An error occurred while scheduling the report.");
    }
  };

  // Send report immediately
  const handleSendNow = async () => {
    if (!sendTo || !reportType || !isNotBot) {
      alert(
        "Please enter email, select report type and confirm you're not a bot."
      );
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
          Authorization: `Bearer ${token}`,
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
        alert(result.message || "Failed to send report.");
      }
    } catch (error) {
      console.error("Error sending report now:", error);
      alert("An error occurred while sending the report.");
    }
  };

  // Cancel and close popup
  const handleCancel = () => {
    resetForm();
    onClose();
  };

  // Delete a scheduled report
  const handleDeleteReport = async (scheduleId) => {
    if (!window.confirm("Delete this scheduled report?")) return;

    const token = getToken();
    if (!token) {
      alert("Authentication failed.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${scheduleId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setScheduledReports((prev) => prev.filter((r) => r._id !== scheduleId));
        alert("Schedule cancelled.");
      } else {
        const result = await response.json();
        alert(result.message || "Failed to cancel schedule.");
      }
    } catch (error) {
      console.error("Error deleting schedule:", error);
      alert("Failed to cancel schedule.");
    }
  };

  return (
    <div className="schedule-popover" style={popoverStyle}>
      <div className="schedule-popup-box animate-popup" ref={popupRef}>
        <header>
          <h2>Schedule Report</h2>
        </header>

        <form onSubmit={(e) => e.preventDefault()}>
          <div className="form-row">
            <label>Time</label>
            <input
              type="time"
              value={timeSettings}
              onChange={(e) => setTimeSettings(e.target.value)}
            />
          </div>

          <div className="form-row">
            <label>Date</label>
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
            />
          </div>

          <div className="form-row">
            <label>Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
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
            />
            <span>I'm not a bot</span>
          </div>

          <div className="button-group">
            <button type="button" onClick={handleBookNow}>
              Book Now
            </button>
            <button type="button" onClick={handleSendNow}>
              Send Now
            </button>
            <button type="button" onClick={handleCancel}>
              Cancel
            </button>
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
                  <p>
                    Time: {report.time}, Date: {report.date}, To: {report.email}
                  </p>
                </div>
                <button onClick={() => handleDeleteReport(report._id)}>
                  Delete
                </button>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
};

export default SchedulePopup;
