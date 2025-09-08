/**
 * Food Model
 * Aligned with MenuItem pattern (i18n, shopIds, currency, Timestamp handling)
 */
import { Timestamp } from 'firebase/firestore';

class Food {
  constructor({
    // Identifiers
    id = '', // existing id usage in app
    docId = null, // new pattern field

    // Display and i18n
    name = '',
    nameMap = {},
    description = '',
    descriptionMap = {},

    // Pricing and currency
    price = 0,
    currency = 'USD',

    // Classification
    category = '', // categoryId string
    images = [],
    isAvailable = true,
    preparationTime = 15,

    // Ownership/placement
    shopIds = [],
    shopId = '', // backward compatibility
    stadiumId = '',

    // Customization
    customization = {
      toppings: [],
      extras: [],
      sauces: [],
      sizes: []
    },
    // Legacy separate arrays (still supported)
    toppings = [],
    extras = [],
    sauces = [],
    sizes = [],

    // Nutrition and compliance
    allergens = [],
    nutritionalInfo = {},
    foodType = { halal: false, kosher: false, vegan: false },

    // Timestamps
    createdAt = new Date(),
    updatedAt = new Date(),

    // Cart/runtime (not stored on item doc normally)
    quantity = 1,
  }) {
    // IDs
    this.id = id || docId || '';
    this.docId = docId || id || null;

    // Display/i18n
    this.name = name;
    this.nameMap = nameMap || {};
    this.description = description;
    this.descriptionMap = descriptionMap || {};

    // Pricing
    this.price = price;
    this.currency = currency;

    // Classification
    this.category = category;
    this.images = images;
    this.isAvailable = isAvailable;
    this.preparationTime = preparationTime;

    // Ownership/placement
    const normalizedShopIds = Array.isArray(shopIds)
      ? shopIds
      : [shopIds].filter(Boolean);
    // include legacy single shopId if provided
    if (shopId && !normalizedShopIds.includes(shopId)) normalizedShopIds.push(shopId);
    this.shopIds = normalizedShopIds;
    this.shopId = shopId || normalizedShopIds[0] || '';
    this.stadiumId = stadiumId;

    // Customization
    this.customization = {
      toppings: customization?.toppings ?? toppings ?? [],
      extras: customization?.extras ?? extras ?? [],
      sauces: customization?.sauces ?? sauces ?? [],
      sizes: customization?.sizes ?? sizes ?? [],
    };

    // Nutrition/compliance
    this.allergens = allergens;
    this.nutritionalInfo = nutritionalInfo;
    this.foodType = foodType;

    // Timestamps
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    // Cart/runtime
    this.quantity = quantity;
  }

  /**
   * Create Food from Firebase/API data
   * @param {string} id - Document ID
   * @param {Object} data - Raw food data
   * @returns {Food}
   */
  static fromMap(id, data) {
    // Backward-compatible constructor from legacy map + id
    return new Food({
      id: id,
      docId: data.docId || id,
      // i18n
      name: data.name || data?.nameMap?.en || '',
      nameMap: data.nameMap || {},
      description: data.description || data?.descriptionMap?.en || '',
      descriptionMap: data.descriptionMap || {},
      // pricing
      price: data.price ?? 0,
      currency: data.currency || 'USD',
      // classification
      category: data.category || '',
      images: data.images || [],
      isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
      preparationTime: data.preparationTime || 15,
      // ownership/placement
      shopIds: data.shopIds || (data.shopId ? [data.shopId] : []),
      shopId: data.shopId || '',
      stadiumId: data.stadiumId || '',
      // customization
      customization: data.customization || {
        toppings: data.toppings || [],
        extras: data.extras || [],
        sauces: data.sauces || [],
        sizes: data.sizes || [],
      },
      // nutrition/compliance
      allergens: data.allergens || [],
      nutritionalInfo: data.nutritionalInfo || {},
      foodType: data.foodType || { halal: false, kosher: false, vegan: false },
      // timestamps
      createdAt: Food.parseFirestoreDate(data.createdAt),
      updatedAt: Food.parseFirestoreDate(data.updatedAt),
      // cart/runtime
      quantity: data.quantity || 1,
    });
  }

  /**
   * New-style creator aligned with MenuItem pattern (no separate id param)
   */
  static fromFirestore(data) {
    return new Food({
      id: data.id || data.docId || '',
      docId: data.docId || data.id || null,
      // i18n
      name: data.name || data?.nameMap?.en || '',
      nameMap: data.nameMap || {},
      description: data.description || data?.descriptionMap?.en || '',
      descriptionMap: data.descriptionMap || {},
      // pricing
      price: data.price ?? 0,
      currency: data.currency || 'USD',
      // classification
      category: data.category || '',
      images: data.images || [],
      isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
      preparationTime: data.preparationTime || 15,
      // ownership/placement
      shopIds: data.shopIds || (data.shopId ? [data.shopId] : []),
      shopId: data.shopId || '',
      stadiumId: data.stadiumId || '',
      // customization
      customization: data.customization || {
        toppings: data.toppings || [],
        extras: data.extras || [],
        sauces: data.sauces || [],
        sizes: data.sizes || [],
      },
      // nutrition/compliance
      allergens: data.allergens || [],
      nutritionalInfo: data.nutritionalInfo || {},
      foodType: data.foodType || { halal: false, kosher: false, vegan: false },
      // timestamps
      createdAt: Food.parseFirestoreDate(data.createdAt),
      updatedAt: Food.parseFirestoreDate(data.updatedAt),
    });
  }

