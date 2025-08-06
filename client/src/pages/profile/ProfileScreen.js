import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoPersonOutline, IoSettingsOutline, IoLogOutOutline, IoHeartOutline, IoLanguageOutline, IoHelpCircleOutline, IoShieldCheckmarkOutline, IoNotificationsOutline } from 'react-icons/io5';
import { storageManager, userStorage } from '../../utils/storage';
import orderRepository from '../../repositories/orderRepository';
import { OrderStatus } from '../../models/Order';
import './ProfileScreen.css';

const ProfileScreen = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [orderStats, setOrderStats] = useState({
    active: 0,
    completed: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  const [favoriteFoods, setFavoriteFoods] = useState([]);

  useEffect(() => {
    loadUserData();
    loadOrderStats();
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

  const loadOrderStats = async () => {
    try {
      setLoading(true);
      const user = userStorage.getUserData();
      
      if (!user || !user.id) {
        setOrderStats({ active: 0, completed: 0, cancelled: 0 });
        return;
      }

      const orders = await orderRepository.fetchOrdersForUser(user.id);
      
      const stats = {
        active: orders.filter(order => 
          [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.DELIVERING].includes(order.status)
        ).length,
        completed: orders.filter(order => order.status === OrderStatus.DELIVERED).length,
        cancelled: orders.filter(order => order.status === OrderStatus.CANCELED).length
      };
      
      setOrderStats(stats);
      console.log('📊 Order stats loaded:', stats);
    } catch (error) {
      console.error('❌ Error loading order stats:', error);
      setOrderStats({ active: 0, completed: 0, cancelled: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    console.log('🚺 User signing out...');
    
    // Clear all storage data using the storage manager
    storageManager.clearAllStorage();
    
    // Navigate back to auth screen
    navigate('/auth');
    
    console.log('✅ Sign out completed');
  };

  const buildStatsItem = (value, label) => {
    return (
      <div className="stats-item">
        <div className="stats-value">{loading ? '...' : value}</div>
        <div className="stats-label">{label}</div>
      </div>
    );
  };

  const settingsOptions = [
    {
      icon: IoNotificationsOutline,
      title: 'Notifications',
      subtitle: 'Manage your notifications',
      action: () => console.log('Navigate to notifications')
    },
    {
      icon: IoLanguageOutline,
      title: 'Language',
      subtitle: 'Change app language',
      action: () => console.log('Navigate to language settings')
    },
    {
      icon: IoShieldCheckmarkOutline,
      title: 'Privacy & Security',
      subtitle: 'Manage your privacy settings',
      action: () => console.log('Navigate to privacy settings')
    },
    {
      icon: IoHelpCircleOutline,
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      action: () => console.log('Navigate to help')
    }
  ];

  return (
    <div className="profile-screen">
      <div className="profile-container">
        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-info">
            <div className="profile-avatar">
              {userData?.photoUrl ? (
                <img src={userData.photoUrl} alt="Profile" className="avatar-image" />
              ) : (
                <IoPersonOutline className="avatar-icon" />
              )}
            </div>
            <div className="profile-details">
              <h2 className="profile-name">
                {userData ? `${userData.firstName} ${userData.lastName}` : 'Guest User'}
              </h2>
              <p className="profile-email">
                {userData ? userData.email : 'Please sign in to access your profile'}
              </p>
            </div>
          </div>
          
          {/* Order Statistics */}
          <div className="order-stats">
            {buildStatsItem(orderStats.active, 'Active Orders')}
            {buildStatsItem(orderStats.completed, 'Completed')}
            {buildStatsItem(orderStats.cancelled, 'Cancelled')}
          </div>
        </div>

        {/* Settings Section */}
        <div className="settings-section">
          <h3 className="section-title">Settings</h3>
          <div className="settings-list">
            {settingsOptions.map((option, index) => {
              const IconComponent = option.icon;
              return (
                <div key={index} className="settings-item" onClick={option.action}>
                  <div className="settings-item-left">
                    <IconComponent className="settings-icon" />
                    <div className="settings-text">
                      <div className="settings-title">{option.title}</div>
                      <div className="settings-subtitle">{option.subtitle}</div>
                    </div>
                  </div>
                  <div className="settings-arrow">›</div>
                </div>
              );
            })}
            
            {/* Sign Out Option */}
            <div className="settings-item sign-out-item" onClick={handleSignOut}>
              <div className="settings-item-left">
                <IoLogOutOutline className="settings-icon sign-out-icon" />
                <div className="settings-text">
                  <div className="settings-title sign-out-text">Sign Out</div>
                  <div className="settings-subtitle">Sign out of your account</div>
                </div>
              </div>
              <div className="settings-arrow">›</div>
            </div>
          </div>
        </div>

        {/* Favorite Foods Section */}
        <div className="favorites-section">
          <h3 className="section-title">Favorite Foods</h3>
          <div className="favorites-content">
            {favoriteFoods.length === 0 ? (
              <div className="favorites-empty">
                <IoHeartOutline className="favorites-empty-icon" />
                <p className="favorites-empty-text">No favorite foods yet</p>
                <p className="favorites-empty-subtitle">Add items to favorites from the menu</p>
              </div>
            ) : (
              <div className="favorites-list">
                {/* TODO: Implement favorite foods list */}
                <p>Favorite foods will be displayed here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
