/**
 * Storage utility for managing browser localStorage
 * Centralized storage functions and keys for Food Munch app
 */

// Storage Keys
export const STORAGE_KEYS = {
  // Authentication
  USER_TOKEN: 'food_munch_user_token',
  USER_DATA: 'food_munch_user_data',
  
  // Onboarding
  HAS_SEEN_ONBOARDING: 'food_munch_has_seen_onboarding',
  
  // Stadium Selection
  SELECTED_STADIUM: 'food_munch_selected_stadium',
  STADIUM_PREFERENCES: 'food_munch_stadium_preferences',
  
  // App Settings
  THEME_PREFERENCE: 'food_munch_theme',
  LANGUAGE_PREFERENCE: 'food_munch_language',
  
  // Cart & Orders
  CART_DATA: 'food_munch_cart',
  ORDER_HISTORY: 'food_munch_order_history',
  
  // Favorites
  FAVORITE_FOODS: 'food_munch_favorite_foods',
  FAVORITE_RESTAURANTS: 'food_munch_favorite_restaurants',
  
  // Notifications
  NOTIFICATION_PREFERENCES: 'food_munch_notifications',
  PUSH_TOKEN: 'food_munch_push_token'
};

/**
 * Generic storage functions
 */
export const storage = {
  /**
   * Set item in localStorage
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   */
  setItem: (key, value) => {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  },

  /**
   * Get item from localStorage
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if key doesn't exist
   * @returns {any} Parsed value or default value
   */
  getItem: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },

  /**
   * Remove item from localStorage
   * @param {string} key - Storage key
   */
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  },

  /**
   * Clear all localStorage data
   */
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  },

  /**
   * Check if key exists in localStorage
   * @param {string} key - Storage key
   * @returns {boolean}
   */
  hasItem: (key) => {
    return localStorage.getItem(key) !== null;
  }
};

/**
 * Specific storage functions for different app features
 */

// User Authentication
export const userStorage = {
  setUserToken: (token) => storage.setItem(STORAGE_KEYS.USER_TOKEN, token),
  getUserToken: () => storage.getItem(STORAGE_KEYS.USER_TOKEN),
  removeUserToken: () => storage.removeItem(STORAGE_KEYS.USER_TOKEN),
  
  setUserData: (userData) => storage.setItem(STORAGE_KEYS.USER_DATA, userData),
  getUserData: () => storage.getItem(STORAGE_KEYS.USER_DATA),
  removeUserData: () => storage.removeItem(STORAGE_KEYS.USER_DATA),
  
  isLoggedIn: () => storage.hasItem(STORAGE_KEYS.USER_TOKEN)
};

// Onboarding
export const onboardingStorage = {
  setHasSeenOnboarding: (seen = true) => storage.setItem(STORAGE_KEYS.HAS_SEEN_ONBOARDING, seen),
  getHasSeenOnboarding: () => storage.getItem(STORAGE_KEYS.HAS_SEEN_ONBOARDING, false),
  resetOnboarding: () => storage.removeItem(STORAGE_KEYS.HAS_SEEN_ONBOARDING)
};

// Stadium Selection
export const stadiumStorage = {
  setSelectedStadium: (stadium) => storage.setItem(STORAGE_KEYS.SELECTED_STADIUM, stadium),
  getSelectedStadium: () => storage.getItem(STORAGE_KEYS.SELECTED_STADIUM),
  removeSelectedStadium: () => storage.removeItem(STORAGE_KEYS.SELECTED_STADIUM),
  hasSelectedStadium: () => storage.hasItem(STORAGE_KEYS.SELECTED_STADIUM),
  
  setStadiumPreferences: (preferences) => storage.setItem(STORAGE_KEYS.STADIUM_PREFERENCES, preferences),
  getStadiumPreferences: () => storage.getItem(STORAGE_KEYS.STADIUM_PREFERENCES, {})
};

// Cart Management
export const cartStorage = {
  setCart: (cartData) => storage.setItem(STORAGE_KEYS.CART_DATA, cartData),
  getCart: () => storage.getItem(STORAGE_KEYS.CART_DATA, { items: [], total: 0 }),
  clearCart: () => storage.removeItem(STORAGE_KEYS.CART_DATA),
  
  addToCart: (item) => {
    const currentCart = cartStorage.getCart();
    const existingItemIndex = currentCart.items.findIndex(cartItem => cartItem.id === item.id);
    
    if (existingItemIndex >= 0) {
      currentCart.items[existingItemIndex].quantity += item.quantity || 1;
    } else {
      currentCart.items.push({ ...item, quantity: item.quantity || 1 });
    }
    
    // Recalculate total
    currentCart.total = currentCart.items.reduce((sum, cartItem) => 
      sum + (cartItem.price * cartItem.quantity), 0
    );
    
    cartStorage.setCart(currentCart);
    return currentCart;
  },
  
  removeFromCart: (itemId) => {
    const currentCart = cartStorage.getCart();
    currentCart.items = currentCart.items.filter(item => item.id !== itemId);
    
    // Recalculate total
    currentCart.total = currentCart.items.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );
    
    cartStorage.setCart(currentCart);
    return currentCart;
  }
};

