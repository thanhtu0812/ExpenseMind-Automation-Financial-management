import React, { useState, useEffect, useMemo, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import axios from "axios";
import { Add } from "../components/Add";
import { SchedulePopup } from "../components/SchedulePopup";
import "../styles/Report.css";
import bgImage from "./assets/images/anh-may-dep-cute.jpg";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Combineify data for "Total" chart (combine income + expense categories)
const processChartDataForTotal = (incomeData, expenseData) => {
  const allCategories = [
    ...new Set([
      ...incomeData.map((i) => i.category),
      ...expenseData.map((e) => e.category),
    ]),
  ];

  const incomeMap = new Map(
    incomeData.map((item) => [item.category, item.amount])
  );
  const expenseMap = new Map(
    expenseData.map((item) => [item.category, item.amount])
  );

  const incomeAmounts = allCategories.map((cat) => incomeMap.get(cat) || 0);
  const expenseAmounts = allCategories.map((cat) => expenseMap.get(cat) || 0);

  return { categories: allCategories, incomeAmounts, expenseAmounts };
};

export const Report = () => {
  const [activeChart, setActiveChart] = useState("expenses");
  const [overview, setOverview] = useState(null);
  const [expenseData, setExpenseData] = useState([]);
  const [incomeData, setIncomeData] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [mode, setMode] = useState("week");
  const [rangeObj, setRangeObj] = useState({ start: "", end: "" });
  const [rangeLabel, setRangeLabel] = useState("");
  const scheduleButtonRef = useRef(null);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // Calculate current period (week or month) based on offset
  const getRange = (offset = 0) => {
    const today = new Date();
    let start, end;

    if (mode === "week") {
      const currentDay = today.getDay() || 7;
      start = new Date(today);
      start.setDate(today.getDate() - currentDay + 1 + offset * 7);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
    } else {
      start = new Date(today.getFullYear(), today.getMonth() + offset, 1);
      end = new Date(today.getFullYear(), today.getMonth() + offset + 1, 0);
    }

    const fmt = (d) => d.toLocaleDateString("vi-VN");
    setRangeLabel(`${fmt(start)} - ${fmt(end)}`);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    setRangeObj({ start: start.toISOString(), end: end.toISOString() });

    return { startISO: start.toISOString(), endISO: end.toISOString() };
  };

  // Fetch report data whenever period changes
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const { startISO, endISO } = getRange(weekOffset);
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const res = await axios.get(
          `${API_URL}/api/transactions/stats/range?start=${startISO}&end=${endISO}`,
          config
        );

        const data = res.data;
        setOverview(data.overview);

        // Normalize expense data
        setExpenseData(
          data.expenses.map((i) => {
            let iconName = i.category.icon || "";
            if (iconName && !iconName.startsWith("http")) {
              iconName = iconName.replace(/^\/icons\//, "").replace(/^\//, "");
            }
            return {
              category: i.category.name,
              amount: i.total,
              icon: i.category.icon
                ? i.category.icon.startsWith("http")
                  ? i.category.icon
                  : `${API_URL}/icons/${iconName}`
                : null,
            };
          })
        );

        // Normalize income data
        setIncomeData(
          data.incomes.map((i) => {
            let iconName = i.category.icon || "";
            if (iconName && !iconName.startsWith("http")) {
              iconName = iconName.replace(/^\/icons\//, "").replace(/^\//, "");
            }
            return {
              category: i.category.name,
              amount: i.total,
              icon: i.category.icon
                ? i.category.icon.startsWith("http")
                  ? i.category.icon
                  : `${API_URL}/icons/${iconName}`
                : null,
            };
          })
        );
      } catch (err) {
        console.error("Error loading report data:", err);
      }
    };

    fetchReportData();
  }, [weekOffset, mode]);

  // Prepare chart and list data based on active tab
  const { currentListData, currentChartDatasets, categories, maxAmount } =
    useMemo(() => {
      let listData = [];
      let datasets = [];
      let chartCategories = [];
      let amountsForMax = [];

      if (activeChart === "total") {
        const processed = processChartDataForTotal(incomeData, expenseData);
        chartCategories = processed.categories;
        amountsForMax = [
          ...processed.incomeAmounts,
          ...processed.expenseAmounts,
        ];

        datasets = [
          {
            label: "Chi Tiêu",
            data: processed.expenseAmounts,
            borderColor: "#FD0509",
            backgroundColor: "rgba(253,5,9,0.05)",
            tension: 0.4,
            pointBackgroundColor: "#fff",
            pointBorderColor: "#FD0509",
            borderWidth: 1.5,
          },
          {
            label: "Thu Nhập",
            data: processed.incomeAmounts,
            borderColor: "#3b05fdff",
            backgroundColor: "rgba(5,253,9,0.05)",
            tension: 0.4,
            pointBackgroundColor: "#fff",
            pointBorderColor: "#3b05fdff",
            borderWidth: 1.5,
          },
        ];
        listData = expenseData; // Show expenses by default in Total view
      } else {
        listData = activeChart === "income" ? incomeData : expenseData;
        chartCategories = listData.map((item) => item.category);
        amountsForMax = listData.map((item) => item.amount);

        datasets = [
          {
            label: activeChart === "expenses" ? "Chi Tiêu" : "Thu Nhập",
            data: amountsForMax,
            borderColor: activeChart === "expenses" ? "#FD0509" : "#3b05fdff",
            backgroundColor:
              activeChart === "expenses"
                ? "rgba(253,5,9,0.05)"
                : "rgba(5,253,9,0.05)",
            tension: 0.4,
            pointBackgroundColor: "#fff",
            pointBorderColor:
              activeChart === "expenses" ? "#FD0509" : "#3b05fdff",
            borderWidth: 1.5,
          },
        ];
      }

      return {
        currentListData: listData,
        currentChartDatasets: datasets,
        categories: chartCategories,
        maxAmount: Math.max(...amountsForMax, 10000000),
      };
    }, [activeChart, incomeData, expenseData]);

  const yAxisMax = Math.ceil(maxAmount / 10000000) * 10000000;

  const lineChartData = useMemo(
    () => ({
      labels: categories,
      datasets: currentChartDatasets,
    }),
    [categories, currentChartDatasets]
  );

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: yAxisMax,
        ticks: { callback: (v) => `${v / 1000000}M` },
      },
    },
  };

  const formatCurrency = (n) => (n || 0).toLocaleString("vi-VN") + "đ";

  const handlePrev = () => setWeekOffset((p) => p - 1);
  const handleNext = () => setWeekOffset((p) => p + 1);

  if (!overview)
    return (
      <div className="report" style={{ backgroundImage: `url(${bgImage})` }} />
    );

  return (
    <div className="report" style={{ backgroundImage: `url(${bgImage})` }}>
      <h2 className="welcome-text">
        Welcome {localStorage.getItem("username")}!
      </h2>

      <div className="content-wrapper">
        <div className="header-section">
          <div className="text-wrapper-2">Report</div>
        </div>

        {/* Week / Month toggle */}
        <div className="mode-toggle">
          <button
            className={`chart-tab ${mode === "week" ? "active" : ""}`}
            onClick={() => setMode("week")}
          >
            Week
          </button>
          <button
            className={`chart-tab ${mode === "month" ? "active" : ""}`}
            onClick={() => setMode("month")}
          >
            Month
          </button>
        </div>

        {/* Period navigation */}
        <div className="date-navigation">
          <button className="nav-button" onClick={handlePrev}>
            <img
              src="https://c.animaapp.com/gqg0MPxK/img/group-7.png"
              alt="Prev"
            />
          </button>
          <div className="text-wrapper-4">{rangeLabel}</div>
          <button className="nav-button" onClick={handleNext}>
            <img
              src="https://c.animaapp.com/gqg0MPxK/img/group-4.png"
              alt="Next"
            />
          </button>
        </div>

        {/* Summary */}
        <div className="summary-section">
          <div className="summary-row">
            <div className="summary-item">
              <div className="text-wrapper-5">Expenses</div>
              <div className="summary-amount">
                {formatCurrency(overview.expense)}
              </div>
            </div>
            <div className="summary-item">
              <div className="text-wrapper-7">Income</div>
              <div className="summary-amount">
                {formatCurrency(overview.income)}
              </div>
            </div>
          </div>
          <div className="summary-row-full">
            <div className="summary-item-full">
              <div className="text-wrapper-9">Saving</div>
              <div className="summary-amount">
                {formatCurrency(overview.balance)}
              </div>
            </div>
          </div>
        </div>

        {/* Chart type selector */}
        <div className="chart-tabs-selection">
          <button
            className={`chart-tab ${
              activeChart === "expenses" ? "active-chart-tab" : ""
            }`}
            onClick={() => setActiveChart("expenses")}
          >
            Expenses
          </button>
          <button
            className={`chart-tab ${
              activeChart === "income" ? "active-chart-tab" : ""
            }`}
            onClick={() => setActiveChart("income")}
          >
            Income
          </button>
          <button
            className={`chart-tab ${
              activeChart === "total" ? "active-chart-tab" : ""
            }`}
            onClick={() => setActiveChart("total")}
          >
            Total
          </button>
        </div>

        {/* Line chart */}
        <div className="chart-container">
          <Line data={lineChartData} options={chartOptions} />
        </div>

        {/* Detail list */}
        <div className="expense-list">
          {currentListData.map((item, i) => (
            <div key={i} className="expense-item">
              {item.icon ? (
                <img
                  src={item.icon}
                  alt={item.category}
                  className="expense-icon"
                  onError={(e) => (e.target.style.display = "none")}
                />
              ) : (
                <div className="expense-icon-placeholder" />
              )}
              <div className="expense-category">{item.category}</div>
              <div className="expense-amount">
                {formatCurrency(item.amount)}
              </div>
            </div>
          ))}
        </div>

        {/* Schedule report button */}
        <button
          className="schedule-button"
          onClick={() => setShowPopup(true)}
          ref={scheduleButtonRef}
        >
          <Add
            add="https://c.animaapp.com/gqg0MPxK/img/add-1.svg"
            className="add-icon"
          />
          <span>Schedule Report</span>
        </button>
      </div>

      {showPopup && (
        <SchedulePopup
          onClose={() => setShowPopup(false)}
          mode={mode}
          dateRange={rangeObj}
          buttonRef={scheduleButtonRef}
        />
      )}

      <footer className="calendar-footer">@Copyright 2025</footer>
    </div>
  );
};

export default Report;
