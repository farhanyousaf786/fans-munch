import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdShoppingCart, MdKeyboardArrowRight, MdKeyboardArrowLeft, MdLocationOn } from 'react-icons/md';
import { userStorage } from '../../../../utils/storage';
import useSelectedStadium from '../../../../hooks/useSelectedStadium';
import { hasVenueBranding } from '../../../../utils/stadiumTheme';
import SearchFilterWidget from '../search_filter/SearchFilterWidget';
import './TopSection.css';
import { useTranslation } from '../../../../i18n/i18n';

const TopSection = (props) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [ready, setReady] = useState(false);
  const { stadium: selectedStadium, displayName, logoUrl } = useSelectedStadium();
  const { t, lang } = useTranslation();
  const isBranded = hasVenueBranding(selectedStadium);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return t('home.greeting_morning');
    if (hour >= 12 && hour < 17) return t('home.greeting_afternoon');
    if (hour >= 17 && hour < 21) return t('home.greeting_evening');
    return t('home.greeting_night');
  };

  useEffect(() => {
    setUserData(userStorage.getUserData());
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleCartClick = () => navigate('/cart');
  const handleStadiumClick = () => navigate('/stadium-selection');

  const handleSearchChange = (query) => {
    if (props.onSearch) props.onSearch(query);
  };

  const userName = userData ? `${userData.firstName} ${userData.lastName}!` : 'Guest!';
  const venueLabel = selectedStadium ? displayName : t('home.select_stadium');
  const sectionClass = [
    'home-top-section',
    lang === 'he' ? 'rtl' : '',
    isBranded ? 'home-top-section--branded' : '',
    ready ? 'is-ready' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={sectionClass} dir={lang === 'he' ? 'rtl' : 'ltr'}>
      {isBranded && <div className="branded-bg-shapes" aria-hidden="true" />}

      <div className="home-header anim-item anim-1">
        {!isBranded ? (
          <div className="stadium-selector" onClick={handleStadiumClick}>
            <span className="loc-badge">
              <img src="/assets/icons/location.png" alt="Location" className="location-icon" />
            </span>
            <div className="stadium-info">
              <span className="stadium-label">{t('home.venue')}</span>
              <div className="stadium-name-container">
                <span className="stadium-name">{venueLabel}</span>
                {lang === 'he' ? (
                  <MdKeyboardArrowLeft size={18} className="dropdown-arrow" />
                ) : (
                  <MdKeyboardArrowRight size={18} className="dropdown-arrow" />
                )}
              </div>
            </div>
          </div>
        ) : (
          <button type="button" className="branded-venue-pill branded-venue-pill--header" onClick={handleStadiumClick}>
            <MdLocationOn size={16} />
            <span className="branded-venue-name">{displayName}</span>
            {lang === 'he' ? <MdKeyboardArrowLeft size={18} /> : <MdKeyboardArrowRight size={18} />}
          </button>
        )}
        <button
          className={`cart-button ${isBranded ? 'cart-button--branded' : ''}`}
          onClick={handleCartClick}
          aria-label="Cart"
        >
          <MdShoppingCart size={22} />
        </button>
      </div>

      {isBranded ? (
        <div className="branded-hero anim-item anim-2">
          <div className="branded-logo-shell">
            <img src={logoUrl} alt="" className="branded-logo" />
          </div>
          <div className="branded-greeting">
            <p className="branded-greeting-line">{getGreeting()}</p>
            <h2 className="branded-user-name">{userName}</h2>
          </div>
        </div>
      ) : (
        <div className="welcome-message anim-item anim-2">
          <div className="welcome-text">
            <h1>{getGreeting()}</h1>
            <h2>{userName}</h2>
            {selectedStadium && <p className="welcome-venue-name">{displayName}</p>}
          </div>
        </div>
      )}

      <div className="search-container anim-item anim-3">
        <SearchFilterWidget onChanged={handleSearchChange} onFilterTap={() => {}} />
      </div>
    </div>
  );
};

export default TopSection;