  /**
   * Convert Food to plain object for storage/API
   * @returns {Object}
   */
  toMap() {
    // Backward compatible map (keeps legacy fields) – used by app code
    return {
      id: this.id,
      docId: this.docId,
      // i18n
      name: this.name,
      nameMap: this.nameMap,
      description: this.description,
      descriptionMap: this.descriptionMap,
      // pricing
      price: this.price,
      currency: this.currency,
      // classification
      category: this.category,
      images: this.images,
      isAvailable: this.isAvailable,
      preparationTime: this.preparationTime,
      // ownership/placement
      shopIds: this.shopIds,
      shopId: this.shopId,
      stadiumId: this.stadiumId,
      // customization (also expose legacy fields for compatibility)
      customization: this.customization,
      toppings: this.customization?.toppings || [],
      extras: this.customization?.extras || [],
      sauces: this.customization?.sauces || [],
      sizes: this.customization?.sizes || [],
      // nutrition/compliance
      allergens: this.allergens,
      nutritionalInfo: this.nutritionalInfo,
      foodType: this.foodType,
      // timestamps (as Date objects)
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // runtime/cart
      quantity: this.quantity,
    };
  }

  // Firestore write-friendly map (uses Timestamp)
  toFirestore() {
    return {
      name: this.name,
      nameMap: this.nameMap,
      description: this.description,
      descriptionMap: this.descriptionMap,
      price: this.price,
      category: this.category,
      images: this.images,
      isAvailable: this.isAvailable,
      preparationTime: this.preparationTime,
      shopIds: this.shopIds,
      stadiumId: this.stadiumId,
      customization: this.customization,
      allergens: this.allergens,
      nutritionalInfo: this.nutritionalInfo,
      foodType: this.foodType,
      currency: this.currency,
      docId: this.docId,
      createdAt: this.createdAt instanceof Date ? Timestamp.fromDate(this.createdAt) : this.createdAt,
      updatedAt: this.updatedAt instanceof Date ? Timestamp.fromDate(this.updatedAt) : this.updatedAt,
    };
  }

  /**
   * Get formatted price string
   * @returns {string}
   */
  getFormattedPrice() {
    const curr = (this.currency || 'USD').toUpperCase();
    const symbol = curr === 'ILS' ? '₪' : curr === 'EUR' ? '€' : '$';
    return `${symbol}${this.price.toFixed(2)}`;
  }

  /**
   * Get primary image URL
   * @returns {string}
   */
  getPrimaryImage() {
    return this.images.length > 0 ? this.images[0] : '/api/placeholder/200/150';
  }

  /**
   * Get preparation time string
   * @returns {string}
   */
  getPreparationTimeText() {
    return `${this.preparationTime} min`;
  }

  /**
   * Check if food has allergens
   * @returns {boolean}
   */
  hasAllergens() {
    return this.allergens.length > 0;
  }

  /**
   * Get allergens text
   * @returns {string}
   */
  getAllergensText() {
    return this.allergens.join(', ');
  }

  /**
   * Check if food is vegetarian/vegan/etc
   * @param {string} type - 'halal', 'kosher', 'vegan'
   * @returns {boolean}
   */
  isFoodType(type) {
    return this.foodType[type] || false;
  }

  /**
   * Get food type badges
   * @returns {string[]}
   */
  getFoodTypeBadges() {
    const badges = [];
    if (this.foodType.halal) badges.push('Halal');
    if (this.foodType.kosher) badges.push('Kosher');
    if (this.foodType.vegan) badges.push('Vegan');
    return badges;
  }

  /**
   * Check if food is available
   * @returns {boolean}
   */
  get available() {
    return this.isAvailable;
  }

  /**
   * Update quantity for cart
   * @param {number} newQuantity
   * @returns {Food}
   */
  updateQuantity(newQuantity) {
    return new Food({
      ...this.toMap(),
      quantity: Math.max(0, newQuantity)
    });
  }

  /**
   * Get total price for quantity
   * @returns {number}
   */
  getTotalPrice() {
    return this.price * this.quantity;
  }

  /**
   * Get formatted total price
   * @returns {string}
   */
  getFormattedTotalPrice() {
    const curr = (this.currency || 'USD').toUpperCase();
    const symbol = curr === 'ILS' ? '₪' : curr === 'EUR' ? '€' : '$';
    return `${symbol}${this.getTotalPrice().toFixed(2)}`;
  }

  // Helpers
  static parseFirestoreDate(dateValue) {
    if (!dateValue) return new Date();
    // Firestore Timestamp
    if (typeof dateValue?.toDate === 'function') {
      return dateValue.toDate();
    }
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === 'string') return new Date(dateValue);
    if (typeof dateValue === 'number') return new Date(dateValue);
    return new Date();
  }
}

export default Food;
