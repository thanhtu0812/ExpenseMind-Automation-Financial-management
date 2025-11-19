import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
} from "lucide-react";
import axios from "axios";
import bgImage from "./assets/images/anh-may-dep-cute.jpg";
import "../styles/Calendar.css";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [activeTab, setActiveTab] = useState("reminders");
  const [reminders, setReminders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "08:00",
    repeat: "Never",
  });
  const [transactionForm, setTransactionForm] = useState({
    amount: "",
    description: "",
    type: "expense",
    category_id: "",
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // Helper function to get local date string in YYYY-MM-DD format
  const getLocalDateString = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Thêm useEffect để cảnh báo khi rời trang
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue =
          "Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn rời đi?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        navigate("/login");
        return;
      }

      try {
        await Promise.all([
          fetchReminders(),
          fetchTransactions(),
          fetchCategories(),
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    checkAuthAndFetchData();
  }, [navigate]);

  // Fetch reminders
  const fetchReminders = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${API_URL}/api/reminders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReminders(response.data);
    } catch (error) {
      console.error("Failed to fetch reminders:", error);
      if (error.response?.status === 401) {
        handleTokenExpired();
      }
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${API_URL}/api/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 10000 }, // Fetch more transactions for calendar indicators
      });
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      if (error.response?.status === 401) {
        handleTokenExpired();
      }
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      if (error.response?.status === 401) {
        handleTokenExpired();
      }
    }
  };

  const handleTokenExpired = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    navigate("/login");
  };

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    return firstDay;
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const prevMonthDays = getDaysInMonth(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );

    const days = [];

    // Add previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Add current month days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday =
        i === today.getDate() &&
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear();

      days.push({
        day: i,
        isCurrentMonth: true,
        isToday,
        hasReminder: reminders.some((r) => {
          const reminderDateStr = getLocalDateString(r.date);
          const currentDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
          return reminderDateStr === currentDateStr;
        }),
        hasTransaction: transactions.some((t) => {
          const transactionDateStr = getLocalDateString(t.date);
          const currentDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
          return transactionDateStr === currentDateStr;
        }),
      });
    }

    // Add next month days to complete the grid
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  };

  // Hàm kiểm tra form reminder có thay đổi không
  const hasFormChanges = () => {
    return (
      formData.title.trim() !== "" ||
      formData.date !== "" ||
      formData.time !== "08:00" ||
      formData.repeat !== "Never"
    );
  };

  // Hàm kiểm tra form transaction có thay đổi không
  const hasTransactionFormChanges = () => {
    return (
      transactionForm.amount !== "" ||
      transactionForm.description !== "" ||
      transactionForm.category_id !== ""
    );
  };

  // Hàm hiển thị cảnh báo
  const showUnsavedChangesAlert = (action) => {
    return window.confirm(
      "Bạn có thay đổi chưa lưu. Nếu tiếp tục, thay đổi sẽ bị mất. Bạn có chắc chắn muốn tiếp tục?"
    );
  };

  const handlePrevMonth = () => {
    if (
      (showAddForm && hasFormChanges()) ||
      (editingTransaction && hasTransactionFormChanges())
    ) {
      if (!showUnsavedChangesAlert("chuyển tháng")) return;
    }
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
    resetForms();
  };

  const handleNextMonth = () => {
    if (
      (showAddForm && hasFormChanges()) ||
      (editingTransaction && hasTransactionFormChanges())
    ) {
      if (!showUnsavedChangesAlert("chuyển tháng")) return;
    }
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
    resetForms();
  };

  const handleDayClick = (day, isCurrentMonth) => {
    if (isCurrentMonth) {
      if (
        (showAddForm && hasFormChanges()) ||
        (editingTransaction && hasTransactionFormChanges())
      ) {
        if (!showUnsavedChangesAlert("chọn ngày khác")) return;
      }

      setSelectedDate(day);
      resetForms();

      // Set default date for new reminder
      setFormData((prev) => ({
        ...prev,
        date: `${currentDate.getFullYear()}-${String(
          currentDate.getMonth() + 1
        ).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      }));
    }
  };

  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      if (
        (showAddForm && hasFormChanges()) ||
        (editingTransaction && hasTransactionFormChanges())
      ) {
        if (!showUnsavedChangesAlert("chuyển tab")) return;
      }
      setActiveTab(tab);
      resetForms();
    }
  };

  // Hàm reset tất cả forms
  const resetForms = () => {
    setShowAddForm(false);
    setEditingReminder(null);
    setEditingTransaction(null);
    setFormData({
      title: "",
      date: "",
      time: "08:00",
      repeat: "Never",
    });
    setTransactionForm({
      amount: "",
      description: "",
      type: "expense",
      category_id: "",
    });
    setHasUnsavedChanges(false);
  };

  // REMINDER FUNCTIONS
  const handleAddReminder = async () => {
    if (!formData.title.trim()) {
      alert("Vui lòng nhập tiêu đề reminder!");
      return;
    }

    const token = localStorage.getItem("token");

    // Sử dụng ngày đã chọn từ calendar
    const selectedFullDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      selectedDate
    );

    // Kết hợp với time từ form
    const [hours, minutes] = formData.time.split(":");
    selectedFullDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    try {
      await axios.post(
        `${API_URL}/api/reminders`,
        {
          title: formData.title,
          date: selectedFullDate.toISOString(),
          time: formData.time,
          repeat: formData.repeat,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await fetchReminders();
      resetForms();
      alert("Tạo reminder thành công!");
    } catch (error) {
      console.error("Error adding reminder:", error);
      alert(
        `Tạo reminder thất bại: ${error.response?.data?.message || "Lỗi không xác định"
        }`
      );
    }
  };

  const handleEditReminder = (reminder) => {
    if (
      (showAddForm && hasFormChanges()) ||
      (editingTransaction && hasTransactionFormChanges())
    ) {
      if (!showUnsavedChangesAlert("chỉnh sửa reminder khác")) return;
    }

    setEditingReminder(reminder._id);
    const reminderDate = new Date(reminder.date);
    setFormData({
      title: reminder.title,
      date: reminderDate.toISOString().split("T")[0],
      time: reminder.time,
      repeat: reminder.repeat,
    });
    setShowAddForm(true);
    setHasUnsavedChanges(false);

    // Cập nhật selected date để khớp với reminder
    setSelectedDate(reminderDate.getDate());
    if (
      reminderDate.getMonth() !== currentDate.getMonth() ||
      reminderDate.getFullYear() !== currentDate.getFullYear()
    ) {
      setCurrentDate(
        new Date(reminderDate.getFullYear(), reminderDate.getMonth())
      );
    }
  };

  const handleUpdateReminder = async () => {
    if (!formData.title.trim()) {
      alert("Vui lòng nhập tiêu đề reminder!");
      return;
    }

    const token = localStorage.getItem("token");

    // Sử dụng ngày từ form hoặc ngày đã chọn
    let selectedFullDate;
    if (formData.date) {
      selectedFullDate = new Date(formData.date);
    } else {
      selectedFullDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        selectedDate
      );
    }

    // Kết hợp với time từ form
    const [hours, minutes] = formData.time.split(":");
    selectedFullDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    try {
      await axios.put(
        `${API_URL}/api/reminders/${editingReminder}`,
        {
          title: formData.title,
          date: selectedFullDate.toISOString(),
          time: formData.time,
          repeat: formData.repeat,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await fetchReminders();
      resetForms();
      alert("Cập nhật reminder thành công!");
    } catch (error) {
      console.error("Error updating reminder:", error);
      alert(
        `Cập nhật reminder thất bại: ${error.response?.data?.message || "Lỗi không xác định"
        }`
      );
    }
  };

  const handleDeleteReminder = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa reminder này?")) {
      const token = localStorage.getItem("token");
      try {
        await axios.delete(`${API_URL}/api/reminders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        await fetchReminders();
        alert("Xóa reminder thành công!");
      } catch (error) {
        console.error("Error deleting reminder:", error);
        alert(
          `Xóa reminder thất bại: ${error.response?.data?.message || "Lỗi không xác định"
          }`
        );
      }
    }
  };

  // Transaction Functions
  const handleEditTransaction = (transaction) => {
    if (
      (showAddForm && hasFormChanges()) ||
      (editingTransaction && hasTransactionFormChanges())
    ) {
      if (!showUnsavedChangesAlert("chỉnh sửa transaction khác")) return;
    }

    setEditingTransaction(transaction._id);
    setTransactionForm({
      amount: transaction.amount.toString(),
      description: transaction.description || "",
      type: transaction.type,
      category_id: transaction.category_id._id || transaction.category_id,
    });
    setHasUnsavedChanges(false);
  };

  const handleUpdateTransaction = async () => {
    if (!transactionForm.amount || !transactionForm.category_id) {
      alert("Vui lòng điền đầy đủ amount và category!");
      return;
    }

    const token = localStorage.getItem("token");
    const selectedFullDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      selectedDate
    );

    try {
      await axios.put(
        `${API_URL}/api/transactions/${editingTransaction}`,
        {
          amount: parseFloat(transactionForm.amount),
          description: transactionForm.description,
          type: transactionForm.type,
          category_id: transactionForm.category_id,
          date: selectedFullDate.toISOString(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await fetchTransactions();
      resetForms();
      alert("Cập nhật transaction thành công!");
    } catch (error) {
      console.error("Error updating transaction:", error);
      alert(
        `Cập nhật transaction thất bại: ${error.response?.data?.message || "Lỗi không xác định"
        }`
      );
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa transaction này?")) {
      const token = localStorage.getItem("token");
      try {
        await axios.delete(`${API_URL}/api/transactions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        await fetchTransactions();
        alert("Xóa transaction thành công!");
      } catch (error) {
        console.error("Error deleting transaction:", error);
        alert(
          `Xóa transaction thất bại: ${error.response?.data?.message || "Lỗi không xác định"
          }`
        );
      }
    }
  };

  // Filter categories by type for dropdown
  const getFilteredCategories = (type) => {
    return categories.filter((category) => category.type === type);
  };

  // Get category name for display
  const getCategoryName = (category) => {
    return category?.name || "Unknown Category";
  };

  const selectedDateReminders = reminders.filter((r) => {
    const reminderDateStr = getLocalDateString(r.date);
    const selectedDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
    return reminderDateStr === selectedDateStr;
  });

  const selectedDateTransactions = transactions.filter((t) => {
    const transactionDateStr = getLocalDateString(t.date);
    const selectedDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
    return transactionDateStr === selectedDateStr;
  });

  const calendarDays = generateCalendarDays();

  const formatDate = (date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const dayOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ][date.getDay()];
    return `${day}/${month}/${year} (${dayOfWeek})`;
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleTransactionFormChange = (field, value) => {
    setTransactionForm((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleAddButtonClick = (e) => {
    e.stopPropagation();
    if (editingTransaction && hasTransactionFormChanges()) {
      if (!showUnsavedChangesAlert("tạo reminder mới")) return;
    }
    setShowAddForm(!showAddForm);
    setEditingReminder(null);
    setFormData({
      title: "",
      date: `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1
      ).padStart(2, "0")}-${String(selectedDate).padStart(2, "0")}`,
      time: "08:00",
      repeat: "Never",
    });
    setHasUnsavedChanges(false);
  };



  return (
    <div className="calendar" style={{ backgroundImage: `url(${bgImage})` }}>
      <h2 className="welcome-text">
        Welcome {localStorage.getItem("username")}!
      </h2>

      <div className="calendar-main-container">
        <div className="calendar-header">
          <h1 className="calendar-title">Calendar</h1>
        </div>

        <div className="calendar-navigation">
          <button className="nav-button" onClick={handlePrevMonth}>
            <ChevronLeft size={20} />
          </button>
          <span className="current-month">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button className="nav-button" onClick={handleNextMonth}>
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="calendar-container">
          <div className="calendar-header-row">
            {daysOfWeek.map((day, index) => (
              <div key={index} className="calendar-header-cell">
                {day}
              </div>
            ))}
          </div>

          <div className="calendar-grid">
            {calendarDays.map((dayObj, index) => (
              <div
                key={index}
                className={`calendar-day ${!dayObj.isCurrentMonth ? "other-month" : ""
                  } ${dayObj.day === selectedDate && dayObj.isCurrentMonth
                    ? "selected"
                    : ""
                  } ${dayObj.isToday ? "today" : ""} ${dayObj.hasReminder ? "has-reminder" : ""
                  } ${dayObj.hasTransaction ? "has-transaction" : ""}`}
                onClick={() =>
                  handleDayClick(dayObj.day, dayObj.isCurrentMonth)
                }
              >
                {dayObj.day}
              </div>
            ))}
          </div>

          <div className="selected-date-info">
            {formatDate(
              new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                selectedDate
              )
            )}
          </div>

          <div className="tabs-container">
            <button
              className={`tab-button ${activeTab === "transactions" ? "active" : ""
                }`}
              onClick={() => handleTabChange("transactions")}
            >
              Transactions
            </button>
            <button
              className={`tab-button ${activeTab === "reminders" ? "active" : ""
                }`}
              onClick={() => handleTabChange("reminders")}
            >
              Reminders
              <button
                className="add-button"
                onClick={handleAddButtonClick}
                title="Add New Reminder"
              >
                <Plus size={20} />
              </button>
            </button>
          </div>

          <div className="content-area">
            {activeTab === "transactions" ? (
              <div className="transactions-list">
                {editingTransaction ? (
                  <div className="transaction-form">
                    <h3>Chỉnh sửa Transaction</h3>
                    <div className="form-row">
                      <label>
                        Amount:
                        <input
                          type="number"
                          value={transactionForm.amount}
                          onChange={(e) =>
                            handleTransactionFormChange(
                              "amount",
                              e.target.value
                            )
                          }
                          className="form-input"
                          placeholder="0"
                        />
                      </label>
                      <label>
                        Type:
                        <select
                          value={transactionForm.type}
                          onChange={(e) => {
                            handleTransactionFormChange("type", e.target.value);
                            handleTransactionFormChange("category_id", "");
                          }}
                          className="form-select"
                        >
                          <option value="expense">Expense</option>
                          <option value="income">Income</option>
                        </select>
                      </label>
                    </div>
                    <div className="form-row">
                      <label>
                        Category:
                        <select
                          value={transactionForm.category_id}
                          onChange={(e) =>
                            handleTransactionFormChange(
                              "category_id",
                              e.target.value
                            )
                          }
                          className="form-select"
                        >
                          <option value="">Chọn category</option>
                          {getFilteredCategories(transactionForm.type).map(
                            (category) => (
                              <option key={category._id} value={category._id}>
                                {category.name}
                              </option>
                            )
                          )}
                        </select>
                      </label>
                    </div>
                    <label>
                      Description:
                      <input
                        type="text"
                        value={transactionForm.description}
                        onChange={(e) =>
                          handleTransactionFormChange(
                            "description",
                            e.target.value
                          )
                        }
                        className="form-input"
                        placeholder="Thêm ghi chú..."
                      />
                    </label>
                    <div className="form-actions">
                      <button
                        className="btn-save"
                        onClick={handleUpdateTransaction}
                      >
                        <Check size={16} />
                        Cập nhật
                      </button>
                      <button
                        className="btn-cancel"
                        onClick={() => {
                          if (
                            hasTransactionFormChanges() &&
                            !showUnsavedChangesAlert("hủy")
                          )
                            return;
                          resetForms();
                        }}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : selectedDateTransactions.length === 0 ? (
                  <div className="no-data">No transactions on this day.</div>
                ) : (
                  selectedDateTransactions.map((transaction) => {
                    const category = categories.find(
                      (cat) =>
                        cat._id ===
                        (transaction.category_id?._id ||
                          transaction.category_id)
                    );

                    return (
                      <div key={transaction._id} className="transaction-item">
                        <div className="transaction-content">
                          <div className="transaction-icon">
                            {category?.icon ? (
                              <img
                                src={`${API_URL}${category.icon}`}
                                alt={getCategoryName(category)}
                                className="category-image"
                              />
                            ) : (
                              <div className="icon-fallback">📦</div>
                            )}
                          </div>
                          <div className="transaction-info">
                            <h3 className="transaction-category">
                              {getCategoryName(category)}
                            </h3>
                            <p className="transaction-description">
                              {transaction.description || "No description"}
                            </p>
                          </div>
                        </div>
                        <div className="transaction-actions">
                          <span
                            className={`transaction-amount ${transaction.type === "income"
                              ? "income"
                              : "expense"
                              }`}
                          >
                            {transaction.type === "income" ? "+" : "-"}
                            {transaction.amount.toLocaleString()} VND
                          </span>
                          <div className="transaction-buttons">
                            <button
                              className="icon-button"
                              onClick={() => handleEditTransaction(transaction)}
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              className="icon-button delete"
                              onClick={() =>
                                handleDeleteTransaction(transaction._id)
                              }
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="reminders-list">
                {showAddForm && (
                  <div className="reminder-form">
                    <div className="form-header">
                      <h3>
                        {editingReminder
                          ? "Chỉnh sửa Reminder"
                          : "Thêm Reminder mới"}
                      </h3>
                      <button
                        className="close-button"
                        onClick={() => {
                          if (
                            hasFormChanges() &&
                            !showUnsavedChangesAlert("đóng form")
                          )
                            return;
                          resetForms();
                        }}
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Reminder title"
                      value={formData.title}
                      onChange={(e) =>
                        handleFormChange("title", e.target.value)
                      }
                      className="form-input"
                    />
                    {/* Cập nhật: Time, Date, Repeat cùng hàng */}
                    <div className="form-row triple">
                      <label>
                        Time:
                        <input
                          type="time"
                          value={formData.time}
                          onChange={(e) =>
                            handleFormChange("time", e.target.value)
                          }
                          className="form-input-small"
                        />
                      </label>
                      <label>
                        Date:
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) =>
                            handleFormChange("date", e.target.value)
                          }
                          className="form-input-small"
                        />
                      </label>
                      <label>
                        Repeat:
                        <select
                          value={formData.repeat}
                          onChange={(e) =>
                            handleFormChange("repeat", e.target.value)
                          }
                          className="form-select"
                        >
                          <option value="Never">Never</option>
                          <option value="Every day">Every day</option>
                          <option value="Every week">Every week</option>
                          <option value="Every month">Every month</option>
                        </select>
                      </label>
                    </div>
                    <div className="form-actions">
                      <button
                        className="btn-save"
                        onClick={
                          editingReminder
                            ? handleUpdateReminder
                            : handleAddReminder
                        }
                      >
                        <Check size={16} />
                        {editingReminder ? "Cập nhật" : "Lưu"}
                      </button>
                      <button
                        className="btn-cancel"
                        onClick={() => {
                          if (
                            hasFormChanges() &&
                            !showUnsavedChangesAlert("hủy")
                          )
                            return;
                          resetForms();
                        }}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}

                {selectedDateReminders.length === 0 && !showAddForm ? (
                  <div className="no-data">
                    No reminders on this day. Click + to add one!
                  </div>
                ) : (
                  selectedDateReminders.map((reminder) => (
                    <div key={reminder._id} className="reminder-item">
                      <div className="reminder-content">
                        <h3 className="reminder-title">{reminder.title}</h3>
                        <div className="reminder-details compact">
                          <span>
                            <strong>Time:</strong> {reminder.time}
                          </span>
                          <span>
                            <strong>Date:</strong>{" "}
                            {new Date(reminder.date).toLocaleDateString()}
                          </span>
                          <span>
                            <strong>Repeat:</strong> {reminder.repeat}
                          </span>
                        </div>
                      </div>
                      <div className="reminder-actions">
                        <button
                          className="icon-button"
                          onClick={() => handleEditReminder(reminder)}
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          className="icon-button delete"
                          onClick={() => handleDeleteReminder(reminder._id)}
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="calendar-footer">@Copyright 2025</footer>
    </div>
  );
};

export default Calendar;
