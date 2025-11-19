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
  // Hàm kiểm tra xem người dùng đã đăng nhập chưa (ví dụ)
  const isAuthenticated = () => !!localStorage.getItem("token");

  // Component bảo vệ route, chuyển hướng về login nếu chưa đăng nhập
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/login" replace />;
    }
    // Nếu đã đăng nhập, hiển thị component con với Sidebar
    return (
      <div style={{ display: "flex" }}>
        <Sidebar />
        <div style={{ flex: 1, paddingTop: '60px' }}> {/* Thêm padding top nếu Header cố định */}
          {children}
        </div>
      </div>
    );
  };

  return (
    <Router>
      {/* Header có thể hiển thị mọi lúc hoặc chỉ khi đã đăng nhập */}
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

        {/* 💡 3. XÓA HOẶC VÔ HIỆU HÓA ROUTE /income */}
        {/* Nếu bạn không muốn truy cập trực tiếp /income nữa */}
        {/* <Route
          path="/income"
          element={
            <ProtectedRoute>
              <TransactionPage initialTab="income" /> // Hoặc vẫn dùng TransactionPage với tab mặc định là income
            </ProtectedRoute>
          }
        /> */}

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
