import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../styles/Header.css";

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userAvatar, setUserAvatar] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Kiểm tra trạng thái đăng nhập
    const checkLoginStatus = () => {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      
      if (token && userId) {
        setIsLoggedIn(true);
        fetchUserAvatar(userId, token);
      } else {
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();

    // Lắng nghe event đăng nhập thành công
    window.addEventListener('loginSuccess', checkLoginStatus);

    return () => {
      window.removeEventListener('loginSuccess', checkLoginStatus);
    };
  }, []);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.header-avatar-wrapper')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const fetchUserAvatar = async (userId, token) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setUserAvatar(data.avatar || "https://cdn-icons-png.flaticon.com/512/847/847969.png");
    } catch (error) {
      console.error("Error fetching avatar:", error);
      setUserAvatar("https://cdn-icons-png.flaticon.com/512/847/847969.png");
    }
  };

  const handleProfileClick = () => {
    navigate("/profile");
    setShowDropdown(false);
  };

  const handleLogout = () => {
    // Xóa thông tin đăng nhập
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    
    // Cập nhật state
    setIsLoggedIn(false);
    setShowDropdown(false);
    
    // Chuyển về trang login
    navigate("/login");
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <h2 className="header-logo">ExpenseMind</h2>
        
      </div>

      {isLoggedIn ? (
        <div className="header-right">
    
          <div className="header-avatar-wrapper">
            <button className="header-avatar-btn" onClick={toggleDropdown}>
              <img src={userAvatar} alt="User" className="header-avatar" />
            </button>
            {showDropdown && (
              <div className="header-dropdown">
                <button className="dropdown-item" onClick={handleProfileClick}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  Profile
                </button>
                <button className="dropdown-item logout" onClick={handleLogout}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="header-actions">
          <NavLink
            to="/register"
            className={({ isActive }) =>
              `register-btn-1 ${isActive ? "active" : ""}`
            }
          >
            Register
          </NavLink>

          <NavLink
            to="/login"
            className={({ isActive }) =>
              `login-btn-1 ${isActive ? "active" : ""}`
            }
          >
            Log in
          </NavLink>
        </div>
      )}
    </header>
  );
};

export default Header;
