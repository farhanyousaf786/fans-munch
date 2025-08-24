import React from 'react';
import { IoArrowBack } from 'react-icons/io5';

const ConfirmHeader = ({ title = 'Confirm Order', onBack }) => (
  <div className="order-confirm-header">
    <button className="back-button" onClick={onBack} aria-label="Back">
      <IoArrowBack size={24} />
    </button>
    <h1 className="order-confirm-title">{title}</h1>
  </div>
);

export default ConfirmHeader;
