/**
 * Order Model - Matches Flutter stadium_food Order model
 * Used for saving orders to Firebase after successful Stripe payment
 */
import { Timestamp, GeoPoint } from 'firebase/firestore';

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
    id = null,
    tipPercentage = 0,
    isTipAdded = false,
    customerLocation = null,
    location = null,
    updatedAt = null
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
    this.tipPercentage = tipPercentage;
    this.isTipAdded = isTipAdded;
    this.customerLocation = customerLocation; // { latitude, longitude } or array
    this.location = location; // optional secondary location
    this.updatedAt = updatedAt;
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
      tipPercentage: parseFloat(data.tipPercentage || 0),
      isTipAdded: !!data.isTipAdded,
      userInfo: data.userInfo || {},
      stadiumId: data.stadiumId || '',
      shopId: data.shopId || '',
      orderId: data.orderId || '',
      orderCode: data.orderCode || '',
      deliveryUserId: data.deliveryUserId || null,
      status: data.status || OrderStatus.PENDING,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deliveryTime: data.deliveryTime,
      seatInfo: data.seatInfo || {},
      customerLocation: data.customerLocation || null,
      location: data.location || null
    });
  }

  /**
   * Convert Order to Firebase document data (matches Flutter toMap)
   */
  toMap() {
    return {
      cart: this.cart.map(item => {
        // Store complete food data like Flutter does
        // Ensure category is an ID and descriptionMap has content
        const resolvedCategory = item.categoryId || item.category || '';
        const resolvedDescriptionMap = (() => {
          const dm = item.descriptionMap || {};
          const hasContent = dm && Object.keys(dm).length > 0;
          if (hasContent) return dm;
          const desc = item.description || '';
          return {
            en: (item.nameMap && item.nameMap.en) ? (dm.en || desc) : desc,
            he: (item.nameMap && item.nameMap.he) ? (dm.he || desc) : desc,
          };
        })();

        const resolvedNameMap = (() => {
          const nm = item.nameMap || {};
          const hasContent = nm && Object.keys(nm).length > 0;
          if (hasContent) return nm;
          const base = item.name || '';
          return {
            en: nm.en || base,
            he: nm.he || base,
          };
        })();

        const foodData = {
          id: item.id,
          docId: item.docId || item.id,
          allergens: item.allergens || [],
          category: resolvedCategory,
          createdAt: item.createdAt instanceof Date ? item.createdAt : (item.createdAt && item.createdAt.toDate ? item.createdAt.toDate() : (item.createdAt ? new Date(item.createdAt) : new Date())),
          customization: item.customization || {},
          description: item.description || '',
          descriptionMap: resolvedDescriptionMap,
          extras: item.extras || [],
          images: item.images || [],
          isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
          name: item.name || '',
          nameMap: resolvedNameMap,
          nutritionalInfo: item.nutritionalInfo || {},
          preparationTime: item.preparationTime || 15,
          price: parseFloat((item.price || 0).toFixed(2)),
           currency: item.currency || 'USD',
          sauces: item.sauces || [],
          // Shops: include all shopIds exactly like menuItems schema; keep shopId for compatibility
          shopIds: Array.isArray(item.shopIds) ? [...item.shopIds] : (item.shopId ? [item.shopId] : []),
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
      tipPercentage: parseFloat((this.tipPercentage || 0).toFixed(2)),
      isTipAdded: !!this.isTipAdded,
      userInfo: this.userInfo,
      stadiumId: this.stadiumId,
      shopId: this.shopId,
      orderId: this.orderId,
      orderCode: this.orderCode,
      deliveryUserId: this.deliveryUserId,
      status: this.status,
      // Use Firestore Timestamp to match Flutter
      createdAt: this.createdAt
        ? (this.createdAt instanceof Date ? Timestamp.fromDate(this.createdAt) : (typeof this.createdAt?.toDate === 'function' ? this.createdAt : Timestamp.fromDate(new Date(this.createdAt))))
        : Timestamp.fromDate(new Date()),
      updatedAt: this.updatedAt
        ? (this.updatedAt instanceof Date ? Timestamp.fromDate(this.updatedAt) : (typeof this.updatedAt?.toDate === 'function' ? this.updatedAt : Timestamp.fromDate(new Date(this.updatedAt))))
        : Timestamp.fromDate(new Date()),
      deliveryTime: this.deliveryTime
        ? (this.deliveryTime instanceof Date ? Timestamp.fromDate(this.deliveryTime) : (typeof this.deliveryTime?.toDate === 'function' ? this.deliveryTime : Timestamp.fromDate(new Date(this.deliveryTime))))
        : null,
      seatInfo: this.seatInfo,
      // Ensure GeoPoint for locations if latitude/longitude provided
      customerLocation: (() => {
        const loc = this.customerLocation;
        if (!loc) return null;
        if (loc instanceof GeoPoint) return loc;
        if (typeof loc?.lat === 'number' && typeof loc?.lng === 'number') return new GeoPoint(loc.lat, loc.lng);
        if (typeof loc?.latitude === 'number' && typeof loc?.longitude === 'number') return new GeoPoint(loc.latitude, loc.longitude);
        if (Array.isArray(loc) && loc.length === 2) return new GeoPoint(Number(loc[0]), Number(loc[1]));
        return loc; // as-is
      })(),
      location: (() => {
        const loc = this.location;
        if (!loc) return null;
        if (loc instanceof GeoPoint) return loc;
        if (typeof loc?.lat === 'number' && typeof loc?.lng === 'number') return new GeoPoint(loc.lat, loc.lng);
        if (typeof loc?.latitude === 'number' && typeof loc?.longitude === 'number') return new GeoPoint(loc.latitude, loc.longitude);
        if (Array.isArray(loc) && loc.length === 2) return new GeoPoint(Number(loc[0]), Number(loc[1]));
        return loc;
      })()
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
    tipPercentage = 0,
    userData,
    seatInfo,
    stadiumId,
    shopId,
    customerLocation = null,
    location = null,
    deliveryUserId = null
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
      tipPercentage,
      isTipAdded: tipAmount > 0,
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
      deliveryUserId: deliveryUserId,
      status: OrderStatus.PENDING,
      createdAt,
      updatedAt: new Date(),
      deliveryTime: null, // Can be calculated later
      seatInfo: {
        row: seatInfo.row || '',
        seatNo: seatInfo.seatNo || '',
        section: seatInfo.section || '',
        seatDetails: seatInfo.seatDetails || '',
        area: seatInfo.area || '',
        entrance: seatInfo.entrance || '',
        stand: seatInfo.stand || '',
        ticketImage: seatInfo.ticketImage || ''
      },
      customerLocation,
      location: location
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

    let date;
    if (this.createdAt instanceof Date) {
      date = this.createdAt;
    } else if (this.createdAt && typeof this.createdAt.toDate === 'function') {
      // Firestore Timestamp
      date = this.createdAt.toDate();
    } else if (typeof this.createdAt === 'number' || typeof this.createdAt === 'string') {
      date = new Date(this.createdAt);
    }

    if (!date || isNaN(date.getTime())) return '';
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
