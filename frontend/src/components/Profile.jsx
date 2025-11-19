
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Profile.css";
import bgImage from "./assets/images/anh-may-dep-cute.jpg";
import { FaEdit } from "react-icons/fa";
import axios from "axios";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const fileInputRef = useRef(null);


  // Hàm định dạng tiền
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN").format(amount) + " VND";

  // Hàm định dạng ngày
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split("T")[0];
  };

  useEffect(() => {
    const loadUserFromServer = async () => {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        alert("Please login!");
        navigate("/login");
        return;
      }
      const cachedUser = JSON.parse(localStorage.getItem("user"));
      if (cachedUser) {
        setUser(cachedUser);
      }

      try {

        const res = await axios.get(
          `http://localhost:5000/api/users/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );


        const serverUser = res.data.user || res.data
        setUser(serverUser);
        localStorage.setItem("user", JSON.stringify(serverUser));




        // Lấy dữ liệu thống kê từ API 
        try {
          const statsRes = await axios.get(
            "http://localhost:5000/api/transactions/stats/overview",
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const { income, expense, balance } = statsRes.data;
          setStats({ income, expense, balance });
        } catch (statsError) {
          console.error("Failed to load stats:", statsError);
          setStats({ income: 0, expense: 0, balance: 0 });
        }



      } catch (error) {
        console.error("Load user error:", error);
        if (error.response?.status === 401) {
          localStorage.clear();
          alert("Session expired!");
          navigate("/login");
        } else if (error.response?.status === 404) {
          alert("User not found!");
          navigate("/login");
        } else {
          alert("Failed to load profile!");
        }
      }
    };

    loadUserFromServer();
  }, [navigate]);

  // Chọn ảnh
  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setPreviewAvatar(previewUrl);
    setIsPreviewing(true);
    setUser({ ...user, pendingAvatarFile: file });
  };

  //  Xác nhận ảnh
  const handleAvatarConfirm = async () => {
    const file = user.pendingAvatarFile;
    if (!file) return;
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await axios.put(
        `http://localhost:5000/api/users/${userId}/avatar`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updatedAvatar = res.data.avatar;
      setUser({ ...user, avatar: updatedAvatar });
      localStorage.setItem("user", JSON.stringify({ ...user, avatar: updatedAvatar }));
      window.dispatchEvent(new Event('avatarUpdated'));
      alert("Avatar updated successfully!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to upload avatar!");
    } finally {
      setPreviewAvatar(null);
      setIsPreviewing(false);
    }
  };

  // Hủy ảnh
  const handleAvatarCancel = () => {
    setPreviewAvatar(null);
    setIsPreviewing(false);
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login again!");
      navigate("/login");
      return;
    }

    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const oldUsername = storedUser?.username;
      const newUsername = user.username;

      const payload = {
        email: user.email,
        dob: user.dob,
        gender: user.gender,
      };

      if (newUsername && newUsername !== oldUsername) {
        payload.newUsername = newUsername;
      }

      const userId = localStorage.getItem("userId");

      const res = await axios.put(
        `http://localhost:5000/api/users/${userId}`,
        payload,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      const updatedUser = res.data.user || res.data;
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      if (payload.newUsername) {
        alert("Username changed! Please login again with new username.");
        localStorage.clear();
        navigate("/login");
        return;
      }

      setIsEditing(false);
      alert("User information updated successfully!");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to update user information!");
    }
  };


  return (
    <div className="profile-container" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="profile-content">
        <div className="profile-card">

          {/* Avatar */}
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrapper">
              <img
                src={
                  previewAvatar
                    ? previewAvatar
                    : user?.avatar || "https://cdn-icons-png.flaticon.com/512/847/847969.png"
                }
                alt="Avatar"
                className="profile-avatar"
              />

              {/* Chọn ảnh */}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleAvatarSelect}
              />

              {!isPreviewing ? (
                <button
                  className="profile-camera-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </button>
              ) : (
                <div className="avatar-preview-actions">

                  <button className="cancel-btn" onClick={handleAvatarCancel}>❌</button>
                  <button className="confirm-btn" onClick={handleAvatarConfirm}>✅</button>
                </div>
              )}


            </div>
          </div>
          {/* Stats */}
          <div className="profile-stats">
            <div className="profile-stat-item">
              <span className="profile-stat-label">Income</span>
              <span className="profile-stat-value income">+{formatCurrency(stats.income)}</span>
            </div>
            <div className="profile-stat-item">
              <span className="profile-stat-label">Expense</span>
              <span className="profile-stat-value expense">-{formatCurrency(stats.expense)}</span>
            </div>
            <div className="profile-stat-item">
              <span className="profile-stat-label">Balance</span>
              <span
                className="profile-stat-value balance"
                style={{ color: stats.balance < 0 ? "red" : "#7A5AF8", fontWeight: "600" }}
              >
                {formatCurrency(stats.balance)}
              </span>
            </div>
          </div>

          {/* User Info */}
          <div className="profile-form">
            <div className="profile-header">
              <h3>Your Information</h3>
              <button className="edit-btn" onClick={() => setIsEditing(!isEditing)}>
                <FaEdit />
              </button>
            </div>

            <div className="profile-form-group">
              <label className="profile-label">Name</label>
              <input
                type="text"
                className="profile-input"
                value={user?.username || ""}
                readOnly={!isEditing}
                onChange={(e) => setUser({ ...user, username: e.target.value })}
              />
            </div>

            <div className="profile-form-group">
              <label className="profile-label">Email</label>
              <input
                type="email"
                className="profile-input"
                value={user?.email || ""}
                readOnly={!isEditing}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
              />
            </div>

            <div className="profile-form-group small">
              <label className="profile-label">Date of Birth</label>
              <input
                type="date"
                className="profile-input"
                value={user?.dob ? formatDate(user.dob) : ""}
                readOnly={!isEditing}
                onChange={(e) => setUser({ ...user, dob: e.target.value })}
              />
            </div>


            {isEditing && (
              <button className="save-btn" onClick={handleSave}>
                Save Changes
              </button>
            )}
          </div>
        </div>
      </div>

      <footer className="profile-footer">@Copyright 2025</footer>
    </div>
  );
};

export default Profile;
