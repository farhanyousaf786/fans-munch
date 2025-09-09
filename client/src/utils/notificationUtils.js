// client/src/utils/notificationUtils.js
/**
 * Utility functions for handling FCM notifications
 */

/**
 * Send notification to delivery user about new order
 * @param {string} deliveryUserId - The delivery user's ID
 * @param {Object} orderData - Order information
 * @returns {Promise<boolean>} - Success status
 */
export const sendNewOrderNotification = async (deliveryUserId, orderData) => {
  try {
    const API_BASE = (process.env.REACT_APP_API_BASE && process.env.REACT_APP_API_BASE.trim())
      ? process.env.REACT_APP_API_BASE.trim()
      : (window.location.port === '3000' ? 'http://localhost:5001' : '');

    const notificationData = {
      deliveryUserId,
      orderData
    };

    const response = await fetch(`${API_BASE}/api/notifications/send-new-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificationData)
    });

    if (response.ok) {
      console.log('✅ Notification sent to delivery user successfully');
      return true;
    } else {
      const errorText = await response.text();
      console.warn('⚠️ Failed to send notification to delivery user:', errorText);
      return false;
    }
  } catch (error) {
    console.warn('⚠️ Error sending notification to delivery user:', error);
    return false;
  }
};

/**
 * Send order status update notification to customer
 * @param {string} userId - The customer's user ID
 * @param {Object} orderData - Order information
 * @param {string} status - New order status
 * @returns {Promise<boolean>} - Success status
 */
export const sendOrderStatusNotification = async (userId, orderData, status) => {
  try {
    const API_BASE = (process.env.REACT_APP_API_BASE && process.env.REACT_APP_API_BASE.trim())
      ? process.env.REACT_APP_API_BASE.trim()
      : (window.location.port === '3000' ? 'http://localhost:5001' : '');

    const notificationData = {
      userId,
      orderData,
      status
    };

    const response = await fetch(`${API_BASE}/api/notifications/send-status-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificationData)
    });

    if (response.ok) {
      console.log('✅ Status notification sent to customer successfully');
      return true;
    } else {
      const errorText = await response.text();
      console.warn('⚠️ Failed to send status notification to customer:', errorText);
      return false;
    }
  } catch (error) {
    console.warn('⚠️ Error sending status notification to customer:', error);
    return false;
  }
};

/**
 * Get delivery user's FCM token
 * @param {string} deliveryUserId - The delivery user's ID
 * @returns {Promise<string|null>} - FCM token or null if not found
 */
export const getDeliveryUserToken = async (deliveryUserId) => {
  try {
    const API_BASE = (process.env.REACT_APP_API_BASE && process.env.REACT_APP_API_BASE.trim())
      ? process.env.REACT_APP_API_BASE.trim()
      : (window.location.port === '3000' ? 'http://localhost:5001' : '');

    const response = await fetch(`${API_BASE}/api/notifications/delivery-user/${deliveryUserId}/token`);

    if (response.ok) {
      const data = await response.json();
      return data.fcmToken;
    } else {
      console.warn('⚠️ Failed to get delivery user token:', await response.text());
      return null;
    }
  } catch (error) {
    console.warn('⚠️ Error getting delivery user token:', error);
    return null;
  }
};
