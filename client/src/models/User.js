/**
 * User Model
 * Based on stadium_food Flutter app structure
 */

export class User {
  constructor({
    id = '',
    email = '',
    phone = '',
    firstName = '',
    lastName = '',
    image = null,
    fcmToken = '',
    favoriteFoods = [],
    favoriteRestaurants = [],
    createdAt = new Date(),
    updatedAt = new Date(),
    isActive = true,
    type = 'customer'
  } = {}) {
    this.id = id;
    this.email = email;
    this.phone = phone;
    this.firstName = firstName;
    this.lastName = lastName;
    this.image = image;
    this.fcmToken = fcmToken;
    this.favoriteFoods = favoriteFoods;
    this.favoriteRestaurants = favoriteRestaurants;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.isActive = isActive;
    this.type = type;
  }

  /**
   * Create User from Firestore document (matching stadium_food structure)
   * @param {string} id - User ID
   * @param {Object} data - User data
   * @returns {User}
   */
  static fromMap(id, data) {
    const normalizeTimestamp = (value) => {
      // Firestore Timestamp (has toDate())
      if (value && typeof value.toDate === 'function') return value.toDate();
      // JS Date
      if (value instanceof Date) return value;
      // Number (epoch ms or seconds)
      if (typeof value === 'number') {
        // Heuristic: treat 13+ digits as ms
        return new Date(value < 1e12 ? value * 1000 : value);
      }
      // String (ISO or parseable date)
      if (typeof value === 'string') {
        const d = new Date(value);
        if (!isNaN(d.getTime())) return d;
      }
      // Fallback: now
      return new Date();
    };

    return new User({
      id,
      email: data.email || '',
      phone: data.phone || '',
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      image: data.image || null,
      fcmToken: data.fcmToken || '',
      favoriteFoods: data.favoriteFoods || [],
      favoriteRestaurants: data.favoriteRestaurants || [],
      createdAt: normalizeTimestamp(data.createdAt),
      updatedAt: normalizeTimestamp(data.updatedAt),
      isActive: data.isActive !== undefined ? data.isActive : true,
      type: data.type || 'customer'
    });
  }

  /**
   * Convert User to Firestore document (matching stadium_food structure)
   * @returns {Object}
   */
  toMap() {
    return {
      id: this.id,
      email: this.email,
      phone: this.phone,
      firstName: this.firstName,
      lastName: this.lastName,
      image: this.image,
      fcmToken: this.fcmToken,
      favoriteFoods: this.favoriteFoods,
      favoriteRestaurants: this.favoriteRestaurants,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      isActive: this.isActive,
      type: this.type
    };
  }

  /**
   * Get full name
   * @returns {string}
   */
  getFullName() {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  /**
   * Get display name (first name only)
   * @returns {string}
   */
  getDisplayName() {
    return this.firstName || 'User';
  }

  /**
   * Add food to favorites
   * @param {string} foodId 
   */
  addToFavoriteFoods(foodId) {
    if (!this.favoriteFoods.includes(foodId)) {
      this.favoriteFoods.push(foodId);
      this.updatedAt = new Date();
    }
  }

  /**
   * Remove food from favorites
   * @param {string} foodId 
   */
  removeFromFavoriteFoods(foodId) {
    this.favoriteFoods = this.favoriteFoods.filter(id => id !== foodId);
    this.updatedAt = new Date();
  }

  /**
   * Add restaurant to favorites
   * @param {string} restaurantId 
   * @returns {User}
   */
  addFavoriteRestaurant(restaurantId) {
    if (!this.favoriteRestaurants.includes(restaurantId)) {
      return new User({
        ...this.toMap(),
        favoriteRestaurants: [...this.favoriteRestaurants, restaurantId]
      });
    }
    return this;
  }

  /**
   * Remove restaurant from favorites
   * @param {string} restaurantId 
   * @returns {User}
   */
  removeFavoriteRestaurant(restaurantId) {
    return new User({
      ...this.toMap(),
      favoriteRestaurants: this.favoriteRestaurants.filter(id => id !== restaurantId)
    });
  }

  /**
   * Update user profile
   * @param {Object} updates 
   * @returns {User}
   */
  updateProfile(updates) {
    return new User({
      ...this.toMap(),
      ...updates
    });
  }
}

export default User;
