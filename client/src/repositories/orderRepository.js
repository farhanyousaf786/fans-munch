/**
 * Order Repository - Handles Firebase operations for orders
 * Matches Flutter stadium_food OrderRepository functionality
 */

import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  GeoPoint
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Order } from '../models/Order';

class OrderRepository {
  constructor() {
    this.collectionName = 'orders';
  }

  /**
   * Create and save order to Firebase after successful payment
   * Matches Flutter OrderRepository.createOrder()
   */
  async createOrder(orderData) {
    try {
      console.log('📦 Creating order in Firebase...', orderData);

      // Convert JavaScript Date to Firestore Timestamp
      const base = orderData.toMap();
      const withGeo = { ...base };
      // Normalize location fields to Firestore GeoPoint if possible
      if (base.customerLocation && typeof base.customerLocation === 'object' && base.customerLocation.latitude != null && base.customerLocation.longitude != null) {
        withGeo.customerLocation = new GeoPoint(base.customerLocation.latitude, base.customerLocation.longitude);
      }
      if (base.location && typeof base.location === 'object' && base.location.latitude != null && base.location.longitude != null) {
        withGeo.location = new GeoPoint(base.location.latitude, base.location.longitude);
      }

      const orderWithTimestamp = {
        ...withGeo,
        createdAt: Timestamp.fromDate(orderData.createdAt),
        updatedAt: Timestamp.fromDate(orderData.updatedAt || new Date()),
        deliveryTime: orderData.deliveryTime ? Timestamp.fromDate(orderData.deliveryTime) : null
      };

      // Add to Firebase orders collection
      const docRef = await addDoc(collection(db, this.collectionName), orderWithTimestamp);
      
      console.log('✅ Order created successfully with ID:', docRef.id);

      // Return the order with the Firebase document ID
      const createdOrder = new Order({
        ...orderData,
        id: docRef.id
      });

      // TODO: Send notification to shop owner (like Flutter app)
      // this.sendNotificationToShop(createdOrder);

      return createdOrder;
    } catch (error) {
      console.error('❌ Error creating order:', error);
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  /**
   * Fetch orders for a specific user
   * Matches Flutter OrderRepository.fetchOrders()
   */
  async fetchOrdersForUser(userId) {
    try {
      console.log('📋 Fetching orders for user:', userId);

      if (!userId) {
        throw new Error('User ID is required to fetch orders');
      }

      const ordersRef = collection(db, this.collectionName);
      const q = query(
        ordersRef,
        where('userInfo.userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const orders = [];

      querySnapshot.forEach((doc) => {
        const orderData = doc.data();
        const order = Order.fromMap(doc.id, orderData);
        orders.push(order);
      });

      console.log('✅ Fetched orders:', orders.length);
      return orders;
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }
  }

  /**
   * Stream orders for a specific user (real-time updates)
   * Matches Flutter OrderRepository.streamOrders()
   */
  streamOrdersForUser(userId, callback) {
    try {
      console.log('🔄 Setting up real-time orders stream for user:', userId);

      if (!userId) {
        throw new Error('User ID is required to stream orders');
      }

      const ordersRef = collection(db, this.collectionName);
      const q = query(
        ordersRef,
        where('userInfo.userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      // Set up real-time listener
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const orders = [];
        
        querySnapshot.forEach((doc) => {
          const orderData = doc.data();
          const order = Order.fromMap(doc.id, orderData);
          orders.push(order);
        });

        console.log('🔄 Orders updated:', orders.length);
        callback(orders);
      }, (error) => {
        console.error('❌ Error in orders stream:', error);
        callback([], error);
      });

      return unsubscribe; // Return unsubscribe function
    } catch (error) {
      console.error('❌ Error setting up orders stream:', error);
      throw new Error(`Failed to set up orders stream: ${error.message}`);
    }
  }

  /**
   * Fetch all orders for admin/shop owner
   */
  async fetchAllOrders() {
    try {
      console.log('📋 Fetching all orders...');

      const ordersRef = collection(db, this.collectionName);
      const q = query(ordersRef, orderBy('createdAt', 'desc'));

      const querySnapshot = await getDocs(q);
      const orders = [];

      querySnapshot.forEach((doc) => {
        const orderData = doc.data();
        const order = Order.fromMap(doc.id, orderData);
        orders.push(order);
      });

      console.log('✅ Fetched all orders:', orders.length);
      return orders;
    } catch (error) {
      console.error('❌ Error fetching all orders:', error);
      throw new Error(`Failed to fetch all orders: ${error.message}`);
    }
  }

  /**
   * Fetch orders for a specific shop
   */
  async fetchOrdersForShop(shopId) {
    try {
      console.log('📋 Fetching orders for shop:', shopId);

      if (!shopId) {
        throw new Error('Shop ID is required to fetch orders');
      }

      const ordersRef = collection(db, this.collectionName);
      const q = query(
        ordersRef,
        where('shopId', '==', shopId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const orders = [];

      querySnapshot.forEach((doc) => {
        const orderData = doc.data();
        const order = Order.fromMap(doc.id, orderData);
        orders.push(order);
      });

      console.log('✅ Fetched shop orders:', orders.length);
      return orders;
    } catch (error) {
      console.error('❌ Error fetching shop orders:', error);
      throw new Error(`Failed to fetch shop orders: ${error.message}`);
    }
  }

  /**
   * Send notification to shop owner (placeholder for future implementation)
   * Matches Flutter app notification logic
   */
  async sendNotificationToShop(order) {
    try {
      console.log('🔔 Sending notification to shop for order:', order.orderId);
      
      // TODO: Implement push notification to shop owner
      // This would require:
      // 1. Fetch shop owner's FCM token from Firebase
      // 2. Send push notification via Firebase Cloud Messaging
      // 3. Include order details in notification
      
      console.log('📝 Notification logic not implemented yet');
    } catch (error) {
      console.error('❌ Error sending shop notification:', error);
      // Don't throw error - notification failure shouldn't break order creation
    }
  }

  /**
   * Calculate order totals (helper method)
   * Matches Flutter OrderRepository calculation logic
   */
  calculateOrderTotals(cartItems, deliveryFee = 2, tipAmount = 0, discount = 0) {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + deliveryFee + tipAmount - discount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      deliveryFee: Math.round(deliveryFee * 100) / 100,
      tipAmount: Math.round(tipAmount * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  }
}

// Export singleton instance
const orderRepository = new OrderRepository();
export default orderRepository;
