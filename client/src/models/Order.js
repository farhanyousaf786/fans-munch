/**
 * Order Model - Matches Flutter stadium_food Order model exactly
 * Used for saving orders to Firebase after successful Stripe payment
 */

export const OrderStatus = {
  PENDING: 0,
  PREPARING: 1,
  DELIVERING: 2,
  DELIVERED: 3,
  CANCELED: 4,
  
  // Helper methods
  toString: (status) => {
    switch (status) {
      case OrderStatus.PENDING: return 'Pending';
      case OrderStatus.PREPARING: return 'Preparing';
      case OrderStatus.DELIVERING: return 'Delivering';
      case OrderStatus.DELIVERED: return 'Delivered';
      case OrderStatus.CANCELED: return 'Canceled';
      default: return 'Pending';
    }
  },
  
  getColor: (status) => {
    switch (status) {
      case OrderStatus.PENDING: return '#FF9800';
      case OrderStatus.PREPARING: return '#2196F3';
      case OrderStatus.DELIVERING: return '#9C27B0';
      case OrderStatus.DELIVERED: return '#4CAF50';
      case OrderStatus.CANCELED: return '#F44336';
      default: return '#FF9800';
    }
  }
};

export class Order {
  constructor({
    cart = [],
    subtotal = 0,
    deliveryFee = 0,
    discount = 0,
    total = 0,
    tipAmount = 0,
    userInfo = {},
    stadiumId = '',
    shopId = '',
    orderId = '',
    status = OrderStatus.PENDING,
    createdAt = null,
    deliveryTime = null,
    seatInfo = {},
    id = null
  }) {
    this.cart = cart;
    this.subtotal = subtotal;
    this.deliveryFee = deliveryFee;
    this.discount = discount;
    this.total = total;
    this.tipAmount = tipAmount;
    this.userInfo = userInfo;
    this.stadiumId = stadiumId;
    this.shopId = shopId;
    this.orderId = orderId;
    this.status = status;
    this.createdAt = createdAt;
    this.deliveryTime = deliveryTime;
    this.seatInfo = seatInfo;
    this.id = id;
  }

  /**
   * Create Order from Firebase document data (matches Flutter fromMap)
   */
  static fromMap(id, data) {
    return new Order({
      id: id,
      cart: data.cart || [],
      subtotal: parseFloat(data.subtotal || 0),
      deliveryFee: parseFloat(data.deliveryFee || 0),
      discount: parseFloat(data.discount || 0),
      total: parseFloat(data.total || 0),
      tipAmount: parseFloat(data.tipAmount || 0),
      userInfo: data.userInfo || {},
      stadiumId: data.stadiumId || '',
      shopId: data.shopId || '',
      orderId: data.orderId || '',
      status: data.status || OrderStatus.PENDING,
      createdAt: data.createdAt,
      deliveryTime: data.deliveryTime,
      seatInfo: data.seatInfo || {}
    });
  }

  /**
   * Convert Order to Firebase document data (matches Flutter toMap)
   */
  toMap() {
    return {
      cart: this.cart.map(item => ({
        ...item,
        quantity: item.quantity || 1
      })),
      subtotal: this.subtotal,
      deliveryFee: this.deliveryFee,
      discount: this.discount,
      total: this.total,
      tipAmount: this.tipAmount,
      userInfo: this.userInfo,
      stadiumId: this.stadiumId,
      shopId: this.shopId,
      orderId: this.orderId,
      status: this.status,
      createdAt: this.createdAt,
      deliveryTime: this.deliveryTime,
      seatInfo: this.seatInfo
    };
  }

  /**
   * Create a new order from current cart and user data (matches Flutter createOrder logic)
   */
  static createFromCart({
    cartItems,
    subtotal,
    deliveryFee,
    discount,
    tipAmount,
    userData,
    seatInfo,
    stadiumId,
    shopId
  }) {
    const total = subtotal + deliveryFee + tipAmount - discount;
    const orderId = Date.now().toString();
    const createdAt = new Date();

    return new Order({
      cart: [...cartItems],
      subtotal,
      deliveryFee,
      discount,
      total,
      tipAmount,
      userInfo: {
        userEmail: userData.email || '',
        userName: userData.firstName || '',
        userPhoneNo: userData.phone || '',
        userId: userData.id || ''
      },
      stadiumId,
      shopId,
      orderId,
      status: OrderStatus.PENDING,
      createdAt,
      deliveryTime: null, // Can be calculated later
      seatInfo: {
        row: seatInfo.row || '',
        seatNo: seatInfo.seatNo || '',
        section: seatInfo.section || '',
        seatDetails: seatInfo.seatDetails || ''
      }
    });
  }

  /**
   * Get formatted status string
   */
  getStatusString() {
    return OrderStatus.toString(this.status);
  }

  /**
   * Get status color
   */
  getStatusColor() {
    return OrderStatus.getColor(this.status);
  }

  /**
   * Check if order is active (not delivered or canceled)
   */
  isActive() {
    return this.status !== OrderStatus.DELIVERED && this.status !== OrderStatus.CANCELED;
  }

  /**
   * Get formatted creation date
   */
  getFormattedDate() {
    if (!this.createdAt) return '';
    
    const date = this.createdAt instanceof Date ? this.createdAt : new Date(this.createdAt);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  /**
   * Get order summary for display
   */
  getSummary() {
    return {
      orderId: this.orderId,
      total: this.total,
      itemCount: this.cart.reduce((sum, item) => sum + (item.quantity || 1), 0),
      status: this.getStatusString(),
      date: this.getFormattedDate(),
      shopId: this.shopId,
      stadiumId: this.stadiumId
    };
  }
}

export default Order;
