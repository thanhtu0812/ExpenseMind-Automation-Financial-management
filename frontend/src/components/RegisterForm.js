import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/RegisterForm.css";
import bgImage from "./assets/images/anh-may-dep-cute.jpg";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import SuccessModal from "./SuccessModal";

const RegisterForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    
    if (password !== verifyPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters!");
      return;
    }

if (!password.trim()) {
    setError("Please enter your password.");
    return;
  }
  if (!dateOfBirth) {
    setError("Please select your date of birth.");
    return;
  }
  if (!gender) {
    setError("Please select your gender.");
    return;
  }
  if (!email.trim()) {
    setError("Please enter your email.");
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    setError("Please enter a valid email address.");
    return;
  }
  if (!name.trim()) {
    setError("Please enter your name.");
    return;
  }



    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: name,
          email: email,
          password: password,
          dob: dateOfBirth,
          gender: gender, 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed!");
      }

      localStorage.setItem("token", data.token || "dummy-token");

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
      className="register-container"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="register-box">
        <h1 className="welcome-text">Welcome to ExpenseMind</h1>

        {error && (
          <div style={{ 
            color: "red", 
            backgroundColor: "#ffe6e6",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "15px", 
            textAlign: "center",
            fontSize: "14px"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="register-form">
          {/* Name */}
          <div className="register-input-group">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div className="register-input-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Gender */}
          <div className="input-group gender-group">
            <label>
              <input
                type="radio"
                value="male"
                checked={gender === "male"}
                onChange={(e) => setGender(e.target.value)}
              />{" "}
              Male
            </label>
            <label>
              <input
                type="radio"
                value="female"
                checked={gender === "female"}
                onChange={(e) => setGender(e.target.value)}
              />{" "}
              Female
            </label>
          </div>

          {/* Date of Birth */}
          <div className="register-input-group">
            <input
              type="date"
              lang="en"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
          </div>

          {/* Password */}
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
            style={{ opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Registering..." : "Sign up"}
          </button>
        </form>

        <p className="login-prompt">
          Already have an account?
          <a href="/login" className="login-link">
            {" "}
            Log in
          </a>
        </p>
      </div>

      {showSuccessModal && (
        <SuccessModal
          onClose={() => {
            setShowSuccessModal(false);
            navigate("/home");
          }}
          countdown={2}
        />
      )}
    </div>
  );
};

export default RegisterForm;
