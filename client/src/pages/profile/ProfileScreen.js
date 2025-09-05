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
  IoBugOutline
} from 'react-icons/io5';
import { storageManager, userStorage } from '../../utils/storage';
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
  // no local favorites UI on this version

  useEffect(() => {
    loadUserData();
  }, []);

  // Redirect unauthenticated users to auth
  useEffect(() => {
    if (userData === null) return; // wait until loaded
    if (!userData || !userData.id) {
      navigate('/auth');
    }
  }, [userData, navigate]);

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
    
    // Clear all storage data using the storage manager
    storageManager.clearAllStorage();
    
    // Navigate back to auth screen
    navigate('/auth');
    
    console.log('✅ Sign out completed');
  };

  // helper removed; using compact stats card UI

  const settingsOptions = [
    { icon: IoLanguageOutline, title: t('profile.language'), subtitle: t('profile.language_sub'), action: () => navigate('/settings/language') },
    { icon: IoInformationCircleOutline, title: t('profile.about'), subtitle: t('profile.about_sub'), action: () => navigate('/settings/about') },
    { icon: IoDocumentTextOutline, title: t('profile.terms'), subtitle: t('profile.terms_sub'), action: () => navigate('/settings/terms') },
    { icon: IoChatboxEllipsesOutline, title: t('profile.feedback'), subtitle: t('profile.feedback_sub'), action: () => navigate('/settings/feedback') },
    { icon: IoLockClosedOutline, title: t('profile.privacy'), subtitle: t('profile.privacy_sub'), action: () => navigate('/settings/privacy') },
    { icon: IoBugOutline, title: t('profile.report'), subtitle: t('profile.report_sub'), action: () => navigate('/settings/report') },
  ];

  return (
    <div className="profile-screen">
      <div className="profile-hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-left">
            <div className="profile-avatar small">
              {userData?.photoUrl ? (
                <img src={userData.photoUrl} alt="Profile" className="avatar-image" />
              ) : (
                <IoPersonOutline className="avatar-icon" />
              )}
            </div>
            <div className="hero-user">
              <div className="hero-name">{userData ? `${userData.firstName} ${userData.lastName}` : ''}</div>
              <div className="hero-email">{userData?.email || ''}</div>
            </div>
          </div>
          <button className="logout-chip" onClick={handleSignOut}><IoLogOutOutline/> {t('profile.logout')}</button>
        </div>
      </div>

      <div className="profile-container">
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

        <div className="settings-section">
          <div className="section-header">{t('profile.settings')}</div>
          <div className="settings-list">
            {settingsOptions.map((option, idx) => {
              const Icon = option.icon;
              return (
                <div key={idx} className="settings-item" onClick={option.action}>
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
