import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  MdHome, 
  MdReceipt, 
  MdShoppingCart, 
  MdPerson 
} from 'react-icons/md';
import { userStorage } from '../../utils/storage';
import './BottomNavigation.css';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      id: 'home',
      icon: MdHome,
      activeIcon: MdHome,
      label: 'Home',
      path: '/home'
    },
    {
      id: 'orders',
      icon: MdReceipt,
      activeIcon: MdReceipt,
      label: 'Orders',
      path: '/orders'
    },
    {
      id: 'cart',
      icon: MdShoppingCart,
      activeIcon: MdShoppingCart,
      label: 'Cart',
      path: '/cart'
    },
    {
      id: 'profile',
      icon: MdPerson,
      activeIcon: MdPerson,
      label: 'Profile',
      path: '/profile'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Don't show bottom nav on auth, onboarding, or stadium selection screens
  // Also check if user is logged in
  const hideNavPaths = ['/auth', '/onboarding', '/stadium-selection'];
  const shouldHideNav = hideNavPaths.some(path => location.pathname.startsWith(path));
  
  // Check if user is authenticated using storage utility
  const userData = userStorage.getUserData();
  const isAuthenticated = userData && userData !== null;
  
  if (shouldHideNav || !isAuthenticated) {
    return null;
  }

  return (
    <div className="bottom-navigation">
      <div className="nav-container">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => handleNavigation(item.path)}
          >
            <div className="nav-icon">
              {React.createElement(isActive(item.path) ? item.activeIcon : item.icon, {
                className: `icon ${isActive(item.path) ? 'active' : ''}`
              })}
            </div>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNavigation;
