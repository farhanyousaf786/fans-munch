import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  MdHome, 
  MdReceipt, 
  MdShoppingCart, 
  MdPerson 
} from 'react-icons/md';
import { userStorage } from '../../utils/storage';
import { cartUtils } from '../../utils/cartUtils';
import orderRepository from '../../repositories/orderRepository';
import { OrderStatus } from '../../models/Order';
import './BottomNavigation.css';
import { useTranslation } from '../../i18n/i18n';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [cartItemCount, setCartItemCount] = useState(0);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);

  // Update cart count and active orders on component mount and when they change
  useEffect(() => {
    // Initial cart count
    updateCartCount();
    
    // Initial active orders count
    updateActiveOrdersCount();

    // Listen for cart updates
    const handleCartUpdate = (event) => {
      // Handle null/undefined event detail safely
      const totalItems = event.detail?.totalItems || 0;
      setCartItemCount(totalItems);
    };
    
    // Listen for order updates
    const handleOrderUpdate = () => {
      console.log('🔔 Order update event received, refreshing badge...');
      updateActiveOrdersCount();
    };

    // Set up periodic refresh for orders badge (every 30 seconds)
    const orderRefreshInterval = setInterval(() => {
      updateActiveOrdersCount();
    }, 30000);

    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('orderUpdated', handleOrderUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('orderUpdated', handleOrderUpdate);
      clearInterval(orderRefreshInterval);
    };
  }, []);

  const updateCartCount = () => {
    const totalItems = cartUtils.getTotalItems();
    setCartItemCount(totalItems);
  };
  
  const updateActiveOrdersCount = async () => {
    try {
      const userData = userStorage.getUserData();
      if (!userData || !userData.id) {
        setActiveOrdersCount(0);
        return;
      }
      
      // Fetch user orders
      const orders = await orderRepository.fetchOrdersForUser(userData.id);
      
      // Count active orders (pending, preparing, delivering)
      const activeOrders = orders.filter(order => 
        [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.DELIVERING].includes(order.status)
      );
      
      setActiveOrdersCount(activeOrders.length);
      console.log('🔔 Active orders count updated:', activeOrders.length);
    } catch (error) {
      console.error('❌ Error fetching active orders count:', error);
      setActiveOrdersCount(0);
    }
  };

  const navItems = useMemo(() => ([
    {
      id: 'home',
      icon: MdHome,
      activeIcon: MdHome,
      label: t('nav.home'),
      path: '/home'
    },
    {
      id: 'orders',
      icon: MdReceipt,
      activeIcon: MdReceipt,
      label: t('nav.orders'),
      path: '/orders'
    },
    {
      id: 'cart',
      icon: MdShoppingCart,
      activeIcon: MdShoppingCart,
      label: t('nav.cart'),
      path: '/cart'
    },
    {
      id: 'profile',
      icon: MdPerson,
      activeIcon: MdPerson,
      label: t('nav.profile'),
      path: '/profile'
    }
  ]), [t]);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Don't show bottom nav on auth, onboarding, stadium selection, or food detail screens
  const hideNavPaths = ['/auth', '/onboarding', '/stadium-selection', '/food'];
  const shouldHideNav = hideNavPaths.some(path => location.pathname.startsWith(path));
  
  // Check if user is authenticated using storage utility
  const userData = userStorage.getUserData();
  const isAuthenticated = userData && userData !== null;

  // Filter nav items based on authentication status
  const visibleNavItems = isAuthenticated 
    ? navItems 
    : navItems.filter(item => ['home', 'profile'].includes(item.id));

  if (shouldHideNav) {
    return null;
  }

  return (
    <div className="bottom-navigation">
      <div className="nav-container">
        {visibleNavItems.map((item) => (
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
              {/* Show orders badge for active orders */}
              {item.id === 'orders' && activeOrdersCount > 0 && (
                <span className="orders-badge">{activeOrdersCount > 99 ? '99+' : activeOrdersCount}</span>
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
