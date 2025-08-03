import React, { useState, useEffect } from 'react';
import './OrdersScreen.css';

const OrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // active, completed, cancelled

  useEffect(() => {
    // TODO: Fetch orders from Firebase
    // For now, using mock data
    setOrders([
      {
        id: '1',
        restaurantName: 'Stadium Burgers',
        items: ['Classic Burger', 'Fries', 'Coke'],
        total: 24.99,
        status: 'preparing',
        orderTime: '2:30 PM',
        estimatedTime: '15 mins',
        orderNumber: '#1234'
      },
      {
        id: '2',
        restaurantName: 'Pizza Corner',
        items: ['Pepperoni Pizza', 'Garlic Bread'],
        total: 18.50,
        status: 'completed',
        orderTime: '1:45 PM',
        completedTime: '2:15 PM',
        orderNumber: '#1233'
      }
    ]);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'preparing': return '#FF9500';
      case 'ready': return '#34C759';
      case 'completed': return '#007AFF';
      case 'cancelled': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'preparing': return 'Preparing';
      case 'ready': return 'Ready for Pickup';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'active') return ['preparing', 'ready'].includes(order.status);
    if (activeTab === 'completed') return order.status === 'completed';
    if (activeTab === 'cancelled') return order.status === 'cancelled';
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
          {filteredOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🍽️</div>
              <h3>No {activeTab} orders</h3>
              <p>Your {activeTab} orders will appear here</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <h3 className="restaurant-name">{order.restaurantName}</h3>
                    <p className="order-number">{order.orderNumber}</p>
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
                  {order.items.map((item, index) => (
                    <span key={index} className="order-item">
                      {item}
                      {index < order.items.length - 1 && ', '}
                    </span>
                  ))}
                </div>

                <div className="order-footer">
                  <div className="order-time">
                    <span className="time-label">Ordered:</span>
                    <span className="time-value">{order.orderTime}</span>
                    {order.estimatedTime && (
                      <>
                        <span className="time-separator">•</span>
                        <span className="estimated-time">Est. {order.estimatedTime}</span>
                      </>
                    )}
                  </div>
                  <div className="order-total">
                    ${order.total.toFixed(2)}
                  </div>
                </div>

                {order.status === 'preparing' && (
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
