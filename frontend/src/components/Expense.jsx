import React, { useState, useEffect } from "react";
import "../styles/SharedFormStyles.css";
import { FaChevronLeft, FaChevronRight, FaPlusCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AddCategoryModal from "./AddCategoryModal";

const Expense = ({ overviewData }) => {
  const [date, setDate] = useState(new Date());
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  //Lấy danh sách category loại "expense"
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchCategories = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get(
          `${API_URL}/api/categories?type=expense`,
          config
        );
        setCategories(res.data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    fetchCategories();
  }, [API_URL, navigate]);

  const formatDate = (date) => date.toISOString().split("T")[0];
  const handlePrevDate = () => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() - 1);
    setDate(newDate);
  };
  const handleNextDate = () => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + 1);
    setDate(newDate);
  };

  // Thêm category mới (gắn type=expense)
  const handleAddCategory = async (categoryData) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/categories`,
        { ...categoryData, type: "expense" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCategories((prev) => [...prev, response.data]);
      setShowAddModal(false);
    } catch (error) {
      console.error("Lỗi khi thêm category:", error);
      alert(error.response?.data?.message || "Lỗi khi thêm category!");
    }
  };

  // Thêm expense mới
  const handleSubmit = async () => {
    if (!amount || !selectedCategory) {
      alert("Please fill in all required fields!");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      await axios.post(
        `${API_URL}/api/transactions`,
        {
          amount: parseFloat(amount),
          date,
          description: note,
          type: "expense",
          category_id: selectedCategory._id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("✅ Expense added successfully!");
      setAmount("");
      setNote("");
      setSelectedCategory(null);
    } catch (error) {
      console.error("Error adding expense:", error.response || error);
      alert("Error adding expense! Check console for details.");
    }
  };

  return (
    <>
      <div className="form-group">
        <label>Day</label>
        <div className="date-navigation">
          <button className="nav-btn" onClick={handlePrevDate}>
            <FaChevronLeft />
          </button>
          <input
            type="date"
            className="date-picker"
            value={formatDate(date)}
            onChange={(e) => setDate(new Date(e.target.value))}
          />
          <button className="nav-btn" onClick={handleNextDate}>
            <FaChevronRight />
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Note</label>
        <input
          type="text"
          placeholder="Enter note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Amount</label>
        <input
          type="number"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <p className="category-title">Categories</p>
      <div className="category-grid">
        {categories.map((cat) => (
          <div
            key={cat._id}
            className={`category-card ${
              selectedCategory?._id === cat._id ? "selected" : ""
            }`}
            onClick={() => setSelectedCategory(cat)}
          >
            <img
              src={`${API_URL}${cat.icon}`}
              alt={cat.name}
              className="category-icon"
            />
            <p>{cat.name}</p>
          </div>
        ))}

        <div
          className="category-card add-card"
          onClick={() => setShowAddModal(true)}
        >
          <FaPlusCircle className="add-icon" />
        </div>
      </div>

      <button
        className="submit-btn"
        onMouseDown={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        Enter expense
      </button>

      {showAddModal && (
        <AddCategoryModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddCategory}
        />
      )}
    </>
  );
};

export default Expense;
