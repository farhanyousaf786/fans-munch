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
    orderCode = '',
    deliveryUserId = null,
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
    this.orderCode = orderCode;
    this.deliveryUserId = deliveryUserId;
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
      orderCode: data.orderCode || '',
      deliveryUserId: data.deliveryUserId || null,
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
      cart: this.cart.map(item => {
        // Store complete food data like Flutter does
        const foodData = {
          id: item.id,
          allergens: item.allergens || [],
          category: item.category || 'Food',
          createdAt: item.createdAt instanceof Date ? item.createdAt : (item.createdAt && item.createdAt.toDate ? item.createdAt.toDate() : (item.createdAt ? new Date(item.createdAt) : new Date())),
          customization: item.customization || {},
          description: item.description || '',
          extras: item.extras || [],
          images: item.images || [],
          isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
          name: item.name || '',
          nutritionalInfo: item.nutritionalInfo || {},
          preparationTime: item.preparationTime || 15,
          price: parseFloat((item.price || 0).toFixed(2)),
          sauces: item.sauces || [],
          shopId: item.shopId || '',
          stadiumId: item.stadiumId || '',
          sizes: item.sizes || [],
          toppings: item.toppings || [],
          updatedAt: item.updatedAt instanceof Date ? item.updatedAt : (item.updatedAt && item.updatedAt.toDate ? item.updatedAt.toDate() : (item.updatedAt ? new Date(item.updatedAt) : new Date())),
          foodType: item.foodType || { halal: false, kosher: false, vegan: false },
          quantity: item.quantity || 1,
          // Additional cart-specific fields
          originalPrice: item.originalPrice || item.price || 0,
          discountedPrice: item.discountedPrice || null
        };
        return foodData;
      }),
      subtotal: parseFloat(this.subtotal.toFixed(2)),
      deliveryFee: parseFloat(this.deliveryFee.toFixed(2)),
      discount: parseFloat(this.discount.toFixed(2)),
      total: parseFloat(this.total.toFixed(2)), // Ensure 2 decimal places
      tipAmount: parseFloat(this.tipAmount.toFixed(2)),
      userInfo: this.userInfo,
      stadiumId: this.stadiumId,
      shopId: this.shopId,
      orderId: this.orderId,
      orderCode: this.orderCode,
      deliveryUserId: this.deliveryUserId,
      status: this.status,
      createdAt: this.createdAt instanceof Date ? this.createdAt : (this.createdAt ? new Date(this.createdAt) : null),
      deliveryTime: this.deliveryTime instanceof Date ? this.deliveryTime : (this.deliveryTime ? new Date(this.deliveryTime) : null),
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
    
    // Generate 6-digit random order code
    const orderCode = Math.floor(100000 + Math.random() * 900000).toString();

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
      orderCode,
      deliveryUserId: null,
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