// ============================================================================
// STORAGE MANAGEMENT UTILITY
// ============================================================================

/**
 * Utility to clear all app storage data
 * Used during login/logout to ensure clean state
 */
export const storageManager = {
  /**
   * Clear all localStorage data for the app
   * This includes user data, cart, stadium selection, onboarding status, etc.
   */
  clearAllStorage: () => {
    try {
      console.log('🧹 Clearing all localStorage data...');
      
      // Clear all localStorage
      localStorage.clear();
      
      // Dispatch cart updated event to update UI with proper detail
      window.dispatchEvent(new CustomEvent('cartUpdated', {
        detail: {
          cartItems: [],
          totalItems: 0,
          totalPrice: 0
        }
      }));
      
      console.log('✅ All localStorage data cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing localStorage:', error);
    }
  },

  /**
   * Clear only user-specific data (keep app settings like theme, etc.)
   * Alternative to clearAllStorage if you want to preserve some data
   */
  clearUserData: () => {
    try {
      console.log('🧹 Clearing user-specific data...');
      
      // Remove specific user-related keys
      const userKeys = [
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.SELECTED_STADIUM,
        STORAGE_KEYS.ONBOARDING_COMPLETED,
        STORAGE_KEYS.CART
      ];
      
      userKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Dispatch cart updated event to update UI with proper detail
      window.dispatchEvent(new CustomEvent('cartUpdated', {
        detail: {
          cartItems: [],
          totalItems: 0,
          totalPrice: 0
        }
      }));
      
      console.log('✅ User-specific data cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing user data:', error);
    }
  },

  /**
   * Initialize fresh storage state for a new user session
   */
  initializeFreshSession: () => {
    try {
      console.log('🔄 Initializing fresh user session...');
      
      // Clear all existing data
      storageManager.clearAllStorage();
      
      // Initialize empty cart
      cartStorage.setCart({ items: [], total: 0, shopId: null });
      
      console.log('✅ Fresh session initialized');
    } catch (error) {
      console.error('❌ Error initializing fresh session:', error);
    }
  }
};

// Favorites
export const favoritesStorage = {
  setFavoriteFoods: (foods) => storage.setItem(STORAGE_KEYS.FAVORITE_FOODS, foods),
  getFavoriteFoods: () => storage.getItem(STORAGE_KEYS.FAVORITE_FOODS, []),
  addFavoriteFood: (food) => {
    const favorites = favoritesStorage.getFavoriteFoods();
    if (!favorites.find(f => f.id === food.id)) {
      favorites.push(food);
      favoritesStorage.setFavoriteFoods(favorites);
    }
    return favorites;
  },
  removeFavoriteFood: (foodId) => {
    const favorites = favoritesStorage.getFavoriteFoods();
    const updated = favorites.filter(f => f.id !== foodId);
    favoritesStorage.setFavoriteFoods(updated);
    return updated;
  },
  
  setFavoriteRestaurants: (restaurants) => storage.setItem(STORAGE_KEYS.FAVORITE_RESTAURANTS, restaurants),
  getFavoriteRestaurants: () => storage.getItem(STORAGE_KEYS.FAVORITE_RESTAURANTS, [])
};

// App Settings
export const settingsStorage = {
  setThemePreference: (theme) => storage.setItem(STORAGE_KEYS.THEME_PREFERENCE, theme),
  getThemePreference: () => storage.getItem(STORAGE_KEYS.THEME_PREFERENCE, 'light'),
  
  setLanguagePreference: (language) => storage.setItem(STORAGE_KEYS.LANGUAGE_PREFERENCE, language),
  getLanguagePreference: () => storage.getItem(STORAGE_KEYS.LANGUAGE_PREFERENCE, 'en'),
  
  setNotificationPreferences: (preferences) => storage.setItem(STORAGE_KEYS.NOTIFICATION_PREFERENCES, preferences),
  getNotificationPreferences: () => storage.getItem(STORAGE_KEYS.NOTIFICATION_PREFERENCES, {
    push: true,
    email: true,
    orderUpdates: true,
    promotions: false
  })
};

// Order History
export const orderStorage = {
  setOrderHistory: (orders) => storage.setItem(STORAGE_KEYS.ORDER_HISTORY, orders),
  getOrderHistory: () => storage.getItem(STORAGE_KEYS.ORDER_HISTORY, []),
  addOrder: (order) => {
    const history = orderStorage.getOrderHistory();
    history.unshift({ ...order, timestamp: new Date().toISOString() });
    orderStorage.setOrderHistory(history);
    return history;
  }
};

export default {
  STORAGE_KEYS,
  storage,
  userStorage,
  onboardingStorage,
  stadiumStorage,
  cartStorage,
  favoritesStorage,
  settingsStorage,
  orderStorage
};
