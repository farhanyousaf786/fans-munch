import React, { useState, useEffect } from 'react';
import { userStorage } from '../../utils/storage';
import orderRepository from '../../repositories/orderRepository';
import { OrderStatus } from '../../models/Order';
import './OrdersScreen.css';

const OrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // active, completed, cancelled

  useEffect(() => {
    fetchUserOrders();
  }, []);

  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📋 Fetching user orders...');
      
      // Get current user data
      const userData = userStorage.getUserData();
      if (!userData || !userData.id) {
        console.log('❌ No user data found');
        setOrders([]);
        return;
      }
      
      console.log('👤 Fetching orders for user:', userData.id);
      
      // Fetch orders from Firebase
      const userOrders = await orderRepository.fetchOrdersForUser(userData.id);
      
      console.log('✅ Loaded orders:', userOrders.length);
      setOrders(userOrders);
      
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      setError('Failed to load orders. Please try again.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case OrderStatus.PENDING: return '#FF9800'; // Orange
      case OrderStatus.PREPARING: return '#2196F3'; // Blue
      case OrderStatus.DELIVERING: return '#9C27B0'; // Purple
      case OrderStatus.DELIVERED: return '#4CAF50'; // Green
      case OrderStatus.CANCELED: return '#F44336'; // Red
      default: return '#FF9800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case OrderStatus.PENDING: return 'Pending';
      case OrderStatus.PREPARING: return 'Preparing';
      case OrderStatus.DELIVERING: return 'Delivering';
      case OrderStatus.DELIVERED: return 'Delivered';
      case OrderStatus.CANCELED: return 'Canceled';
      default: return 'Pending';
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

  return (
    <div className="orders-screen">
      <div className="orders-container">
        {/* Header */}
        <div className="orders-header">
          <h1 className="orders-title">My Orders</h1>
          <p className="orders-subtitle">Track your food orders</p>
        </div>

        {/* Tabs */}
        <div className="orders-tabs">
          <button 
            className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active
          </button>
          <button 
            className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed
          </button>
          <button 
            className={`tab-button ${activeTab === 'cancelled' ? 'active' : ''}`}
            onClick={() => setActiveTab('cancelled')}
          >
            Cancelled
          </button>
        </div>

        {/* Orders List */}
        <div className="orders-list">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading your orders...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <h3>Error Loading Orders</h3>
              <p>{error}</p>
              <button className="retry-button" onClick={fetchUserOrders}>
                Try Again
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🍽️</div>
              <h3>No {activeTab} orders</h3>
              <p>Your {activeTab} orders will appear here</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id || order.orderId} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <h3 className="restaurant-name">
                      {order.shopId ? `Shop ${order.shopId.slice(0, 8)}...` : 'Stadium Food'}
                    </h3>
                    <p className="order-number">#{order.orderId}</p>
                  </div>
                  <div className="order-status">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>

                <div className="order-items">
                  {order.cart && order.cart.length > 0 ? (
                    order.cart.map((item, index) => (
                      <span key={index} className="order-item">
                        {item.quantity}x {item.name}
                        {index < order.cart.length - 1 && ', '}
                      </span>
                    ))
                  ) : (
                    <span className="order-item">No items found</span>
                  )}
                </div>

                <div className="order-details">
                  <div className="order-seat-info">
                    {order.seatInfo && (
                      <span className="seat-info">
                        📍 Section {order.seatInfo.section}, Row {order.seatInfo.row}, Seat {order.seatInfo.seatNo}
                      </span>
                    )}
                  </div>
                  {order.tipAmount > 0 && (
                    <div className="tip-info">
                      <span className="tip-label">Tip:</span>
                      <span className="tip-amount">${order.tipAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="order-footer">
                  <div className="order-time">
                    <span className="time-label">Ordered:</span>
                    <span className="time-value">{order.getFormattedDate()}</span>
                  </div>
                  <div className="order-total">
                    ${order.total.toFixed(2)}
                  </div>
                </div>

                {[OrderStatus.PENDING, OrderStatus.PREPARING].includes(order.status) && (
                  <div className="order-actions">
                    <button className="track-button">Track Order</button>
                    <button className="cancel-button">Cancel</button>
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
