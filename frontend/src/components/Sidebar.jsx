import React from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  PenTool,
  BarChart3,
  Calendar,
  MessageCircle,
} from "lucide-react";
import "../styles/Sidebar.css";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <nav className="sidebar-nav">
        <NavLink
          to="/home"
          end
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <Home size={24} />
        </NavLink>
        <NavLink
          to="/add"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <PenTool size={24} />
        </NavLink>
        <NavLink
          to="/report"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <BarChart3 size={24} />
        </NavLink>
        <NavLink
          to="/calendar"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <Calendar size={24} />
        </NavLink>
        <NavLink
          to="/chatbot"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <MessageCircle size={24} />
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;
