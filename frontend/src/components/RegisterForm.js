import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/RegisterForm.css";
import bgImage from "./assets/images/anh-may-dep-cute.jpg";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const RegisterForm = () => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  //Gửi mã xác thực
  const handleSendVerificationCode = async (e) => {
    e.preventDefault();
    setError("");

    // Validation cơ bản
    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !verifyPassword.trim() ||
      !dateOfBirth
    ) {
      setError("Please fill in all fields!");
      return;
    }

    if (password !== verifyPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/send-verification",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to send verification code.");

      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  //Xác thực mã và tạo tài khoản
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!verificationCode.trim()) {
      setError("Please enter verification code sent to your email.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: name,
          email,
          password,
          dob: dateOfBirth,
          verificationCode,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Registration failed!");

      localStorage.setItem("token", data.token || "dummy-token");
      navigate("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="register-container"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="register-box">
        <h1 className="welcome-text">Welcome to ExpenseMind</h1>

        {error && (
          <div
            style={{
              color: "red",
              backgroundColor: "#ffe6e6",
              padding: "10px",
              borderRadius: "5px",
              marginBottom: "15px",
              textAlign: "center",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {/* Nhập thông tin cơ bản */}
        {step === 1 && (
          <form onSubmit={handleSendVerificationCode} className="register-form">
            <div className="register-input-group">
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="register-input-group">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="register-input-group">
              <input
                type="date"
                lang="en"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
              />
            </div>

            <div className="register-input-group">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                className="register-eye-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>

            <div className="register-input-group">
              <input
                type={showVerifyPassword ? "text" : "password"}
                placeholder="Verify Password"
                value={verifyPassword}
                onChange={(e) => setVerifyPassword(e.target.value)}
                required
              />
              <span
                className="register-eye-icon"
                onClick={() => setShowVerifyPassword(!showVerifyPassword)}
              >
                {showVerifyPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>

            <button
              type="submit"
              className="signup-btn"
              disabled={loading}
              style={{
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Sending code..." : "Register Now"}
            </button>
          </form>
        )}

        {/*Nhập mã xác thực */}
        {step === 2 && (
          <form onSubmit={handleVerifyAndRegister} className="register-form">
            <div className="register-input-group">
              <input
                type="text"
                placeholder="Enter verification code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="signup-btn"
              disabled={loading}
              style={{
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
        )}

        <p className="login-prompt">
          Already have an account?
          <a href="/login" className="login-link">
            {" "}
            Log in
          </a>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
