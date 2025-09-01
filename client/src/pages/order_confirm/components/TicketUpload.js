import React, { useRef } from 'react';

const TicketUpload = ({ ticketImage, onImageUpload, onCameraCapture }) => {
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const openGallery = () => {
    if (galleryInputRef.current) galleryInputRef.current.click();
  };

  const openCamera = () => {
    if (cameraInputRef.current) cameraInputRef.current.click();
    if (typeof onCameraCapture === 'function') onCameraCapture();
  };

  return (
    <div className="ticket-upload-section">
      <h2 className="section-title">Ticket Image (Optional)</h2>
      <p className="section-description">Upload your ticket image to auto-fill seat information</p>

      {/* Hidden inputs */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={onImageUpload}
        style={{ display: 'none' }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={onImageUpload}
        style={{ display: 'none' }}
      />

      <div className="upload-options">
        <button type="button" className="upload-option" onClick={openGallery} aria-label="Choose From Gallery">
          <img
            src={process.env.PUBLIC_URL + '/assets/images/choose-from-gallery.png'}
            alt="Choose From Gallery"
            className="upload-icon-img"
          />
        </button>

        <button type="button" className="upload-option" onClick={openCamera} aria-label="Front Camera">
          <img
            src={process.env.PUBLIC_URL + '/assets/images/camera.png'}
            alt="Front Camera"
            className="upload-icon-img"
          />
        </button>
      </div>

      <div className="upload-or-separator">
        <span className="line" />
        <span className="or">OR</span>
        <span className="line" />
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
