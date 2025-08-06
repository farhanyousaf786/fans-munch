import React, { useState, useEffect } from 'react';
import Toast from './Toast';
import './ToastContainer.css';

let toastId = 0;

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // Listen for custom toast events
    const handleToastEvent = (event) => {
      const { message, type = 'success', duration = 3000 } = event.detail;
      addToast(message, type, duration);
    };

    window.addEventListener('showToast', handleToastEvent);

    return () => {
      window.removeEventListener('showToast', handleToastEvent);
    };
  }, []);

  const addToast = (message, type, duration) => {
    const id = ++toastId;
    const newToast = { id, message, type, duration };
    
    setToasts(prevToasts => [...prevToasts, newToast]);
  };

  const removeToast = (id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

// Utility function to show toasts from anywhere in the app
export const showToast = (message, type = 'success', duration = 3000) => {
  window.dispatchEvent(new CustomEvent('showToast', {
    detail: { message, type, duration }
  }));
};

export default ToastContainer;
