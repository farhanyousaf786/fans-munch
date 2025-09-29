import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { stadiumStorage } from '../../utils/storage';
import Stadium from '../../models/Stadium';
import stadiumRepository from '../../repositories/stadiumRepository';
import './StadiumSelectionScreen.css';
import { useTranslation } from '../../i18n/i18n';
import { showToast } from '../../components/toast/ToastContainer';

const StadiumSelectionScreen = () => {
  const [selectedStadium, setSelectedStadium] = useState(null);
  const [stadiums, setStadiums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  // const { } = useTheme(); // Unused for now
  const { t, lang } = useTranslation();

  // Fetch stadiums from Firebase on component mount
  useEffect(() => {
    const fetchStadiums = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const stadiumData = await stadiumRepository.getAllStadiums();
        // Always append static fallback stadiums (marked as _isStatic) after Firebase results
        const fallback = stadiumRepository.getFallbackStadiums().map(s => ({ ...s, _isStatic: true }));
        // De-duplicate by id
        const existingIds = new Set(stadiumData.map(s => s.id));
        const onlyStaticNew = fallback.filter(s => !existingIds.has(s.id));
        setStadiums([...stadiumData, ...onlyStaticNew]);
      } catch (err) {
        console.error('Error fetching stadiums:', err);
        setError('Failed to load stadiums. Please try again.');
        
        // Use fallback data if Firebase fails
        const fallbackStadiums = stadiumRepository.getFallbackStadiums().map(s => ({ ...s, _isStatic: true }));
        setStadiums(fallbackStadiums);
      } finally {
        setLoading(false);
      }
    };

    fetchStadiums();
  }, []);

  const handleStadiumSelect = (stadium) => {
    if (stadium?._isStatic) {
      try { showToast('Coming soon in this stadium', 'info', 2000); } catch (_) {}
      return; // Do not allow selecting static placeholder stadiums
    }
    setSelectedStadium(stadium);
  };

  const handleContinue = () => {
    if (selectedStadium) {
      // Create Stadium model instance and save to storage
      const stadiumModel = Stadium.fromMap(selectedStadium);
      stadiumStorage.setSelectedStadium(stadiumModel.toMap());
      
      // Check if there's a post-stadium destination (from auth flow)
      let nextPath = '/home';
      try {
        const postStadiumNext = localStorage.getItem('postStadiumNext');
        if (postStadiumNext && postStadiumNext.startsWith('/')) {
          nextPath = postStadiumNext;
          localStorage.removeItem('postStadiumNext');
        }
      } catch (_) {}
      
      // Navigate to final destination
      navigate(nextPath);
    }
  };

  return (
    <div className="stadium-selection-screen" dir={lang === 'he' ? 'rtl' : 'ltr'}>
      {/* Background image and overlay */}
      <div
        className="stadium-bg"
        style={{ backgroundImage: "url(/assets/images/on-boarding-1.png)" }}
      />
      <div className="stadium-overlay" />

      <div className="stadium-container">
        {/* Header */}
        <div className="stadium-header">
          <h1 className="stadium-title animate-down">{t('stadium.title')}</h1>
          <p className="stadium-subtitle animate-up">{t('stadium.subtitle')}</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>{t('stadium.loading')}</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button 
              className="retry-button" 
              onClick={() => window.location.reload()}
            >
              {t('stadium.retry')}
            </button>
          </div>
        )}

        {/* Stadium Grid */}
        {!loading && !error && (
          <div className="stadium-grid">
            {stadiums.map((stadium) => (
              <div
                key={stadium.id}
                className={`stadium-card ${selectedStadium?.id === stadium.id ? 'selected' : ''}`}
                onClick={() => handleStadiumSelect(stadium)}
                style={{ '--stadium-color': stadium.color }}
              >

              <div className="stadium-info">
                <h3 className="stadium-name">{stadium.name}</h3>
                {stadium._isStatic && (
                  <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>(Coming soon)</div>
                )}
              </div>
              {selectedStadium?.id === stadium.id && (
                <div className="selected-indicator">
                  <span>✓</span>
                </div>
              )}
            </div>
          ))}
          </div>
        )}

        {/* Continue Button */}
        <div className={`stadium-actions ${selectedStadium && !selectedStadium._isStatic ? 'show' : ''}`}>
          <button
            className={`continue-button ${selectedStadium && !selectedStadium._isStatic ? 'active' : 'disabled'}`}
            onClick={handleContinue}
            disabled={!selectedStadium || !!selectedStadium?._isStatic}
          >
            {selectedStadium ? `${t('stadium.continue_to')} ${selectedStadium.name}` : t('stadium.select_button')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StadiumSelectionScreen;
