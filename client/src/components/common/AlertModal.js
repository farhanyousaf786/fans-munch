import React, { useEffect, useState } from 'react';
import './AlertModal.css';
import { MdClose, MdInfo, MdWarning, MdError, MdCheckCircle } from 'react-icons/md';

/**
 * A beautiful, modern Alert Modal for mobile-first experience.
 * 
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {string} title - Modal title
 * @param {string} message - Modal message content
 * @param {string} type - 'info', 'warning', 'error', 'success'
 * @param {function} onClose - Callback when modal is closed
 * @param {string} confirmText - Text for the primary button
 */
const AlertModal = ({ 
  isOpen, 
  title, 
  message, 
  type = 'info', 
  onClose, 
  confirmText = 'OK' 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !isAnimating) return null;

  const getIcon = () => {
    switch (type) {
      case 'warning': return <MdWarning className="alert-icon warning" />;
      case 'error': return <MdError className="alert-icon error" />;
      case 'success': return <MdCheckCircle className="alert-icon success" />;
      default: return <MdInfo className="alert-icon info" />;
    }
  };

  return (
    <div className={`alert-modal-overlay ${isOpen ? 'open' : 'closing'}`} onClick={onClose}>
      <div className={`alert-modal-container ${isOpen ? 'open' : 'closing'}`} onClick={e => e.stopPropagation()}>
        <div className="alert-modal-content">
          <button className="alert-modal-close" onClick={onClose}>
            <MdClose />
          </button>
          
          <div className="alert-modal-header">
            <div className={`icon-wrapper ${type}`}>
              {getIcon()}
            </div>
            {title && <h3 className="alert-modal-title">{title}</h3>}
          </div>
          
          <div className="alert-modal-body">
            <p className="alert-modal-message">{message}</p>
          </div>
          
          <div className="alert-modal-footer">
            <button className={`alert-modal-button ${type}`} onClick={onClose}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
