import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  MdHome, 
  MdReceipt, 
  MdShoppingCart, 
  MdPerson 
} from 'react-icons/md';
import { userStorage } from '../../utils/storage';
import { cartUtils } from '../../utils/cartUtils';
import './BottomNavigation.css';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cartItemCount, setCartItemCount] = useState(0);

  // Update cart count on component mount and when cart changes
  useEffect(() => {
    // Initial cart count
    updateCartCount();

    // Listen for cart updates
    const handleCartUpdate = (event) => {
      // Handle null/undefined event detail safely
      const totalItems = event.detail?.totalItems || 0;
      setCartItemCount(totalItems);
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const updateCartCount = () => {
    const totalItems = cartUtils.getTotalItems();
    setCartItemCount(totalItems);
  };

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

  // Don't show bottom nav on auth, onboarding, stadium selection, or food detail screens
  // Also check if user is logged in
  const hideNavPaths = ['/auth', '/onboarding', '/stadium-selection', '/food'];
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
              {/* Show cart badge for cart item */}
              {item.id === 'cart' && cartItemCount > 0 && (
                <span className="cart-badge">{cartItemCount > 99 ? '99+' : cartItemCount}</span>
              )}
            </div>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNavigation;
