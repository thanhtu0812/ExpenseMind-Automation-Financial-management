import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/AddCategoryModal.css";

const AddCategoryModal = ({ onClose, onSave }) => {
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [availableIcons, setAvailableIcons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  //Tải danh sách icon khi mở modal
  useEffect(() => {
    const fetchIcons = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/icons`);
        setAvailableIcons(res.data);
      } catch (error) {
        console.error("Lỗi khi tải danh sách icon:", error);
        alert("Không thể tải danh sách icon. Vui lòng thử lại.");
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchIcons();
  }, [API_URL, onClose]);

  //Gửi dữ liệu category mới cho component cha (Expense hoặc Income)
  const handleSave = async () => {
    if (!name || !selectedIcon) {
      return alert("Vui lòng nhập tên và chọn icon.");
    }

    try {
      setSaving(true);
      await onSave({ name, icon: selectedIcon });
      onClose();
    } catch (error) {
      console.error("Lỗi khi lưu category:", error);
      alert("Không thể thêm category. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="add-category-modal">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
        <h3 className="modal-title">Add New Category</h3>

        <label className="input-label">Name</label>
        <input
          type="text"
          className="input-field"
          placeholder="Enter category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label className="input-label">Icon</label>
        <div className="icons-grid">
          {loading ? (
            <p>Loading icons...</p>
          ) : availableIcons.length > 0 ? (
            availableIcons.map((iconUrl, index) => (
              <div
                key={index}
                className={`icon-box ${
                  selectedIcon === iconUrl ? "selected" : ""
                }`}
                onClick={() => setSelectedIcon(iconUrl)}
              >
                <img
                  src={`${API_URL}${iconUrl}`}
                  alt={`icon-${index}`}
                  className="icon-img"
                />
              </div>
            ))
          ) : (
            <p>No icons available.</p>
          )}
        </div>

        <button className="save-btn" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
};

export default AddCategoryModal;
