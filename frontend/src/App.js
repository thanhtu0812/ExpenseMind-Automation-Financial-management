import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Header from "./components/Header";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import Home from "./components/Home";
import Sidebar from "./components/Sidebar";
import TransactionPage from "./components/TransactionPage";
import ExpenseLimit from "./components/ExpenseLimit";
import Calendar from "./components/Calendar";
import Profile from "./components/Profile";
import Chatbot from "./components/Chatbot";
import Report from "./components/Report";
import "./App.css";

function App() {
  const isAuthenticated = () => !!localStorage.getItem("token");

  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/login" replace />;
    }

    return (
      <div style={{ display: "flex" }}>
        <Sidebar />
        <div style={{ flex: 1, paddingTop: "60px" }}>{children}</div>
      </div>
    );
  };

  return (
    <Router>
      <Header />

      <Routes>
        {/* Route công khai */}
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/login" element={<LoginForm />} />

        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Các route cần đăng nhập */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add"
          element={
            <ProtectedRoute>
              <TransactionPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/expense-limit"
          element={
            <ProtectedRoute>
              <ExpenseLimit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report"
          element={
            <ProtectedRoute>
              <Report />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chatbot"
          element={
            <ProtectedRoute>
              <Chatbot />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
