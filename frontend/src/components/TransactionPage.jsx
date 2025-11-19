import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Expense from "./Expense"; // Import Expense component
import Income from "./Income";   // Import Income component
import "../styles/TransactionPage.css"; // Create a new CSS file for this page

const TransactionPage = () => {
  const [activeTab, setActiveTab] = useState("expense"); // 'expense' or 'income'
  const navigate = useNavigate();

  // States for Limit Summary (moved here from Expense/Income)
  const [spent, setSpent] = useState(0);
  const [limit, setLimit] = useState(5000000);
  const [remaining, setRemaining] = useState(0);
  const [fetchedOverview, setFetchedOverview] = useState(null); // Store overview data

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const formatCurrency = (val) => (val || 0).toLocaleString() + " VND";

  // Fetch overview data for Limit Summary
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    const savedLimit = parseFloat(localStorage.getItem("totalLimit")) || 5000000;
    setLimit(savedLimit);

    const fetchOverviewData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const overviewRes = await axios.get(`${API_URL}/api/transactions/stats/overview`, config);
        const overviewData = overviewRes.data;
        setFetchedOverview(overviewData); // Store fetched data
        const totalSpent = overviewData.expense || 0;
        setSpent(totalSpent);
        setRemaining(savedLimit - totalSpent);
      } catch (err) {
        console.error("Error fetching overview data:", err);
        navigate("/login");
      }
    };

    fetchOverviewData();
  }, [navigate, API_URL]); // Run once

  const handleLimitChange = (e) => {
    const newLimit = Number(e.target.value);
    setLimit(newLimit);
    setRemaining(newLimit - spent);
    localStorage.setItem("totalLimit", newLimit);
  };

  return (
    // Use a consistent class name, e.g., from Expense.css or create TransactionPage.css
    <div className="expense-page"> 
      <h2 className="welcome-text">
        Welcome {localStorage.getItem("username") || "User"}!
      </h2>

      {/* Limit Summary */}
      <div className="limit-summary">
         <div className="summary-item"> <span>Total Limit:</span> <input type="number" value={limit} onChange={handleLimitChange} /> </div>
         <div className="summary-item"> <span>Total Spent:</span> <input type="text" value={formatCurrency(spent)} disabled className="spent-box" /> </div>
         <div className="summary-item"> <span>Remaining:</span> <input type="text" value={formatCurrency(remaining)} disabled className={`remaining-box ${remaining < 0 ? "negative" : ""}`} /> </div>
      </div>


      {/* Main Form Area */}
      {/* Use consistent class name, e.g., expense-form */}
      <div className="expense-form"> 
        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === "expense" ? "active" : ""}`}
            onClick={() => setActiveTab("expense")}
          >
            Expense
          </button>
          <button
            className={`tab ${activeTab === "income" ? "active" : ""}`}
            onClick={() => setActiveTab("income")}
          >
            Income
          </button>
           {/* You can add the Expense Limit tab back here if needed */}
           <button className="tab" onClick={() => alert('Chức năng "Expense Limit" chưa được cài đặt.')}>
             Expense Limit
           </button>
        </div>

        {/* Conditional Rendering */}
        {activeTab === "expense" ? (
          <Expense overviewData={fetchedOverview} /> // Pass overview data if needed by Expense
        ) : (
          <Income overviewData={fetchedOverview} /> // Pass overview data if needed by Income
        )}
      </div>

      <footer>@Copyright 2025</footer>
    </div>
  );
};

export default TransactionPage;
