import React, { useEffect } from "react";
import "../styles/SuccessModal.css";

const SuccessModal = ({ onClose, countdown = 2 }) => {
  useEffect(() => {
    // Tự động đóng sau 2 giây
    const timer = setTimeout(() => {
      onClose();
    }, countdown * 1000);

    return () => clearTimeout(timer);
  }, [onClose, countdown]);

  return (
    <div className="success-modal-overlay">
      <div className="success-checkmark-wrapper">
        <svg className="success-checkmark" viewBox="0 0 52 52">
          <circle className="success-checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
          <path className="success-checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
        </svg>
      </div>
    </div>
  );
};

export default SuccessModal;
