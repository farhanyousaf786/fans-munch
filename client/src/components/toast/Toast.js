import React, { useEffect, useState } from 'react';
import { MdCheckCircle, MdError, MdInfo, MdClose } from 'react-icons/md';
import './Toast.css';

const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose && onClose();
      }, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <MdCheckCircle className="toast-icon success" />;
      case 'error':
        return <MdError className="toast-icon error" />;
      case 'info':
        return <MdInfo className="toast-icon info" />;
      default:
        return <MdCheckCircle className="toast-icon success" />;
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose && onClose();
    }, 300);
  };

  return (
    <div className={`toast ${type} ${isVisible ? 'show' : 'hide'}`}>
      {getIcon()}
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={handleClose}>
        <MdClose />
      </button>
    </div>
  );
};

export default Toast;
