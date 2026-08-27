import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { stadiumStorage } from '../../utils/storage';
import Stadium from '../../models/Stadium';
import stadiumRepository from '../../repositories/stadiumRepository';
import {
  getCurrentPosition,
  findNearestStadium,
  formatDistanceKm,
  getStadiumCoords,
  distanceKm,
  NEAREST_VENUE_MAX_KM,
} from '../../utils/geoLocation';
import './StadiumSelectionScreen.css';
import { useTranslation } from '../../i18n/i18n';
import BackButton from '../../components/page_header/BackButton';

const StadiumSelectionScreen = () => {
  const [selectedStadium, setSelectedStadium] = useState(null);
  const [stadiums, setStadiums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState(''); // info / success / error message
  const [locationStatusType, setLocationStatusType] = useState(''); // info | success | error
  const [userCoords, setUserCoords] = useState(null);
  const [nearestId, setNearestId] = useState(null);
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const autoContinueTimerRef = useRef(null);
  const didAutoLocateRef = useRef(false);

  // New user = no stadium saved yet → auto request location + auto continue
  const isNewUserFlow = !stadiumStorage.getSelectedStadium();

  const persistAndContinue = useCallback((stadium) => {
    if (!stadium) return;
    const stadiumModel = Stadium.fromMap(
      typeof stadium.toMap === 'function' ? stadium.toMap() : stadium
    );
    stadiumStorage.setSelectedStadium(stadiumModel.toMap());

    let nextPath = '/home';
    try {
      const postStadiumNext = localStorage.getItem('postStadiumNext');
      if (postStadiumNext && postStadiumNext.startsWith('/')) {
        nextPath = postStadiumNext;
        localStorage.removeItem('postStadiumNext');
      }
    } catch (_) {}

    navigate(nextPath);
  }, [navigate]);

  const applyNearestFromCoords = useCallback((coords, list, { autoContinue } = { autoContinue: false }) => {
    // First check if any stadium has coordinates at all
    const anyWithCoords = list.some((s) => !!getStadiumCoords(s));
    if (!anyWithCoords) {
      setNearestId(null);
      setLocationStatusType('error');
      setLocationStatus(t('stadium.no_coords'));
      return null;
    }

    const nearest = findNearestStadium(list, coords.latitude, coords.longitude, {
      maxDistanceKm: NEAREST_VENUE_MAX_KM,
    });

    if (!nearest) {
      // User is too far from every venue — do not auto-select / auto-continue
      setNearestId(null);
      setLocationStatusType('error');
      setLocationStatus(
        String(t('stadium.none_nearby') || 'No venue nearby (within {km} km). Please select a venue manually.')
          .replace('{km}', String(NEAREST_VENUE_MAX_KM))
      );
      return null;
    }

    setNearestId(nearest.stadium.id);
    setSelectedStadium(nearest.stadium);
    setLocationStatusType('success');
    setLocationStatus(
      `${t('stadium.nearest_found')}: ${nearest.stadium.name} (${formatDistanceKm(nearest.distanceKm)} ${t('stadium.away')})`
    );

    if (autoContinue) {
      if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
      autoContinueTimerRef.current = setTimeout(() => {
        persistAndContinue(nearest.stadium);
      }, 900);
    }

    return nearest;
  }, [persistAndContinue, t]);

  const requestNearestVenue = useCallback(async (list, { autoContinue } = { autoContinue: false }) => {
    if (!list || list.length === 0) return;

    setLocating(true);
    setLocationStatusType('info');
    setLocationStatus(t('stadium.finding_nearest'));

    try {
      const coords = await getCurrentPosition();
      setUserCoords(coords);
      applyNearestFromCoords(coords, list, { autoContinue });
    } catch (err) {
      console.warn('[StadiumSelection] Location failed:', err?.message || err);
      setLocationStatusType('error');
      const msg = String(err?.message || '');
      if (msg.toLowerCase().includes('denied')) {
        setLocationStatus(t('stadium.location_denied'));
      } else {
        setLocationStatus(t('stadium.location_unavailable'));
      }
    } finally {
      setLocating(false);
    }
  }, [applyNearestFromCoords, t]);

  // Fetch stadiums, then auto-ask location for new users
  useEffect(() => {
    let cancelled = false;

    const fetchStadiums = async () => {
      try {
        setLoading(true);
        setError(null);

        const stadiumData = await stadiumRepository.getAllStadiums();
        if (cancelled) return;

        setStadiums(stadiumData);

        // Preselect existing stadium if user is changing venue
        const existing = stadiumStorage.getSelectedStadium();
        if (existing?.id) {
          const match = stadiumData.find((s) => s.id === existing.id);
          if (match) setSelectedStadium(match);
        }
      } catch (err) {
        console.error('Error fetching stadiums:', err);
        if (!cancelled) {
          setError('Failed to load stadiums. Please try again.');
          setStadiums([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStadiums();
    return () => {
      cancelled = true;
      if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
    };
  }, []);

  // Once stadiums are loaded, auto-request location for new users
  useEffect(() => {
    if (loading || error || stadiums.length === 0) return;
    if (didAutoLocateRef.current) return;
    didAutoLocateRef.current = true;

    // Always try location for new users; for returning users opening this
    // screen to change venue, still suggest nearest but do not auto-continue.
    requestNearestVenue(stadiums, { autoContinue: isNewUserFlow });
  }, [loading, error, stadiums, isNewUserFlow, requestNearestVenue]);

  const handleStadiumSelect = (stadium) => {
    if (autoContinueTimerRef.current) {
      clearTimeout(autoContinueTimerRef.current);
      autoContinueTimerRef.current = null;
    }
    setSelectedStadium(stadium);
  };

  const handleContinue = () => {
    if (selectedStadium) {
      persistAndContinue(selectedStadium);
    }
  };

  const getDistanceLabel = (stadium) => {
    if (!userCoords) return null;
    const coords = getStadiumCoords(stadium);
    if (!coords) return null;
    const d = distanceKm(userCoords.latitude, userCoords.longitude, coords.latitude, coords.longitude);
    return formatDistanceKm(d);
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
        <div className="stadium-header" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <BackButton variant="light" fallbackTo="/home" />
          </div>
          <h1 className="stadium-title animate-down">{t('stadium.title')}</h1>
          <p className="stadium-subtitle animate-up">{t('stadium.subtitle')}</p>
        </div>

        {/* Location status / actions */}
        {!loading && !error && (
          <div className={`stadium-location-bar stadium-location-bar--${locationStatusType || 'idle'}`}>
            <div className="stadium-location-text">
              {locating ? t('stadium.finding_nearest') : (locationStatus || '')}
            </div>
            <button
              type="button"
              className="stadium-location-btn"
              onClick={() => requestNearestVenue(stadiums, { autoContinue: false })}
              disabled={locating || stadiums.length === 0}
            >
              {locating ? '…' : t('stadium.use_my_location')}
            </button>
          </div>
        )}

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
            {stadiums.map((stadium) => {
              const distanceLabel = getDistanceLabel(stadium);
              const isNearest = nearestId === stadium.id;
              return (
                <div
                  key={stadium.id}
                  className={`stadium-card ${selectedStadium?.id === stadium.id ? 'selected' : ''} ${isNearest ? 'nearest' : ''}`}
                  onClick={() => handleStadiumSelect(stadium)}
                  style={{ '--stadium-color': stadium.color }}
                >
                  {/* Stadium Avatar */}
                  <div className="stadium-avatar-container">
                    {stadium.imageUrl ? (
                      <img
                        src={stadium.imageUrl}
                        alt={stadium.name}
                        className="stadium-avatar"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="stadium-avatar-fallback"
                      style={{ display: stadium.imageUrl ? 'none' : 'flex' }}
                    >
                      <span className="stadium-initial">
                        {stadium.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Stadium Info */}
                  <div className="stadium-info">
                    <h3 className="stadium-name">{stadium.name}</h3>
                    {stadium.location && (
                      <p className="stadium-location">{stadium.location}</p>
                    )}
                    {distanceLabel && (
                      <p className="stadium-distance">
                        {isNearest ? `${t('stadium.nearest_badge')} · ` : ''}
                        {distanceLabel} {t('stadium.away')}
                      </p>
                    )}
                  </div>

                  {/* Selected Indicator */}
                  {selectedStadium?.id === stadium.id && (
                    <div className="selected-indicator">
                      <span>✓</span>
                    </div>
                  )}

                  {/* Small Continue Button on Card */}
                  {selectedStadium?.id === stadium.id && (
                    <button
                      className="card-continue-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContinue();
                      }}
                    >
                      Continue
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Continue Button */}
        <div className={`stadium-actions ${selectedStadium ? 'show' : ''}`}>
          <button
            className={`continue-button ${selectedStadium ? 'active' : 'disabled'}`}
            onClick={handleContinue}
            disabled={!selectedStadium}
          >
            {selectedStadium ? `${t('stadium.continue_to')} ${selectedStadium.name}` : t('stadium.select_button')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StadiumSelectionScreen;
