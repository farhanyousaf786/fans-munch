// Cart Management Utility - Matching Flutter app cart logic
import { userStorage } from './storage';
import { stadiumStorage } from './storage';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

const CART_STORAGE_KEY = 'food_munch_cart';

export const cartUtils = {
  // Check if a shop is available
  isShopAvailable: async (shopId) => {
    try {
      if (!shopId) return false;
      
      const shopsRef = collection(db, 'shops');
      const q = query(
        shopsRef,
        where('id', '==', shopId),
        where('shopAvailability', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('❌ Error checking shop availability:', error);
      return false;
    }
  },

  // Get available shops for current stadium
  getAvailableShops: async () => {
    try {
      const selectedStadium = stadiumStorage.getSelectedStadium();
      if (!selectedStadium || !selectedStadium.id) {
        return [];
      }
      
      const shopsRef = collection(db, 'shops');
      const q = query(
        shopsRef,
        where('stadiumId', '==', selectedStadium.id),
        where('shopAvailability', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const shops = [];
      querySnapshot.forEach((doc) => {
        shops.push(doc.id);
      });
      
      return shops;
    } catch (error) {
      console.error('❌ Error getting available shops:', error);
      return [];
    }
  },

  // Check if cart has items from different shops (only consider available shops)
  hasMixedShops: async () => {
    try {
      const cartItems = cartUtils.getCartItems();
      if (cartItems.length === 0) return false;
      
      // Get available shops for current stadium
      const availableShops = await cartUtils.getAvailableShops();
      
      // Get primary shop from each item (only consider available shops)
      const primaryShops = [];
      cartItems.forEach(item => {
        let primaryShop = null;
        
        // Try to find an available shop for each item
        if (item.shopId && availableShops.includes(item.shopId)) {
          primaryShop = item.shopId;
        } else if (item.shopIds && item.shopIds.length > 0) {
          primaryShop = item.shopIds.find(shopId => availableShops.includes(shopId));
        }
        
        if (primaryShop) {
          primaryShops.push(primaryShop);
        }
      });
      
      const uniquePrimaryShops = [...new Set(primaryShops)].filter(shop => shop);
      console.log('🏪 Cart mixed shops check - unique available shops:', uniquePrimaryShops);
      return uniquePrimaryShops.length > 1;
    } catch (error) {
      console.error('❌ Error checking mixed shops:', error);
      return false;
    }
  },

  // Get unique shops in cart (only consider available shops)
  getCartShops: async () => {
    try {
      const cartItems = cartUtils.getCartItems();
      
      // Get available shops for current stadium
      const availableShops = await cartUtils.getAvailableShops();
      
      // Get primary shop from each item (only consider available shops)
      const primaryShops = [];
      cartItems.forEach(item => {
        let primaryShop = null;
        
        // Try to find an available shop for each item
        if (item.shopId && availableShops.includes(item.shopId)) {
          primaryShop = item.shopId;
        } else if (item.shopIds && item.shopIds.length > 0) {
          primaryShop = item.shopIds.find(shopId => availableShops.includes(shopId));
        }
        
        if (primaryShop) {
          primaryShops.push(primaryShop);
        }
      });
      
      const uniqueShops = [...new Set(primaryShops)].filter(shop => shop);
      console.log('🏪 Cart shops (available only):', uniqueShops);
      return uniqueShops;
    } catch (error) {
      console.error('❌ Error getting cart shops:', error);
      return [];
    }
  },

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
  addToCart: async (food, quantity = 1) => {
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
      
      // Get available shops for current stadium
      const availableShops = await cartUtils.getAvailableShops();
      console.log('🏪 Available shops for comparison:', availableShops);
      
      // Get primary shop for the new item (first available shop that can serve this item)
      let newItemPrimaryShop = null;
      if (food.shopId && availableShops.includes(food.shopId)) {
        newItemPrimaryShop = food.shopId;
      } else if (food.shopIds && food.shopIds.length > 0) {
        // Find first available shop from the item's shopIds
        const availableShopForItem = food.shopIds.find(shopId => availableShops.includes(shopId));
        newItemPrimaryShop = availableShopForItem;
      }
      
      console.log('🏪 New item primary shop:', newItemPrimaryShop);
      
      // Check if the shop is available (redundant check but safe)
      if (!newItemPrimaryShop) {
        console.log('🛒 [NO AVAILABLE SHOP] Item cannot be served by any available shop');
        return {
          success: false,
          message: 'This item is not available from any open shops. Please choose items from available shops.',
          shopUnavailable: true
        };
      }
      
      let existingCart = cartUtils.getCartItems();
      
      // Ensure existingCart is always an array
      if (!Array.isArray(existingCart)) {
        console.warn('⚠️ Cart is not an array, initializing empty cart');
        existingCart = [];
      }
      
      // Check if adding this item would create mixed shops (only consider available shops)
      if (existingCart.length > 0) {
        // Get primary shop from existing cart (only consider available shops)
        const existingPrimaryShops = [];
        existingCart.forEach(item => {
          let primaryShop = null;
          
          // Try to find an available shop for each existing item
          if (item.shopId && availableShops.includes(item.shopId)) {
            primaryShop = item.shopId;
          } else if (item.shopIds && item.shopIds.length > 0) {
            primaryShop = item.shopIds.find(shopId => availableShops.includes(shopId));
          }
          
          if (primaryShop) {
            existingPrimaryShops.push(primaryShop);
          }
        });
        
        console.log('🏪 Existing primary shops (available only):', [...new Set(existingPrimaryShops)]);
        
        // Check if primary shops are different
        const uniquePrimaryShops = [...new Set([...existingPrimaryShops, newItemPrimaryShop])].filter(shop => shop);
        
        if (uniquePrimaryShops.length > 1) {
          console.log('🛒 [MIXED SHOPS] Attempted to add item from different available shop');
          console.log('   Existing primary shops:', [...new Set(existingPrimaryShops)]);
          console.log('   New item primary shop:', newItemPrimaryShop);
          console.log('   Combined unique primary shops:', uniquePrimaryShops);
          
          return {
            success: false,
            message: 'cart.mixed_shops_error',
            mixedShops: true,
            existingShops: [...new Set(existingPrimaryShops)],
            newItemShops: [newItemPrimaryShop]
          };
        }
      }
      
      const existingItemIndex = existingCart.findIndex(item => item.id === food.id);
      
      if (existingItemIndex >= 0) {
        // Item already exists, increase quantity (matches Flutter logic)
        existingCart[existingItemIndex].quantity += quantity;
        console.log('📈 Updated existing item quantity:', existingCart[existingItemIndex].quantity);
      } else {
        // Add new item to cart (matches Flutter logic)
        // Calculate the actual price to use (discounted if it's an offer)
        const hasDiscount = food.discountPercentage && food.discountPercentage > 0;
        const basePrice = hasDiscount ? food.price * (1 - food.discountPercentage / 100) : food.price;

        // Add price for any selected sauces (if provided on food object)
        const sauces = Array.isArray(food.selectedSauces) ? food.selectedSauces : [];
        const extraSauceTotal = sauces.reduce((total, sauce) => {
          const saucePrice = typeof sauce.price === 'number' ? sauce.price : Number(sauce.price) || 0;
          return total + saucePrice;
        }, 0);

        const actualPrice = basePrice + extraSauceTotal;
        
        // Add prices for combo sub-item selections
        let comboExtrasTotal = 0;
        if (food.isCombo && food.comboSelections) {
          Object.values(food.comboSelections).forEach(selections => {
            if (Array.isArray(selections)) {
              selections.forEach(option => {
                const optPrice = typeof option.price === 'number' ? option.price : Number(option.price) || 0;
                comboExtrasTotal += optPrice;
              });
            }
          });
        }

        const finalPrice = actualPrice + comboExtrasTotal;
        
        const cartItem = {
          id: food.id,
          name: food.name,
          nameMap: food.nameMap || {},
          price: finalPrice, // Use discounted price + extras
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
          costOfGoods: food.costOfGoods || 0, // ✅ NEW: Support COG-based splits
          hasCOG: food.hasCOG || false,      // ✅ NEW: Support COG-based splits
          selectedSauces: sauces,
          comboSelections: food.comboSelections || {},
          comboItemInfo: food.comboItemInfo || {},
          isCombo: food.isCombo || false,
          comboItemIds: food.comboItemIds || [],
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
