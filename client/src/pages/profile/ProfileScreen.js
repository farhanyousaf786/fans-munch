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
  IoLogInOutline,
  IoPersonAddOutline,
} from 'react-icons/io5';
import { storageManager, userStorage } from '../../utils/storage';
import { isCurrentUserAnonymous } from '../../utils/anonymousUserService';
import orderRepository from '../../repositories/orderRepository';
import { OrderStatus } from '../../models/Order';
import './ProfileScreen.css';

const ProfileScreen = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
      console.log('👤 Loaded user data:', user);
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      setUserData(null);
    }
  };

  // Live order stats via stream
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
    console.log('🚺 User signing out...');
    storageManager.clearAllStorage();
    navigate('/auth');
    console.log('✅ Sign out completed');
  };

  const handleRegisterFromGuest = () => {
    console.log('📝 Guest user wants to register...');
    storageManager.clearAllStorage();
    navigate('/auth?mode=register', { replace: true });
  };

  const handleLoginFromGuest = () => {
    console.log('🔑 Guest user wants to login...');
    storageManager.clearAllStorage();
    navigate('/auth?mode=login', { replace: true });
  };

  const handleSignIn = () => {
    navigate('/auth?mode=login');
  };

  const handleSignUp = () => {
    navigate('/auth?mode=register');
  };

  const isAuthenticated = !!(userData && userData.id);
  const isVisitor = !isAuthenticated; // not logged in and not guest session

  // Full settings for real logged-in users
  const authenticatedSettings = [
    { icon: IoLanguageOutline, title: t('profile.language'), subtitle: t('profile.language_sub'), action: () => navigate('/settings/language') },
    { icon: IoSwapHorizontalOutline, title: t('profile.currency') || 'Currency', subtitle: t('profile.currency_sub') || 'Choose your currency', action: () => navigate('/settings/currency') },
    { icon: IoInformationCircleOutline, title: t('profile.about'), subtitle: t('profile.about_sub'), action: () => navigate('/settings/about') },
    { icon: IoDocumentTextOutline, title: t('profile.terms'), subtitle: t('profile.terms_sub'), action: () => navigate('/settings/terms') },
    { icon: IoChatboxEllipsesOutline, title: t('profile.feedback'), subtitle: t('profile.feedback_sub'), action: () => navigate('/settings/feedback') },
    { icon: IoLockClosedOutline, title: t('profile.privacy'), subtitle: t('profile.privacy_sub'), action: () => navigate('/settings/privacy') },
    { icon: IoBugOutline, title: t('profile.report'), subtitle: t('profile.report_sub'), action: () => navigate('/settings/report') },
  ];

  // Guest (anonymous checkout) — keep essentials + auth CTAs in hero
  const guestSettings = [
    { icon: IoLanguageOutline, title: t('profile.language'), subtitle: t('profile.language_sub'), action: () => navigate('/settings/language') },
    { icon: IoSwapHorizontalOutline, title: t('profile.currency') || 'Currency', subtitle: t('profile.currency_sub') || 'Choose your currency', action: () => navigate('/settings/currency') },
    { icon: IoLockClosedOutline, title: t('profile.privacy'), subtitle: t('profile.privacy_sub'), action: () => navigate('/settings/privacy') },
  ];

  // Visitor (no login, no guest) — only essentials + Sign in / Sign up
  const visitorSettings = [
    { icon: IoLogInOutline, title: t('profile.sign_in'), subtitle: t('profile.sign_in_sub'), action: handleSignIn, highlight: true },
    { icon: IoPersonAddOutline, title: t('profile.sign_up'), subtitle: t('profile.sign_up_sub'), action: handleSignUp, highlight: true },
    { icon: IoLanguageOutline, title: t('profile.language'), subtitle: t('profile.language_sub'), action: () => navigate('/settings/language') },
    { icon: IoSwapHorizontalOutline, title: t('profile.currency') || 'Currency', subtitle: t('profile.currency_sub') || 'Choose your currency', action: () => navigate('/settings/currency') },
  ];

  const settingsOptions = isVisitor
    ? visitorSettings
    : (isAnonymous ? guestSettings : authenticatedSettings);

  return (
    <div className="profile-screen">
      <div className="profile-hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          {isAuthenticated && !isAnonymous ? (
            <div className="auth-hero">
              <div className="profile-avatar small auth-avatar">
                {userData?.photoUrl ? (
                  <img src={userData.photoUrl} alt="Profile" className="avatar-image" />
                ) : (
                  <IoPersonOutline className="avatar-icon" />
                )}
              </div>
              <div className="auth-name">{userData ? `${userData.firstName} ${userData.lastName}` : ''}</div>
              <div className="auth-email">{userData?.email || ''}</div>
              <button className="logout-chip" onClick={handleSignOut}><IoLogOutOutline/> {t('profile.logout')}</button>
            </div>
          ) : isAuthenticated && isAnonymous ? (
            <div className="guest-hero">
              <div className="profile-avatar small guest-avatar">
                <IoPersonOutline className="avatar-icon" />
              </div>
              <div className="guest-name">{userData?.displayName || t('profile.guest')}</div>
              <div className="guest-subtitle">{t('profile.guest_subtitle')}</div>
              <div className="guest-buttons">
                <button className="guest-btn primary" onClick={handleRegisterFromGuest}>{t('profile.sign_up')}</button>
                <button className="guest-btn secondary" onClick={handleLoginFromGuest}>{t('profile.sign_in')}</button>
              </div>
            </div>
          ) : (
            <div className="guest-hero">
              <div className="profile-avatar small guest-avatar">
                <IoPersonOutline className="avatar-icon" />
              </div>
              <div className="guest-name">{t('profile.visitor')}</div>
              <div className="guest-subtitle">{t('profile.visitor_subtitle')}</div>
              <div className="guest-buttons">
                <button className="guest-btn primary" onClick={handleSignUp}>{t('profile.sign_up')}</button>
                <button className="guest-btn secondary" onClick={handleSignIn}>{t('profile.sign_in')}</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="profile-container">
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
          <div className="settings-list">
            {settingsOptions.map((option, idx) => {
              const Icon = option.icon;
              return (
                <div
                  key={idx}
                  className={`settings-item ${option.highlight ? 'settings-item--highlight' : ''}`}
                  onClick={option.action}
                >
                  <div className="settings-item-left">
                    <Icon className="settings-icon" />
                    <div className="settings-text">
                      <div className="settings-title">{option.title}</div>
                      <div className="settings-subtitle">{option.subtitle}</div>
                    </div>
                  </div>
                  <div className="settings-arrow">›</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
