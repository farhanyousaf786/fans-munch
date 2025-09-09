// server/controllers/notificationController.js
const notificationService = require('../services/notificationService');
const admin = require('firebase-admin');

/**
 * Send notification to delivery user about new order
 */
const sendNewOrderNotification = async (req, res) => {
  try {
    const { deliveryUserId, orderData } = req.body;

    if (!orderData) {
      return res.status(400).json({
        error: 'orderData is required'
      });
    }

    const db = admin.firestore();

    let deliveryMessageId = null;
    let shopMessageId = null;

    // Optionally send to delivery user if id provided
    if (deliveryUserId) {
      try {
        const deliveryUserDoc = await db.collection('deliveryUsers').doc(deliveryUserId).get();
        if (!deliveryUserDoc.exists) {
          console.warn(`Delivery user not found: ${deliveryUserId}`);
        } else {
          const deliveryUserData = deliveryUserDoc.data();
          const fcmToken = deliveryUserData.fcmToken;
          if (!fcmToken) {
            console.warn('Delivery user does not have an FCM token');
          } else {
            deliveryMessageId = await notificationService.sendNewOrderNotification(fcmToken, orderData);
          }
        }
      } catch (deliveryErr) {
        console.warn('⚠️ Failed to send delivery notification:', deliveryErr?.message || deliveryErr);
      }
    }

    // Optionally notify the shop user if a shopId was provided and a token exists
    try {
      const shopId = orderData.shopId;
      if (shopId) {
        const shopDoc = await db.collection('shops').doc(shopId).get();
        if (shopDoc.exists) {
          const shopData = shopDoc.data() || {};
          const shopToken = shopData.shopUserFcmToken || shopData.fcmToken || null;
          if (shopToken) {
            shopMessageId = await notificationService.sendNewOrderNotification(shopToken, orderData);
          } else {
            console.warn(`Shop ${shopId} has no FCM token field (shopUserFcmToken/fcmToken)`);
          }
        } else {
          console.warn(`Shop not found: ${shopId}`);
        }
      }
    } catch (shopNotifyErr) {
      console.warn('⚠️ Failed to send shop notification:', shopNotifyErr?.message || shopNotifyErr);
      // Do not fail the overall request if shop notification fails
    }

    res.status(200).json({
      success: true,
      deliveryMessageId,
      shopMessageId,
      message: 'Notification attempt complete'
    });

  } catch (error) {
    console.error('❌ Error sending new order notification:', error);
    res.status(500).json({
      error: 'Failed to send notification',
      details: error.message
    });
  }
};

/**
 * Send order status update notification
 */
const sendOrderStatusNotification = async (req, res) => {
  try {
    const { userId, orderData, status } = req.body;

    if (!userId || !orderData || !status) {
      return res.status(400).json({
        error: 'userId, orderData, and status are required'
      });
    }

    // Get user's FCM token from Firestore
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const userData = userDoc.data();
    const fcmToken = userData.fcmToken;

    if (!fcmToken) {
      return res.status(400).json({
        error: 'User does not have an FCM token'
      });
    }

    // Send notification
    const messageId = await notificationService.sendOrderStatusNotification(fcmToken, orderData, status);

    res.status(200).json({
      success: true,
      messageId,
      message: 'Status notification sent successfully'
    });

  } catch (error) {
    console.error('❌ Error sending order status notification:', error);
    res.status(500).json({
      error: 'Failed to send notification',
      details: error.message
    });
  }
};

/**
 * Get delivery user FCM token by user ID
 */
const getDeliveryUserToken = async (req, res) => {
  try {
    const { deliveryUserId } = req.params;

    if (!deliveryUserId) {
      return res.status(400).json({
        error: 'deliveryUserId is required'
      });
    }

    const db = admin.firestore();
    const deliveryUserDoc = await db.collection('deliveryUsers').doc(deliveryUserId).get();
    
    if (!deliveryUserDoc.exists) {
      return res.status(404).json({
        error: 'Delivery user not found'
      });
    }

    const deliveryUserData = deliveryUserDoc.data();
    const fcmToken = deliveryUserData.fcmToken;

    res.status(200).json({
      success: true,
      fcmToken: fcmToken || null,
      hasToken: !!fcmToken
    });

  } catch (error) {
    console.error('❌ Error getting delivery user token:', error);
    res.status(500).json({
      error: 'Failed to get delivery user token',
      details: error.message
    });
  }
};

module.exports = {
  sendNewOrderNotification,
  sendOrderStatusNotification,
  getDeliveryUserToken
};
