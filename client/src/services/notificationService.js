import { requestNotificationPermission, onMessageListener } from '../config/firebase';
import authService from './authService';

class NotificationService {
  constructor() {
    this.fcmToken = null;
    this.isInitialized = false;
  }

  // Initialize notification service
  async init() {
    try {
      if (this.isInitialized) return;

      // Request permission and get FCM token
      this.fcmToken = await requestNotificationPermission();
      
      if (this.fcmToken) {
        console.log('✅ Notification service initialized with token:', this.fcmToken);
        
        // Save token to user profile if user is logged in
        const user = authService.getCurrentUser();
        if (user) {
          await authService.saveFCMToken(user.uid, this.fcmToken);
        }
        
        // Listen for foreground messages
        this.listenForMessages();
        
        this.isInitialized = true;
        return true;
      } else {
        console.warn('⚠️ Failed to get FCM token');
        return false;
      }
    } catch (error) {
      console.error('❌ Notification service initialization failed:', error);
      return false;
    }
  }

  // Listen for foreground messages
  listenForMessages() {
    onMessageListener()
      .then((payload) => {
        console.log('📱 Received foreground message:', payload);
        
        // Show browser notification
        this.showBrowserNotification(
          payload.notification?.title || 'Food Munch',
          payload.notification?.body || 'You have a new notification',
          payload.data
        );
      })
      .catch((error) => {
        console.error('❌ Error listening for messages:', error);
      });
  }

  // Show browser notification
  showBrowserNotification(title, body, data = {}) {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: body,
        icon: '/favicon.ico', // You can customize this
        badge: '/favicon.ico',
        tag: data.type || 'general',
        data: data
      });

      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        // Handle notification click based on type
        this.handleNotificationClick(data);
      };

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  }

  // Handle notification click actions
  handleNotificationClick(data) {
    switch (data.type) {
      case 'order_confirmed':
      case 'order_status_update':
        // Navigate to order details
        if (data.orderId) {
          window.location.href = `/orders/${data.orderId}`;
        }
        break;
      case 'new_menu_item':
        // Navigate to menu
        window.location.href = '/menu';
        break;
      case 'promotion':
        // Navigate to promotions or home
        window.location.href = '/';
        break;
      default:
        // Default action - go to home
        window.location.href = '/';
    }
  }

  // Get current FCM token
  getFCMToken() {
    return this.fcmToken;
  }

  // Update FCM token for current user
  async updateTokenForUser() {
    try {
      const user = authService.getCurrentUser();
      if (user && this.fcmToken) {
        await authService.saveFCMToken(user.uid, this.fcmToken);
        console.log('✅ FCM token updated for user');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to update FCM token:', error);
      return false;
    }
  }

  // Subscribe to topic (for promotional notifications)
  async subscribeToTopic(topic) {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User must be logged in to subscribe to topics');
      }

      const idToken = await authService.getIdToken();
      if (!idToken) {
        throw new Error('Failed to get authentication token');
      }

      const response = await fetch('http://localhost:5002/api/notifications/subscribe-topic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          userId: user.uid,
          topic: topic
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log(`✅ Subscribed to topic: ${topic}`);
        return true;
      } else {
        console.error(`❌ Failed to subscribe to topic: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Topic subscription error:', error);
      return false;
    }
  }

  // Get notification history
  async getNotificationHistory(limit = 20, offset = 0) {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User must be logged in');
      }

      const idToken = await authService.getIdToken();
      if (!idToken) {
        throw new Error('Failed to get authentication token');
      }

      const response = await fetch(`http://localhost:5002/api/notifications/history?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      const result = await response.json();
      if (result.success) {
        return result.notifications;
      } else {
        console.error('❌ Failed to get notification history:', result.error);
        return [];
      }
    } catch (error) {
      console.error('❌ Get notification history error:', error);
      return [];
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;
