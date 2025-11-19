import React, { useState, useEffect } from "react";
import "../styles/ExpenseLimit.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const ExpenseLimit = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [amount, setAmount] = useState("");
  const [limitApplied, setLimitApplied] = useState(false);
  const [remainingLimit, setRemainingLimit] = useState(null);
  const username = localStorage.getItem("username") || "User";

  const formatDate = (date) => date.toISOString().split("T")[0];

  const handlePrevDate = (setter, current) => {
    const newDate = new Date(current);
    newDate.setDate(current.getDate() - 1);
    setter(newDate);
  };

  const handleNextDate = (setter, current) => {
    const newDate = new Date(current);
    newDate.setDate(current.getDate() + 1);
    setter(newDate);
  };

  // Fetch total expense within selected range
  const fetchExpensesInRange = async (token, start, end) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/transactions?type=expense&startDate=${start}&endDate=${end}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (response.ok) {
        const totalSpent = data.transactions.reduce(
          (sum, tx) => sum + tx.amount,
          0
        );
        return totalSpent;
      }
    } catch (err) {
      console.error("Error fetching expenses:", err);
    }
    return 0;
  };

  // Handle OK (save limit and show remaining)
  const handleOK = async () => {
    if (!amount || !startDate || !endDate) {
      alert("Please fill all fields!");
      return;
    }

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      alert("Please login first!");
      return;
    }

    try {
      const totalSpent = await fetchExpensesInRange(
        token,
        formatDate(startDate),
        formatDate(endDate)
      );

      const remaining = Number(amount) - totalSpent;

      await fetch("http://localhost:5000/api/limits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          amount: Number(amount),
          startDate,
          endDate,
          remaining,
        }),
      });

      // Lưu vào localStorage để các tab khác dùng chung
      localStorage.setItem("totalLimit", amount);
      localStorage.setItem("remainingLimit", remaining);
      localStorage.setItem("limitStart", startDate);
      localStorage.setItem("limitEnd", endDate);

      setRemainingLimit(remaining);
      setLimitApplied(true);
      alert("✅ Limit applied successfully!");
    } catch (error) {
      console.error("Error applying limit:", error);
      alert("❌ Failed to apply limit!");
    }
  };

  // Handle Cancel (reset form)
  const handleCancel = () => {
    setAmount("");
    setStartDate(new Date());
    setEndDate(new Date());
    setRemainingLimit(null);
    setLimitApplied(false);
  };

  return (
    <div className="expense-page">
      <h2 className="welcome-text">Welcome {username}!</h2>

      <div className="expense-form">
        <div className="tabs">
          <button
            className="tab"
            onClick={() => (window.location.href = "/add")}
          >
            Expense
          </button>
          <button
            className="tab"
            onClick={() => (window.location.href = "/income")}
          >
            Income
          </button>
          <button className="tab active">
            {limitApplied
              ? `Expense Limit: ${remainingLimit} VND`
              : "Expense Limit"}
          </button>
        </div>

        <div className="form-group">
          <label>Start Date</label>
          <div className="date-navigation">
            <button
              className="nav-btn"
              onClick={() => handlePrevDate(setStartDate, startDate)}
            >
              <FaChevronLeft />
            </button>
            <input
              type="date"
              className="date-picker"
              value={formatDate(startDate)}
              onChange={(e) => setStartDate(new Date(e.target.value))}
            />
            <button
              className="nav-btn"
              onClick={() => handleNextDate(setStartDate, startDate)}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>End Date</label>
          <div className="date-navigation">
            <button
              className="nav-btn"
              onClick={() => handlePrevDate(setEndDate, endDate)}
            >
              <FaChevronLeft />
            </button>
            <input
              type="date"
              className="date-picker"
              value={formatDate(endDate)}
              onChange={(e) => setEndDate(new Date(e.target.value))}
            />
            <button
              className="nav-btn"
              onClick={() => handleNextDate(setEndDate, endDate)}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Limit amount (VND)</label>
          <input
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button className="submit-btn" onClick={handleOK}>
            OK
          </button>
          <button className="cancel-btn" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>

      <footer>@Copyright 2025</footer>
    </div>
  );
};

export default ExpenseLimit;
