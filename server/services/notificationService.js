// server/services/notificationService.js
const admin = require('firebase-admin');
const path = require('path');

class NotificationService {
  constructor() {
    this.isInitialized = false;
    this.initializeFirebase();
  }

  initializeFirebase() {
    try {
      if (admin.apps.length) {
        this.isInitialized = true;
        return;
      }

      // Strategy 1: GOOGLE_APPLICATION_CREDENTIALS (ADC)
      const hasADC = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

      // Strategy 2: FIREBASE_SERVICE_ACCOUNT as JSON or base64 JSON
      const svcAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT || '';
      let svcAccount = null;
      if (svcAccountRaw) {
        try {
          // Try parse directly
          svcAccount = JSON.parse(svcAccountRaw);
        } catch (_) {
          // Maybe base64
          try {
            const decoded = Buffer.from(svcAccountRaw, 'base64').toString('utf8');
            svcAccount = JSON.parse(decoded);
          } catch (_) {
            // ignore
          }
        }
      }

      // Strategy 3: individual env vars
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      if (privateKey && privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }

      // Debug which inputs are present (do not print secrets)
      const hasProjectId = !!projectId;
      const hasClientEmail = !!clientEmail;
      const hasPrivateKey = !!privateKey;
      console.log('[FCM_INIT] Detected vars:', {
        hasADC,
        FIREBASE_SERVICE_ACCOUNT: !!svcAccountRaw,
        hasProjectId,
        hasClientEmail,
        hasPrivateKey,
      });

      if (svcAccount) {
        admin.initializeApp({
          credential: admin.credential.cert(svcAccount),
          projectId: svcAccount.project_id || projectId,
        });
        console.log('✅ Firebase Admin initialized with FIREBASE_SERVICE_ACCOUNT');
      } else if (clientEmail && privateKey && projectId) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
          projectId,
        });
        console.log('✅ Firebase Admin initialized with individual env vars');
      } else if (hasADC) {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: projectId,
        });
        console.log('✅ Firebase Admin initialized with Application Default Credentials');
      } else {
        // Final fallback: try ADC without env var (might work on GCP), but warn explicitly
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: projectId,
        });
        console.warn('⚠️ Initializing Firebase Admin with ADC fallback. Set credentials in .env to avoid env detection issues.');
      }

      this.isInitialized = true;
    } catch (error) {
      this.isInitialized = false;
      console.error('❌ Failed to initialize Firebase Admin SDK:', error?.message || error);
      console.error('ℹ️ Set one of the following in server/.env:\n' +
        '- GOOGLE_APPLICATION_CREDENTIALS=/abs/path/to/serviceAccountKey.json\n' +
        '- FIREBASE_SERVICE_ACCOUNT=<JSON or base64 JSON>\n' +
        '- FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    }
  }

  /**
   * Send FCM notification to a specific token
   * @param {string} fcmToken - The FCM token of the recipient
   * @param {Object} notification - Notification payload
   * @param {Object} data - Additional data payload
   * @returns {Promise<string>} - Message ID if successful
   */
  async sendNotification(fcmToken, notification, data = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('Firebase Admin SDK not initialized');
      }

      if (!fcmToken) {
        throw new Error('FCM token is required');
      }

      // Mask token for logs (show first 8 and last 6 chars)
      const mask = (t) => {
        if (!t || t.length < 20) return '[token]';
        return `${t.slice(0, 8)}...${t.slice(-6)}`;
      };

      console.log(`[FCM] Sending to token: ${mask(fcmToken)}`);

      const message = {
        token: fcmToken,
        notification: {
          title: notification.title || 'New Notification',
          body: notification.body || ''
        },
        data: {
          ...data,
          // Ensure all data values are strings
          ...Object.keys(data).reduce((acc, key) => {
            acc[key] = String(data[key]);
            return acc;
          }, {})
        },
        android: {
          notification: {
            sound: 'default',
            priority: 'high',
            channelId: 'delivery_orders'
          }
        },
        webpush: notification.icon ? {
          notification: {
            icon: notification.icon
          }
        } : undefined,
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      const response = await admin.messaging().send(message);
      console.log('✅ FCM notification sent successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to send FCM notification:', error);
      throw error;
    }
  }

  /**
   * Send notification to multiple tokens
   * @param {string[]} fcmTokens - Array of FCM tokens
   * @param {Object} notification - Notification payload
   * @param {Object} data - Additional data payload
   * @returns {Promise<Object>} - Batch response
   */
  async sendMulticastNotification(fcmTokens, notification, data = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('Firebase Admin SDK not initialized');
      }

      if (!fcmTokens || fcmTokens.length === 0) {
        throw new Error('At least one FCM token is required');
      }

      const message = {
        tokens: fcmTokens,
        notification: {
          title: notification.title || 'New Notification',
          body: notification.body || '',
          ...notification
        },
        data: {
          ...data,
          // Ensure all data values are strings
          ...Object.keys(data).reduce((acc, key) => {
            acc[key] = String(data[key]);
            return acc;
          }, {})
        },
        android: {
          notification: {
            sound: 'default',
            priority: 'high',
            channelId: 'delivery_orders'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      const response = await admin.messaging().sendMulticast(message);
      console.log(`✅ FCM multicast sent to ${fcmTokens.length} tokens:`, response);
      return response;
    } catch (error) {
      console.error('❌ Failed to send FCM multicast notification:', error);
      throw error;
    }
  }

  /**
   * Send new order notification to delivery user
   * @param {string} deliveryUserFcmToken - FCM token of delivery user
   * @param {Object} orderData - Order information
   * @returns {Promise<string>} - Message ID if successful
   */
  async sendNewOrderNotification(deliveryUserFcmToken, orderData) {
    const notification = {
      title: '🍔 New Order Available!',
      body: `Order #${orderData.orderId} - ${orderData.customerName} at ${orderData.stadiumName}`,
      icon: 'order_icon'
    };

    const data = {
      type: 'new_order',
      orderId: orderData.orderId,
      customerName: orderData.customerName || '',
      stadiumName: orderData.stadiumName || '',
      seatInfo: JSON.stringify(orderData.seatInfo || {}),
      totalAmount: String(orderData.totalAmount || 0),
      deliveryFee: String(orderData.deliveryFee || 0),
      customerLocation: JSON.stringify(orderData.customerLocation || {}),
      timestamp: new Date().toISOString()
    };

    return this.sendNotification(deliveryUserFcmToken, notification, data);
  }

  /**
   * Send order status update notification
   * @param {string} fcmToken - FCM token of recipient
   * @param {Object} orderData - Order information
   * @param {string} status - New order status
   * @returns {Promise<string>} - Message ID if successful
   */
  async sendOrderStatusNotification(fcmToken, orderData, status) {
    let title, body;
    
    switch (status) {
      case 'accepted':
        title = '✅ Order Accepted';
        body = `Your order #${orderData.orderId} has been accepted by the delivery person`;
        break;
      case 'picked_up':
        title = '📦 Order Picked Up';
        body = `Your order #${orderData.orderId} has been picked up and is on the way`;
        break;
      case 'delivered':
        title = '🎉 Order Delivered';
        body = `Your order #${orderData.orderId} has been delivered successfully`;
        break;
      default:
        title = '📱 Order Update';
        body = `Your order #${orderData.orderId} status: ${status}`;
    }

    const notification = { title, body };
    const data = {
      type: 'order_status_update',
      orderId: orderData.orderId,
      status: status,
      timestamp: new Date().toISOString()
    };

    return this.sendNotification(fcmToken, notification, data);
  }
}

// Export singleton instance
module.exports = new NotificationService();
