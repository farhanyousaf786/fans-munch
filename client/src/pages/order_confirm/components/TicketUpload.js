import React from 'react';
import { IoCamera, IoImage } from 'react-icons/io5';

const TicketUpload = ({ ticketImage, onImageUpload, onCameraCapture }) => {
  return (
    <div className="ticket-upload-section">
      <h2 className="section-title">Ticket Image (Optional)</h2>
      <p className="section-description">Upload your ticket image to auto-fill seat information</p>

      <div className="upload-options">
        <label className="upload-option">
          <input
            type="file"
            accept="image/*"
            onChange={onImageUpload}
            style={{ display: 'none' }}
          />
          <IoImage size={24} />
          <span>Gallery</span>
        </label>

        <button className="upload-option" onClick={onCameraCapture}>
          <IoCamera size={24} />
          <span>Camera</span>
        </button>
      </div>

      {ticketImage && (
        <div className="uploaded-image">
          <img src={ticketImage} alt="Ticket" className="ticket-preview" />
        </div>
      )}
    </div>
  );
};

export default TicketUpload;
