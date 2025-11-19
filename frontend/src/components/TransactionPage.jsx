import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Expense from "./Expense";
import Income from "./Income";
import "../styles/TransactionPage.css";
const TransactionPage = () => {
  const [activeTab, setActiveTab] = useState("expense");
  const navigate = useNavigate();

  // States for Limit Summary (moved here from Expense/Income)
  const [spent, setSpent] = useState(0);
  const [limit, setLimit] = useState(5000000);
  const [remaining, setRemaining] = useState(0);
  const [fetchedOverview, setFetchedOverview] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const formatCurrency = (val) => (val || 0).toLocaleString() + " VND";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const savedLimit =
      parseFloat(localStorage.getItem("totalLimit")) || 5000000;
    setLimit(savedLimit);

    const fetchOverviewData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const overviewRes = await axios.get(
          `${API_URL}/api/transactions/stats/overview`,
          config
        );
        const overviewData = overviewRes.data;
        setFetchedOverview(overviewData);
        const totalSpent = overviewData.expense || 0;
        setSpent(totalSpent);
        setRemaining(savedLimit - totalSpent);
      } catch (err) {
        console.error("Error fetching overview data:", err);
        navigate("/login");
      }
    };

    fetchOverviewData();
  }, [navigate, API_URL]);

  const handleLimitChange = (e) => {
    const newLimit = Number(e.target.value);
    setLimit(newLimit);
    setRemaining(newLimit - spent);
    localStorage.setItem("totalLimit", newLimit);
  };

  return (
    <div className="expense-page">
      <h2 className="welcome-text">
        Welcome {localStorage.getItem("username") || "User"}!
      </h2>

      <div className="expense-form">
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
        </div>

        {/* Conditional Rendering */}
        {activeTab === "expense" ? (
          <Expense overviewData={fetchedOverview} />
        ) : (
          <Income overviewData={fetchedOverview} />
        )}
      </div>

      <footer className="transaction-footer">@Copyright 2025</footer>
    </div>
  );
};

export default TransactionPage;
