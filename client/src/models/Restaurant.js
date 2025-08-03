class Restaurant {
  constructor({
    id = null,
    name = '',
    location = '',
    description = '',
    image = null,
    createdAt = new Date(),
    rating = 0,
    reviewCount = 0,
    deliveryTime = '',
    deliveryFee = 0,
    minOrder = 0,
    cuisine = [],
    isOpen = true
  }) {
    this.id = id;
    this.name = name;
    this.location = location;
    this.description = description;
    this.image = image;
    this.createdAt = createdAt;
    this.rating = rating;
    this.reviewCount = reviewCount;
    this.deliveryTime = deliveryTime;
    this.deliveryFee = deliveryFee;
    this.minOrder = minOrder;
    this.cuisine = cuisine;
    this.isOpen = isOpen;
  }

  static fromMap(data, id = null) {
    return new Restaurant({
      id: id,
      name: data.name || '',
      location: data.location || '',
      description: data.description || '',
      image: data.image || null,
      createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
      rating: data.rating || 0,
      reviewCount: data.reviewCount || 0,
      deliveryTime: data.deliveryTime || '',
      deliveryFee: data.deliveryFee || 0,
      minOrder: data.minOrder || 0,
      cuisine: data.cuisine || [],
      isOpen: data.isOpen !== undefined ? data.isOpen : true
    });
  }

  toMap() {
    return {
      id: this.id,
      name: this.name,
      location: this.location,
      description: this.description,
      image: this.image,
      createdAt: this.createdAt,
      rating: this.rating,
      reviewCount: this.reviewCount,
      deliveryTime: this.deliveryTime,
      deliveryFee: this.deliveryFee,
      minOrder: this.minOrder,
      cuisine: this.cuisine,
      isOpen: this.isOpen
    };
  }

  // Helper methods
  get formattedDeliveryFee() {
    return this.deliveryFee === 0 ? 'Free' : `$${this.deliveryFee.toFixed(2)}`;
  }

  get formattedMinOrder() {
    return `$${this.minOrder}`;
  }

  get cuisineText() {
    return this.cuisine.join(', ');
  }
}

export default Restaurant;
