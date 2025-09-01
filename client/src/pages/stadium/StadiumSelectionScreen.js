import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { stadiumStorage } from '../../utils/storage';
import Stadium from '../../models/Stadium';
import stadiumRepository from '../../repositories/stadiumRepository';
import './StadiumSelectionScreen.css';

const StadiumSelectionScreen = () => {
  const [selectedStadium, setSelectedStadium] = useState(null);
  const [stadiums, setStadiums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { applyStadiumTheme } = useTheme();

  // Fetch stadiums from Firebase on component mount
  useEffect(() => {
    const fetchStadiums = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const stadiumData = await stadiumRepository.getAllStadiums();
        setStadiums(stadiumData);
      } catch (err) {
        console.error('Error fetching stadiums:', err);
        setError('Failed to load stadiums. Please try again.');
        
        // Use fallback data if Firebase fails
        const fallbackStadiums = stadiumRepository.getFallbackStadiums();
        setStadiums(fallbackStadiums);
      } finally {
        setLoading(false);
      }
    };

    fetchStadiums();
  }, []);

  const handleStadiumSelect = (stadium) => {
    setSelectedStadium(stadium);
  };

  const handleContinue = () => {
    if (selectedStadium) {
      // Create Stadium model instance and save to storage
      const stadiumModel = Stadium.fromMap(selectedStadium);
      stadiumStorage.setSelectedStadium(stadiumModel.toMap());
      
      // Navigate to home
      navigate('/home');
    }
  };

  return (
    <div className="stadium-selection-screen">
      {/* Background image and overlay */}
      <div
        className="stadium-bg"
        style={{ backgroundImage: "url(/assets/images/on-boarding-1.png)" }}
      />
      <div className="stadium-overlay" />

      <div className="stadium-container">
        {/* Header */}
        <div className="stadium-header">
          <h1 className="stadium-title animate-down">Select Your Stadium</h1>
          <p className="stadium-subtitle animate-up">Choose where you want to order food from</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading stadiums...</p>
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
              Retry
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
                <p className="stadium-location">{stadium.location}</p>
                <div className="stadium-details">
                  <span className="stadium-capacity">Capacity: {stadium.capacity}</span>
                  <div className="stadium-teams">
                    {stadium.teams.map((team, index) => (
                      <span key={index} className="team-tag">{team}</span>
                    ))}
                  </div>
                </div>
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
        <div className="stadium-actions">
          <button
            className={`continue-button ${selectedStadium ? 'active' : 'disabled'}`}
            onClick={handleContinue}
            disabled={!selectedStadium}
          >
            {selectedStadium ? `Continue to ${selectedStadium.name}` : 'Select a Stadium'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StadiumSelectionScreen;
