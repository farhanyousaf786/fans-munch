import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userStorage } from '../../utils/storage';
import orderRepository from '../../repositories/orderRepository';
import { OrderStatus } from '../../models/Order';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import './OrdersScreen.css';
import { useTranslation } from '../../i18n/i18n';

const OrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // active, completed, cancelled
  const [shopDetails, setShopDetails] = useState({}); // Cache for shop details
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Real-time subscription to user's orders
  useEffect(() => {
    const userData = userStorage.getUserData();
    if (!userData || !userData.id) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = orderRepository.streamOrdersForUser(userData.id, async (liveOrders, err) => {
      if (err) {
        setError(t('orders.error_loading'));
        setOrders([]);
        setLoading(false);
        return;
      }

      try {
        // Fetch shop details for unique shopIds
        const uniqueShopIds = [...new Set(liveOrders.map(o => o.shopId).filter(Boolean))];
        const shopDetailsMap = {};
        for (const shopId of uniqueShopIds) {
          shopDetailsMap[shopId] = await fetchShopById(shopId);
        }
        setShopDetails(shopDetailsMap);
        setOrders(liveOrders);
      } catch (e) {
        console.log('Shop details fetch error:', e);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Helper function to fetch shop details by ID
  const fetchShopById = async (shopId) => {
    try {
      const shopRef = doc(db, 'shops', shopId);
      const shopSnap = await getDoc(shopRef);
      
      if (shopSnap.exists()) {
        const data = shopSnap.data();
        
        // Create shop object from Firebase data (matching ShopList logic)
        const shop = {
          id: shopSnap.id,
          name: data.name || 'Unknown Shop',
          description: data.description || '',
          location: data.location || '',
          floor: data.floor || '',
          gate: data.gate || '',
          stadiumId: data.stadiumId || '',
          stadiumName: data.stadiumName || '',
          shopUserFcmToken: data.shopUserFcmToken || '',
          admins: data.admins || [],
          createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || new Date()
        };
        
        return shop;
      } else {
        console.log('❌ Shop not found:', shopId);
        return { name: 'Unknown Shop', id: shopId };
      }
    } catch (error) {
      console.error('❌ Error fetching shop:', shopId, error);
      return { name: 'Unknown Shop', id: shopId };
    }
  };

  // fetchUserOrders no longer needed; live stream handles updates

  // getStatusColor removed (unused)

  const getStatusText = (status) => {
    switch (status) {
      case OrderStatus.PENDING: return t('orders.pending');
      case OrderStatus.PREPARING: return t('orders.preparing');
      case OrderStatus.DELIVERING: return t('orders.delivering');
      case OrderStatus.DELIVERED: return t('orders.delivered');
      case OrderStatus.CANCELED: return t('orders.cancelled');
      default: return t('orders.pending');
    }
  };

  const getStatusClass = (status) => {
    if ([OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.DELIVERING].includes(status)) return 'status-active';
    if (status === OrderStatus.DELIVERED) return 'status-completed';
    if (status === OrderStatus.CANCELED) return 'status-cancelled';
    return 'status-active';
  };

  // Title for order card: first item name > shop name > generic
  const getOrderTitle = (order) => {
    try {
      const firstItem = Array.isArray(order?.cart) ? order.cart[0] : null;
      const itemName = firstItem?.name || firstItem?.title;
      if (itemName) return itemName;
      if (order?.shopId && shopDetails[order.shopId]) return shopDetails[order.shopId].name;
      return t('orders.order');
    } catch (_) {
      return t('orders.order');
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'active') {
      return [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.DELIVERING].includes(order.status);
    }
    if (activeTab === 'completed') {
      return order.status === OrderStatus.DELIVERED;
    }
    if (activeTab === 'cancelled') {
      return order.status === OrderStatus.CANCELED;
    }
    return true;
  });

  const handleTrackOrder = (order) => {
    const docId = order.id; // Firestore document id
    if (docId) {
      navigate(`/order/${docId}`);
    }
  };

  return (
    <div className="orders-screen">
      <div className="orders-container">
        {/* Header */}
        <div className="orders-header">
          <h1 className="orders-title">{t('orders.my_orders')}</h1>
          <p className="orders-subtitle">{t('orders.subtitle')}</p>
        </div>

        {/* Tabs */}
        <div className="orders-tabs">
          <button 
            className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            {t('orders.active')}
          </button>
          <button 
            className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            {t('orders.completed')}
          </button>
        </div>

        {/* Orders List */}
        <div className="orders-list">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>{t('orders.loading')}</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <h3>{t('orders.error_loading')}</h3>
              <p>{error}</p>
              <button className="retry-button" onClick={() => window.location.reload()}>
                {t('orders.try_again')}
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🍽️</div>
              <h3>{t('orders.no_orders')}</h3>
              <p>{t('orders.empty_hint')}</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id || order.orderId} className="order-card">
                {/* Top: Order number + status */}
                <div className="order-top">
                  <div className="order-number">{t('orders.order')} #{order.orderId}</div>
                  <span className={`status-badge ${getStatusClass(order.status)}`}>{getStatusText(order.status)}</span>
                </div>

                {/* Shop row */}
                <div className="order-restaurant">
                  <span className="shop-avatar" aria-hidden>🍔</span>
                  <span className="shop-name">
                    {getOrderTitle(order)}
                  </span>
                </div>

                
                

                {/* Meta row: items + date on left, price on right */}
                <div className="order-meta">
                  <div className="order-meta-left">
                    <span className="meta-item">{Array.isArray(order.cart) ? order.cart.reduce((sum, i) => sum + (i.quantity || 1), 0) : 0} {t('orders.items')}</span>
                    <span className="meta-dot">•</span>
                    <span className="meta-item">{order.getFormattedDate()}</span>
                  </div>
                  <div className="order-price">₪{order.total.toFixed(2)}</div>
                </div>

                {order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELED && (
                  <div className="order-actions">
                    <button className="track-button" onClick={() => handleTrackOrder(order)}>{t('orders.track')}</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersScreen;
