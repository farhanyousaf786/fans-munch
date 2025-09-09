// Cart Management Utility - Matching Flutter app cart logic
import { userStorage } from './storage';

const CART_STORAGE_KEY = 'food_munch_cart';

export const cartUtils = {
  // Get all cart items (matches Flutter OrderRepository.cart)
  getCartItems: () => {
    try {
      const cartData = localStorage.getItem(CART_STORAGE_KEY);
      
      if (!cartData) {
        console.log('📦 No cart data found, returning empty array');
        return [];
      }
      
      const parsedData = JSON.parse(cartData);
      
      // Handle both formats: array (old) or object with items array (new)
      let cart;
      if (Array.isArray(parsedData)) {
        // Old format: direct array
        cart = parsedData;
      } else if (parsedData && Array.isArray(parsedData.items)) {
        // New format: object with items array
        cart = parsedData.items;
      } else {
        // Invalid format, return empty array
        console.warn('⚠️ Invalid cart data format, returning empty array');
        cart = [];
      }
      
      console.log('📦 Retrieved cart from storage:', cart.length, 'items');
      return cart;
    } catch (error) {
      console.error('❌ Error getting cart items:', error);
      return [];
    }
  },

  // Alias for getCartItems (for compatibility)
  getCart: () => {
    return cartUtils.getCartItems();
  },

  // Add item to cart (matching Flutter AddToCart logic exactly)
  addToCart: (food, quantity = 1) => {
    try {
      console.log('🛒 Adding to cart:', food.name, 'Quantity:', quantity);
      
      // Validate input
      if (!food || !food.id || !food.name) {
        console.error('❌ Invalid food object:', food);
        return {
          success: false,
          message: 'Invalid food item'
        };
      }
      
      let existingCart = cartUtils.getCartItems();
      
      // Ensure existingCart is always an array
      if (!Array.isArray(existingCart)) {
        console.warn('⚠️ Cart is not an array, initializing empty cart');
        existingCart = [];
      }
      
      // Previously: enforced single-shop cart by clearing when shops differed.
      // Now: allow multiple shops in one cart (do NOT clear existing items).
      // This matches the requested UX where users can add different items together.
      
      const existingItemIndex = existingCart.findIndex(item => item.id === food.id);
      
      if (existingItemIndex >= 0) {
        // Item already exists, increase quantity (matches Flutter logic)
        existingCart[existingItemIndex].quantity += quantity;
        console.log('📈 Updated existing item quantity:', existingCart[existingItemIndex].quantity);
      } else {
        // Add new item to cart (matches Flutter logic)
        // Calculate the actual price to use (discounted if it's an offer)
        const hasDiscount = food.discountPercentage && food.discountPercentage > 0;
        const actualPrice = hasDiscount ? food.price * (1 - food.discountPercentage / 100) : food.price;
        
        const cartItem = {
          id: food.id,
          name: food.name,
          nameMap: food.nameMap || {},
          price: actualPrice, // Use discounted price if available
          originalPrice: food.price, // Keep original price for reference
          discountPercentage: food.discountPercentage || 0, // Store discount info
          images: food.images || [],
          quantity: quantity,
          shopId: food.shopId || (Array.isArray(food.shopIds) && food.shopIds.length > 0 ? food.shopIds[0] : ''),
          shopIds: Array.isArray(food.shopIds) ? [...food.shopIds] : (food.shopId ? [food.shopId] : []),
          stadiumId: food.stadiumId,
          preparationTime: food.preparationTime || 15,
          description: food.description || '',
          descriptionMap: food.descriptionMap || {},
          allergens: food.allergens || [],
          category: food.category || '', // category ID
          currency: food.currency || 'ILS',
          addedAt: new Date().toISOString()
        };
        
        existingCart.push(cartItem);
        console.log('✅ Added new item to cart:', cartItem.name);
      }
      
      // Save updated cart (matches Flutter updateHive())
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(existingCart));
      console.log('💾 Cart saved to storage. Total items:', existingCart.length);
      
      // Trigger cart update event for UI updates
      window.dispatchEvent(new CustomEvent('cartUpdated', { 
        detail: { 
          cartItems: existingCart,
          totalItems: cartUtils.getTotalItems(),
          totalPrice: cartUtils.getTotalPrice()
        } 
      }));
      
      return {
        success: true,
        cartItems: existingCart,
        totalItems: cartUtils.getTotalItems(),
        message: `${food.name} added to cart!`
      };
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      return {
        success: false,
        message: 'Failed to add item to cart'
      };
    }
  },

  // Remove item from cart (matches Flutter removeCompletelyFromCart)
  removeFromCart: (foodId) => {
    try {
      const existingCart = cartUtils.getCartItems();
      const itemToRemove = existingCart.find(item => item.id === foodId);
      
      if (itemToRemove) {
        console.log('🗑️ Removing item from cart:', itemToRemove.name);
        const updatedCart = existingCart.filter(item => item.id !== foodId);
        
        // Save updated cart (matches Flutter updateHive())
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
        console.log('💾 Cart updated. Remaining items:', updatedCart.length);
        
        // Trigger cart update event
        window.dispatchEvent(new CustomEvent('cartUpdated', { 
          detail: { 
            cartItems: updatedCart,
            totalItems: cartUtils.getTotalItems(),
            totalPrice: cartUtils.getTotalPrice()
          } 
        }));
        
        return updatedCart;
      } else {
        console.log('⚠️ Item not found in cart:', foodId);
        return existingCart;
      }
    } catch (error) {
      console.error('❌ Error removing from cart:', error);
      return cartUtils.getCartItems();
    }
  },

  // Update item quantity
  updateQuantity: (foodId, newQuantity) => {
    try {
      const existingCart = cartUtils.getCartItems();
      const itemIndex = existingCart.findIndex(item => item.id === foodId);
      
      if (itemIndex >= 0) {
        if (newQuantity <= 0) {
          // Remove item if quantity is 0 or negative
          return cartUtils.removeFromCart(foodId);
        } else {
          existingCart[itemIndex].quantity = newQuantity;
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(existingCart));
          
          // Trigger cart update event
          window.dispatchEvent(new CustomEvent('cartUpdated', { 
            detail: { 
              cartItems: existingCart,
              totalItems: cartUtils.getTotalItems(),
              totalPrice: cartUtils.getTotalPrice()
            } 
          }));
          
          console.log('📊 Updated quantity for:', foodId, 'New quantity:', newQuantity);
        }
      }
      
      return existingCart;
    } catch (error) {
      console.error('❌ Error updating quantity:', error);
      return cartUtils.getCartItems();
    }
  },

  // Get total number of items in cart
  getTotalItems: () => {
    try {
      const cartItems = cartUtils.getCartItems();
      return cartItems.reduce((total, item) => total + item.quantity, 0);
    } catch (error) {
      console.error('❌ Error getting total items:', error);
      return 0;
    }
  },

  // Get total price of cart
  getTotalPrice: () => {
    try {
      const cartItems = cartUtils.getCartItems();
      return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    } catch (error) {
      console.error('❌ Error getting total price:', error);
      return 0;
    }
  },

  // Clear entire cart
  clearCart: () => {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
      
      // Trigger cart update event
      window.dispatchEvent(new CustomEvent('cartUpdated', { 
        detail: { 
          cartItems: [],
          totalItems: 0,
          totalPrice: 0
        } 
      }));
      
      console.log('🧹 Cart cleared');
      return [];
    } catch (error) {
      console.error('❌ Error clearing cart:', error);
      return [];
    }
  },

  // Check if item is in cart
  isInCart: (foodId) => {
    try {
      const cartItems = cartUtils.getCartItems();
      return cartItems.some(item => item.id === foodId);
    } catch (error) {
      console.error('❌ Error checking if item in cart:', error);
      return false;
    }
  },

  // Get item quantity in cart
  getItemQuantity: (foodId) => {
    try {
      const cartItems = cartUtils.getCartItems();
      const item = cartItems.find(item => item.id === foodId);
      return item ? item.quantity : 0;
    } catch (error) {
      console.error('❌ Error getting item quantity:', error);
      return 0;
    }
  }
};
