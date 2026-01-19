import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../i18n/i18n';
import './StadiumSelectionModal.css';

const StadiumSelectionModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!isOpen) return null;

  const handleSelectVenue = () => {
    navigate('/stadium-selection');
  };

  const handleBrowseAnyway = () => {
    onClose();
  };

  return (
    <div className="stadium-modal-overlay" onClick={handleBrowseAnyway}>
      <div className="stadium-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="stadium-modal-icon">
          <img src="/assets/icons/location.png" alt="Location" />
        </div>
        
        <h2 className="stadium-modal-title">
          {t('home.modal_select_venue_title') || 'Select Your Venue'}
        </h2>
        
        <p className="stadium-modal-description">
          {t('home.modal_select_venue_desc') || 'Choose your stadium to see available food options and enjoy faster delivery to your seat!'}
        </p>

        <div className="stadium-modal-actions">
          <button 
            className="stadium-modal-btn primary"
            onClick={handleSelectVenue}
          >
            {t('home.modal_select_venue_btn') || 'Select Venue'}
          </button>
          
          <button 
            className="stadium-modal-btn secondary"
            onClick={handleBrowseAnyway}
          >
            {t('home.modal_browse_anyway') || 'Browse Anyway'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StadiumSelectionModal;
