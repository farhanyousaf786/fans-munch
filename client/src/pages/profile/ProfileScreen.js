import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/i18n';
import {
  IoPersonOutline,
  IoLogOutOutline,
  IoLanguageOutline,
  IoInformationCircleOutline,
  IoDocumentTextOutline,
  IoChatboxEllipsesOutline,
  IoLockClosedOutline,
  IoBugOutline,
  IoSwapHorizontalOutline,
  IoChevronForward,
  IoLocationOutline,
} from 'react-icons/io5';
import { storageManager, userStorage } from '../../utils/storage';
import useSelectedStadium from '../../hooks/useSelectedStadium';
import { hasVenueBranding } from '../../utils/stadiumTheme';
import { isCurrentUserAnonymous } from '../../utils/anonymousUserService';
import orderRepository from '../../repositories/orderRepository';
import { OrderStatus } from '../../models/Order';
import './ProfileScreen.css';

const ProfileScreen = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { stadium: selectedStadium, displayName: venueName, logoUrl } = useSelectedStadium();
  const isBranded = hasVenueBranding(selectedStadium);
  const [userData, setUserData] = useState(null);
  const [orderStats, setOrderStats] = useState({
    active: 0,
    completed: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    loadUserData();
    setIsAnonymous(isCurrentUserAnonymous());
  }, []);

  const loadUserData = () => {
    try {
      const user = userStorage.getUserData();
      setUserData(user);
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      setUserData(null);
    }
  };

  useEffect(() => {
    const user = userStorage.getUserData();
    if (!user || !user.id) return;
    setLoading(true);
    const unsub = orderRepository.streamOrdersForUser(user.id, (orders, err) => {
      if (err) {
        setOrderStats({ active: 0, completed: 0, cancelled: 0 });
        setLoading(false);
        return;
      }
      const stats = {
        active: orders.filter(o => [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.DELIVERING].includes(o.status)).length,
        completed: orders.filter(o => o.status === OrderStatus.DELIVERED).length,
        cancelled: orders.filter(o => o.status === OrderStatus.CANCELED).length,
      };
      setOrderStats(stats);
      setLoading(false);
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);

  const handleSignOut = () => {
    storageManager.clearAllStorage();
    navigate('/auth');
  };

  const handleRegisterFromGuest = () => {
    storageManager.clearAllStorage();
    navigate('/auth?mode=register', { replace: true });
  };

  const handleLoginFromGuest = () => {
    storageManager.clearAllStorage();
    navigate('/auth?mode=login', { replace: true });
  };

  const handleSignIn = () => navigate('/auth?mode=login');
  const handleSignUp = () => navigate('/auth?mode=register');

  const isAuthenticated = !!(userData && userData.id);
  const isVisitor = !isAuthenticated;
  const needsAuth = isVisitor || isAnonymous;

  const displayName = isAuthenticated && !isAnonymous
    ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
    : (userData?.displayName || (isVisitor ? t('profile.visitor') : t('profile.guest')));

  const displaySubtitle = isAuthenticated && !isAnonymous
    ? (userData?.email || '')
    : t('profile.guest_subtitle');

  const authenticatedSettings = [
    { icon: IoLanguageOutline, title: t('profile.language'), subtitle: t('profile.language_sub'), action: () => navigate('/settings/language') },
    { icon: IoSwapHorizontalOutline, title: t('profile.currency') || 'Currency', subtitle: t('profile.currency_sub') || 'Choose your currency', action: () => navigate('/settings/currency') },
    { icon: IoInformationCircleOutline, title: t('profile.about'), subtitle: t('profile.about_sub'), action: () => navigate('/settings/about') },
    { icon: IoDocumentTextOutline, title: t('profile.terms'), subtitle: t('profile.terms_sub'), action: () => navigate('/settings/terms') },
    { icon: IoChatboxEllipsesOutline, title: t('profile.feedback'), subtitle: t('profile.feedback_sub'), action: () => navigate('/settings/feedback') },
    { icon: IoLockClosedOutline, title: t('profile.privacy'), subtitle: t('profile.privacy_sub'), action: () => navigate('/settings/privacy') },
    { icon: IoBugOutline, title: t('profile.report'), subtitle: t('profile.report_sub'), action: () => navigate('/settings/report') },
  ];

  const guestSettings = [
    { icon: IoLanguageOutline, title: t('profile.language'), subtitle: t('profile.language_sub'), action: () => navigate('/settings/language') },
    { icon: IoSwapHorizontalOutline, title: t('profile.currency') || 'Currency', subtitle: t('profile.currency_sub') || 'Choose your currency', action: () => navigate('/settings/currency') },
    { icon: IoLockClosedOutline, title: t('profile.privacy'), subtitle: t('profile.privacy_sub'), action: () => navigate('/settings/privacy') },
  ];

  const settingsOptions = needsAuth ? guestSettings : authenticatedSettings;

  return (
    <div className={`profile-screen ${isBranded ? 'profile-screen--branded' : ''}`}>
      <header className={`profile-hero ${isBranded ? 'profile-hero--branded' : ''}`}>
        <div className="hero-overlay" />

        {selectedStadium && (
          <button
            type="button"
            className="profile-venue-row"
            onClick={() => navigate('/stadium-selection')}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="" className="profile-venue-row-logo" />
            ) : (
              <span className="profile-venue-row-icon"><IoLocationOutline /></span>
            )}
            <span className="profile-venue-row-name">{venueName || t('home.select_stadium')}</span>
            <IoChevronForward className="profile-venue-row-chevron" />
          </button>
        )}

        <div className="profile-user-row">
          <div className="profile-avatar-sm">
            {userData?.photoUrl && !isAnonymous ? (
              <img src={userData.photoUrl} alt="" className="avatar-image" />
            ) : (
              <IoPersonOutline className="avatar-icon-sm" />
            )}
          </div>
          <div className="profile-user-meta">
            <h1 className="profile-user-name">{displayName}</h1>
            {displaySubtitle && <p className="profile-user-sub">{displaySubtitle}</p>}
          </div>
          {isAuthenticated && !isAnonymous && (
            <button type="button" className="profile-logout-icon" onClick={handleSignOut} aria-label={t('profile.logout')}>
              <IoLogOutOutline />
            </button>
          )}
        </div>
      </header>

      <div className="profile-container">
        {needsAuth && (
          <div className="profile-auth-card">
            <p className="profile-auth-copy">{t('profile.visitor_subtitle')}</p>
            <div className="profile-auth-actions">
              <button
                type="button"
                className="profile-auth-btn primary"
                onClick={isAnonymous ? handleRegisterFromGuest : handleSignUp}
              >
                {t('profile.sign_up')}
              </button>
              <button
                type="button"
                className="profile-auth-btn secondary"
                onClick={isAnonymous ? handleLoginFromGuest : handleSignIn}
              >
                {t('profile.sign_in')}
              </button>
            </div>
          </div>
        )}

        {isAuthenticated && !isAnonymous && (
          <div className="stats-card">
            <div className="stats-col">
              <div className="stats-number">{loading ? '…' : orderStats.active}</div>
              <div className="stats-label">{t('profile.active')}</div>
            </div>
            <div className="divider" />
            <div className="stats-col">
              <div className="stats-number green">{loading ? '…' : orderStats.completed}</div>
              <div className="stats-label">{t('profile.completed')}</div>
            </div>
          </div>
        )}

        <div className="settings-section">
          <div className="section-header">{t('profile.settings')}</div>
          <div className="settings-list settings-list--compact">
            {settingsOptions.map((option, idx) => {
              const Icon = option.icon;
              return (
                <button
                  type="button"
                  key={idx}
                  className="settings-item"
                  onClick={option.action}
                >
                  <div className="settings-item-left">
                    <span className="settings-icon-wrap">
                      <Icon className="settings-icon" />
                    </span>
                    <div className="settings-text">
                      <div className="settings-title">{option.title}</div>
                      <div className="settings-subtitle">{option.subtitle}</div>
                    </div>
                  </div>
                  <IoChevronForward className="settings-chevron" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
