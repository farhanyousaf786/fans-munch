/**
 * Shop Model - Matches server-side Shop model with inside/outside delivery
 */

class Shop {
  constructor({
    name = '',
    location = '',
    floor = '',
    gate = '',
    description = '',
    admins = [],
    stadiumId = '',
    stadiumName = '',
    latitude = null,
    longitude = null,
    docId = null,
    id = null,
    imageUrl = null,
    deliveryFee = 0,
    deliveryFeeCurrency = 'ILS',
    insideDelivery = {},
    outsideDelivery = {},
    shopAvailability = true,
    stripeConnectedAccountId = null,
    createdAt = null,
    updatedAt = null
  }) {
    this.name = name;
    this.location = location;
    this.floor = floor;
    this.gate = gate;
    this.description = description;
    this.admins = admins || [];
    this.stadiumId = stadiumId;
    this.stadiumName = stadiumName;
    this.latitude = latitude;
    this.longitude = longitude;
    this.docId = docId || id;
    this.id = id || docId;
    this.imageUrl = imageUrl;
    
    // Legacy delivery fee (for backward compatibility)
    this.deliveryFee = parseFloat(deliveryFee) || 0;
    this.deliveryFeeCurrency = deliveryFeeCurrency || 'ILS';
    
    // Inside delivery options (for stadium/venue delivery)
    this.insideDelivery = {
      enabled: insideDelivery?.enabled || false,
      fee: parseFloat(insideDelivery?.fee) || 0,
      currency: insideDelivery?.currency || 'ILS',
      openTime: insideDelivery?.openTime || '09:00',
      closeTime: insideDelivery?.closeTime || '22:00',
      locations: insideDelivery?.locations || []
    };
    
    // Outside delivery options (for external delivery)
    this.outsideDelivery = {
      enabled: outsideDelivery?.enabled || false,
      fee: parseFloat(outsideDelivery?.fee) || 0,
      currency: outsideDelivery?.currency || 'ILS',
      openTime: outsideDelivery?.openTime || '09:00',
      closeTime: outsideDelivery?.closeTime || '22:00',
      locations: outsideDelivery?.locations || []
    };
    
    // Shop availability flag (open/closed)
    this.shopAvailability = typeof shopAvailability === 'boolean' ? shopAvailability : true;
    
    // Stripe connected account ID for payments
    this.stripeConnectedAccountId = stripeConnectedAccountId;
    
    // Timestamps
    this.createdAt = createdAt instanceof Date ? createdAt : (createdAt?.toDate?.() || new Date());
    this.updatedAt = updatedAt instanceof Date ? updatedAt : (updatedAt?.toDate?.() || new Date());
  }

  /**
   * Create Shop instance from Firestore data
   */
  static fromFirestore(data, id) {
    return new Shop({
      ...data,
      id: id,
      docId: id,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date()
    });
  }

  /**
   * Convert Shop to Firestore format
   */
  toFirestore() {
    return {
      name: this.name,
      location: this.location,
      floor: this.floor,
      gate: this.gate,
      description: this.description,
      admins: this.admins,
      stadiumId: this.stadiumId,
      stadiumName: this.stadiumName,
      latitude: this.latitude,
      longitude: this.longitude,
      imageUrl: this.imageUrl,
      deliveryFee: this.deliveryFee,
      deliveryFeeCurrency: this.deliveryFeeCurrency,
      insideDelivery: this.insideDelivery,
      outsideDelivery: this.outsideDelivery,
      shopAvailability: this.shopAvailability,
      stripeConnectedAccountId: this.stripeConnectedAccountId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Get the appropriate delivery fee based on delivery type
   * @param {string} deliveryType - 'inside' or 'outside'
   * @returns {object} { fee: number, currency: string }
   */
  getDeliveryFee(deliveryType = 'inside') {
    if (deliveryType === 'inside' && this.insideDelivery.enabled) {
      return {
        fee: this.insideDelivery.fee,
        currency: this.insideDelivery.currency
      };
    } else if (deliveryType === 'outside' && this.outsideDelivery.enabled) {
      return {
        fee: this.outsideDelivery.fee,
        currency: this.outsideDelivery.currency
      };
    } else {
      // Fallback to legacy delivery fee
      return {
        fee: this.deliveryFee,
        currency: this.deliveryFeeCurrency
      };
    }
  }

  /**
   * Check if shop is currently open based on delivery type
   * @param {string} deliveryType - 'inside' or 'outside'
   * @returns {boolean}
   */
  isOpen(deliveryType = 'inside') {
    if (!this.shopAvailability) return false;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let openTime, closeTime;
    
    if (deliveryType === 'inside' && this.insideDelivery.enabled) {
      openTime = this.insideDelivery.openTime;
      closeTime = this.insideDelivery.closeTime;
    } else if (deliveryType === 'outside' && this.outsideDelivery.enabled) {
      openTime = this.outsideDelivery.openTime;
      closeTime = this.outsideDelivery.closeTime;
    } else {
      // If no specific delivery type is enabled, assume open
      return true;
    }

    return currentTime >= openTime && currentTime <= closeTime;
  }

  /**
   * Check if delivery type is available
   * @param {string} deliveryType - 'inside' or 'outside'
   * @returns {boolean}
   */
  isDeliveryAvailable(deliveryType = 'inside') {
    if (deliveryType === 'inside') {
      return this.insideDelivery.enabled;
    } else if (deliveryType === 'outside') {
      return this.outsideDelivery.enabled;
    }
    return false;
  }
}

export default Shop;
