class Offer {
  constructor({
    id,
    allergens = [],
    category = '',
    createdAt,
    customization = {},
    description = '',
    extras = [],
    images = [],
    isAvailable = true,
    active = true,
    name = '',
    nutritionalInfo = {},
    preparationTime = 15,
    price = 0,
    discountPercentage = 0,
    sauces = [],
    shopId = '',
    stadiumId = '',
    sizes = [],
    toppings = [],
    updatedAt,
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
    this.active = active;
    this.name = name;
    this.nutritionalInfo = nutritionalInfo;
    this.preparationTime = preparationTime;
    this.price = price;
    this.discountPercentage = discountPercentage;
    this.sauces = sauces;
    this.shopId = shopId;
    this.stadiumId = stadiumId;
    this.sizes = sizes;
    this.toppings = toppings;
    this.updatedAt = updatedAt;
    this.foodType = foodType;
    this.quantity = quantity;
  }

  // Create Offer from Firebase document data (matching Flutter app)
  static fromMap(id, data) {
    return new Offer({
      id,
      allergens: data.allergens || [],
      category: data.category || '',
      createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
      customization: data.customization || {},
      description: data.description || '',
      extras: data.extras || [],
      images: data.images || [],
      isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
      active: data.active !== undefined ? data.active : true,
      name: data.name || '',
      nutritionalInfo: data.nutritionalInfo || {},
      preparationTime: data.preparationTime || 15,
      price: parseFloat(data.price) || 0,
      discountPercentage: parseFloat(data.discountPercentage) || 0,
      sauces: data.sauces || [],
      shopId: data.shopId || '',
      stadiumId: data.stadiumId || '',
      sizes: data.sizes || [],
      toppings: data.toppings || [],
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || new Date(),
      foodType: data.foodType || { halal: false, kosher: false, vegan: false },
      quantity: data.quantity || 1
    });
  }

  // Convert to map for Firebase (matching Flutter app)
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
      active: this.active,
      name: this.name,
      nutritionalInfo: this.nutritionalInfo,
      preparationTime: this.preparationTime,
      price: this.price,
      discountPercentage: this.discountPercentage,
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

  // Get formatted price (matching Flutter app)
  getFormattedPrice() {
    return `₪${this.price.toFixed(2)}`;
  }

  // Get discounted price (matching Flutter app)
  getDiscountedPrice() {
    return this.price * (1 - this.discountPercentage / 100);
  }

  // Get formatted discounted price
  getFormattedDiscountedPrice() {
    return `₪${this.getDiscountedPrice().toFixed(2)}`;
  }

  // Get primary image
  getPrimaryImage() {
    return this.images && this.images.length > 0 
      ? this.images[0] 
      : '/api/placeholder/200/150';
  }

  // Check if offer has valid discount (matching Flutter app logic)
  hasValidDiscount() {
    return this.discountPercentage > 0 && this.active && this.isAvailable;
  }

  // Get food type badges
  getFoodTypeBadges() {
    const badges = [];
    if (this.foodType.halal) badges.push('Halal');
    if (this.foodType.kosher) badges.push('Kosher');
    if (this.foodType.vegan) badges.push('Vegan');
    return badges;
  }

  // Get discount badge text
  getDiscountBadgeText() {
    return `${Math.round(this.discountPercentage)}% OFF`;
  }
}

export default Offer;
