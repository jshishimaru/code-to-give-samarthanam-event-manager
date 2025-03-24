// src/components/NotificationPopup.jsx
import React, { useEffect } from 'react';
import '../styles/NotificationPopup.css';

const NotificationPopup = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`notification-popup ${type}`} role="alert">
      <p>{message}</p>
      <button className="close-button" onClick={onClose} aria-label="Close notification">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  );
};

export default NotificationPopup;