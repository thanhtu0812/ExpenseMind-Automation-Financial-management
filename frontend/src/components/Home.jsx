import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import bgImage from "./assets/images/anh-may-dep-cute.jpg";
import expenseIcon from "./assets/images/expense-management.png";
import reportIcon from "./assets/images/report.png";
import chatbotIcon from "./assets/images/chatbot.png";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend as RechartsLegend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import "../styles/Home.css";

const Home = () => {
  const [activeChart, setActiveChart] = useState(0);
  const [overview, setOverview] = useState(null);
  const [expenseCategoryStats, setExpenseCategoryStats] = useState([]);
  const [incomeCategoryStats, setIncomeCategoryStats] = useState([]);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // useEffect: Fetch cả expense và income stats
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache", Pragma: "no-cache", Expires: "0",
          },
        };

        // Gọi 3 API: overview, expense categories, income categories
        const [overviewRes, expenseCatRes, incomeCatRes] = await Promise.all([
          axios.get(`${API_URL}/api/transactions/stats/overview`, config),
          axios.get(`${API_URL}/api/transactions/stats/by-category?type=expense`, config),
          axios.get(`${API_URL}/api/transactions/stats/by-category?type=income`, config),
        ]);

        setOverview(overviewRes.data);

        // Format và lưu state cho expense
        setExpenseCategoryStats(
          expenseCatRes.data.map((item) => ({
            name: item.category.name,
            value: item.total,
          }))
        );

        // Format và lưu state cho income
        setIncomeCategoryStats(
          incomeCatRes.data.map((item) => ({
            name: item.category.name,
            value: item.total,
          }))
        );

      } catch (err) {
        console.error("Error loading Home data:", err);
        navigate("/login");
      }
    };

    fetchData();
  }, [navigate, API_URL]);

  // Màu sắc có thể tùy chỉnh riêng cho từng biểu đồ
  const COLORS_EXPENSE = ["#7A5AF8", "#A06CD5", "#F28482", "#FFB703", "#219EBC"];
  const COLORS_INCOME = ["#F28482", "#7A5AF8", "#FFB703", "#A06CD5", "#8ECAE6"];
  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0 0', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '15px' }}>
        {payload.map((entry, index) => (
          <li key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: '#555' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: entry.color, marginRight: '5px', borderRadius: '50%', display: 'inline-block' }}></span>
            {entry.value}
          </li>
        ))}
      </ul>
    );
  };


  if (!overview) return (<div className="home-container" style={{ backgroundImage: `url(${bgImage})` }}></div>);

  return (
    <div className="home-container" style={{ backgroundImage: `url(${bgImage})` }}>
      <h2 className="welcome-text"> Welcome {localStorage.getItem("username") || "User"}! </h2>

      <div className="chart-section">
        <div className="charts-container">
          {activeChart === 0 ? (

            <>
              {/* --- Biểu đồ Expense --- */}
              <div className="chart-card fade-in">
                {/*  */}
                <h3 className="chart-title expense">Expense <span className="chart-date">{new Date().toLocaleDateString('en-GB', { month: 'numeric', year: 'numeric' })}</span></h3>
                {expenseCategoryStats.length > 0 ? (
                  <PieChart width={200} height={200}> {/* Giảm kích thước */}
                    <Pie
                      data={expenseCategoryStats}
                      cx="50%" // Canh giữa
                      cy="50%" // Canh giữa
                      innerRadius={50} // Điều chỉnh bán kính
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expenseCategoryStats.map((entry, index) => (
                        <Cell key={`cell-expense-${index}`} fill={COLORS_EXPENSE[index % COLORS_EXPENSE.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toLocaleString()}đ`} />

                    <RechartsLegend content={renderLegend} verticalAlign="bottom" />
                  </PieChart>
                ) : (<p className="empty-chart-text">No expense data yet</p>)}
                <p className="total-text chart-total">
                  Total:{" "}
                  <span className="total-amount expense"> {overview.expense?.toLocaleString() || 0}đ </span>
                </p>
              </div>

              {/* --- Biểu đồ Income --- */}
              <div className="chart-card fade-in">
                {/*  */}
                <h3 className="chart-title income">Income <span className="chart-date">{new Date().toLocaleDateString('en-GB', { month: 'numeric', year: 'numeric' })}</span></h3>
                {incomeCategoryStats.length > 0 ? (
                  <PieChart width={200} height={200}> {/* Giảm kích thước */}
                    <Pie
                      data={incomeCategoryStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {incomeCategoryStats.map((entry, index) => (
                        <Cell key={`cell-income-${index}`} fill={COLORS_INCOME[index % COLORS_INCOME.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toLocaleString()}đ`} />
                    {/* Chú thích tùy chỉnh */}
                    <RechartsLegend content={renderLegend} verticalAlign="bottom" />
                  </PieChart>
                ) : (<p className="empty-chart-text">No income data yet</p>)}
                <p className="total-text chart-total">
                  Total:{" "}
                  <span className="total-amount income"> {overview.income?.toLocaleString() || 0}đ </span>
                </p>
              </div>
            </>
          ) : (
            // Biểu đồ cột (giữ nguyên)
            <div className="chart-card-wide fade-in">
              <div className="chart-left">
                <h3 className="chart-title correlation"> Income vs Expense Overview </h3>
                <BarChart width={400} height={260} data={[{ label: "Overview", Income: overview.income, Expense: overview.expense, },]} >
                  <CartesianGrid strokeDasharray="3 3" /> <XAxis dataKey="label" /> <YAxis /> <Tooltip />
                  <RechartsLegend /> {/* Sử dụng RechartsLegend ở đây */}
                  <Bar dataKey="Income" fill="#7A5AF8" /> <Bar dataKey="Expense" fill="#F28482" />
                </BarChart>
              </div>
              <div className="chart-info">
                <p> <strong>Total Income:</strong>{" "} {overview.income?.toLocaleString() || 0}đ </p>
                <p> <strong>Total Expense:</strong>{" "} {overview.expense?.toLocaleString() || 0}đ </p>
                <p> <strong>Balance:</strong>{" "} {overview.balance?.toLocaleString() || 0}đ </p>
              </div>
            </div>
          )}
        </div>

        {/* Dấu chấm chuyển biểu đồ */}
        <div className="chart-dots">
          <span className={`dot ${activeChart === 0 ? "active" : ""}`} onClick={() => setActiveChart(0)}></span>
          <span className={`dot ${activeChart === 1 ? "active" : ""}`} onClick={() => setActiveChart(1)}></span>
        </div>
      </div>

      {/* Các chức năng chính (giữ nguyên) */}
      <div className="button-section">
        {/* ... */}
        <div className="feature-card" onClick={() => navigate("/add")}> <img src={expenseIcon} alt="Expense" /> <p>Expense Management</p> </div>
        <div className="feature-card" onClick={() => navigate("/report")}> <img src={reportIcon} alt="Report" /> <p>Report</p> </div>
        <div className="feature-card" onClick={() => navigate("/chatbot")}> <img src={chatbotIcon} alt="AI ExpenseMind" /> <p>Talk with AI ExpenseMind</p> </div>
      </div>
      <footer className="home-footer">@Copyright 2025</footer>
    </div>
  );
};

export default Home;