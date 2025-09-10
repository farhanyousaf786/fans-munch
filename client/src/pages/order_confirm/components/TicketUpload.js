import React, { useRef } from 'react';
import { useTranslation } from '../../../i18n/i18n';

const TicketUpload = ({ ticketImage, onImageUpload, onCameraCapture }) => {
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const { t } = useTranslation();

  const openGallery = () => {
    if (galleryInputRef.current) galleryInputRef.current.click();
  };

  const openCamera = () => {
    if (cameraInputRef.current) cameraInputRef.current.click();
    if (typeof onCameraCapture === 'function') onCameraCapture();
  };

  return (
    <div className="ticket-upload-section">
      <h2 className="section-title">{t('order.ticket_image_title')}</h2>
      <p className="section-description">{t('order.ticket_image_desc')}</p>

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
        capture="environment"
        onChange={onImageUpload}
        style={{ display: 'none' }}
      />

      <div className="upload-options">
        <button type="button" className="upload-option" onClick={openGallery} aria-label={t('order.choose_from_gallery')}>
          <img
            src="/assets/images/choose-from-gallery.png"
            alt={t('order.choose_from_gallery')}
            className="upload-icon-img"
          />
        </button>

        <button type="button" className="upload-option" onClick={openCamera} aria-label={t('order.front_camera')}>
          <img
            src="/assets/images/camera.png"
            alt={t('order.front_camera')}
            className="upload-icon-img"
          />
        </button>
      </div>

      <div className="upload-or-separator">
        <span className="line" />
        <span className="or">{t('order.or')}</span>
        <span className="line" />
      </div>

      {ticketImage && (
        <div className="uploaded-image">
          <img src={ticketImage} alt={t('order.ticket_alt') } className="ticket-preview" />
        </div>
      )}
    </div>
  );
};

export default TicketUpload;
