import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/LoginForm.css";
import bgImage from "./assets/images/anh-may-dep-cute.jpg";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import SuccessModal from "./SuccessModal";

const LoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter username and password!");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed!");
      }

      // Save info to localStorage
    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", data.userId);
    localStorage.setItem("user", JSON.stringify({
    userId: data.userId,
    username: data.username,
    email: data.email,
    role: data.role
}));

        localStorage.setItem("username", data.username); //hiển thị đúng dòng Welcome username


      // Trigger custom event to update Header
      window.dispatchEvent(new CustomEvent('loginSuccess'));

      // Show success modal
      setShowSuccessModal(true);
    } catch (error) {
      setError(error.message || "An error occurred. Please try again!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-container"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <h1 className="welcome-text">Welcome back!</h1>

      {error && (
        <div style={{ 
          color: "red", 
          backgroundColor: "#ffe6e6",
          padding: "10px",
          borderRadius: "5px",
          marginBottom: "15px", 
          textAlign: "center",
          fontSize: "14px",
          maxWidth: "400px",
          margin: "0 auto 15px"
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="login-form">
        <div className="input-group">
          <input
            type="text"
            placeholder="Username or email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span
            className="eye-icon"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEye /> : <FaEyeSlash />}
          </span>
        </div>

        <button 
          type="submit" 
          className="login-btn"
          disabled={loading}
          style={{ opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <div className="divider"></div>
      <p className="signup-prompt">
        No account?{" "}
        <Link to="/register" className="signup-link">
          Sign up
        </Link>
      </p>

      {showSuccessModal && (
        <SuccessModal
          onClose={() => {
            setShowSuccessModal(false);
            navigate("/Home");
          }}
          countdown={2}
        />
      )}
    </div>
  );
};

export default LoginForm;
