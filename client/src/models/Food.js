/**
 * Food Model
 * Based on stadium_food Flutter app structure
 */

class Food {
  constructor({
    id = '',
    allergens = [],
    category = '',
    createdAt = new Date(),
    customization = {},
    description = '',
    extras = [],
    images = [],
    isAvailable = true,
    name = '',
    nutritionalInfo = {},
    preparationTime = 15,
    price = 0,
    sauces = [],
    shopId = '',
    stadiumId = '',
    sizes = [],
    toppings = [],
    updatedAt = new Date(),
    foodType = { halal: false, kosher: false, vegan: false },
    quantity = 1
  }) {
    this.id = id;
    this.allergens = allergens;
    this.category = category;
    this.createdAt = createdAt;
    this.customization = customization;
    this.description = description;
    this.extras = extras;
    this.images = images;
    this.isAvailable = isAvailable;
    this.name = name;
    this.nutritionalInfo = nutritionalInfo;
    this.preparationTime = preparationTime;
    this.price = price;
    this.sauces = sauces;
    this.shopId = shopId;
    this.stadiumId = stadiumId;
    this.sizes = sizes;
    this.toppings = toppings;
    this.updatedAt = updatedAt;
    this.foodType = foodType;
    this.quantity = quantity;
  }

  /**
   * Create Food from Firebase/API data
   * @param {string} id - Document ID
   * @param {Object} data - Raw food data
   * @returns {Food}
   */
  static fromMap(id, data) {
    return new Food({
      id: id,
      allergens: data.allergens || [],
      category: data.category || '',
      createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
      customization: data.customization || {},
      description: data.description || '',
      extras: data.extras || [],
      images: data.images || [],
      isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
      name: data.name || '',
      nutritionalInfo: data.nutritionalInfo || {},
      preparationTime: data.preparationTime || 15,
      price: data.price || 0,
      sauces: data.sauces || [],
      shopId: data.shopId || '',
      stadiumId: data.stadiumId || '',
      sizes: data.sizes || [],
      toppings: data.toppings || [],
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
      foodType: data.foodType || { halal: false, kosher: false, vegan: false },
      quantity: data.quantity || 1
    });
  }

  /**
   * Convert Food to plain object for storage/API
   * @returns {Object}
   */
  toMap() {
    return {
      id: this.id,
      allergens: this.allergens,
      category: this.category,
      createdAt: this.createdAt,
      customization: this.customization,
      description: this.description,
      extras: this.extras,
      images: this.images,
      isAvailable: this.isAvailable,
      name: this.name,
      nutritionalInfo: this.nutritionalInfo,
      preparationTime: this.preparationTime,
      price: this.price,
      sauces: this.sauces,
      shopId: this.shopId,
      stadiumId: this.stadiumId,
      sizes: this.sizes,
      toppings: this.toppings,
      updatedAt: this.updatedAt,
      foodType: this.foodType,
      quantity: this.quantity
    };
  }

  /**
   * Get formatted price string
   * @returns {string}
   */
  getFormattedPrice() {
    return `$${this.price.toFixed(2)}`;
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
    return `$${this.getTotalPrice().toFixed(2)}`;
  }
}

export default Food;
