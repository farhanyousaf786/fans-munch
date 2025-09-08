import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartUtils } from '../../utils/cartUtils';
import { showToast } from '../../components/toast/ToastContainer';
import CartHeader from './components/CartHeader';
import CartLoadingState from './components/CartLoadingState';
import CartEmptyState from './components/CartEmptyState';
import CartItemsList from './components/CartItemsList';
import PriceInfoWidget from './components/PriceInfoWidget';
import './CartScreen.css';

const CartScreen = ({ isFromHome = false }) => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load cart data from cartUtils (matches Flutter OrderRepository.cart)
  useEffect(() => {
    loadCartData();
    
    // Listen for cart updates
    const handleCartUpdate = () => {
      loadCartData();
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const loadCartData = () => {
    setLoading(true);
    try {
      // Load cart from storage (matches Flutter loadCart())
      const cart = cartUtils.getCartItems();
      console.log('📦 Loaded cart from storage:', cart);
      setCartItems(cart);
    } catch (error) {
      console.error('❌ Error loading cart:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Update quantity with confirmation dialog for removal (matches Flutter logic exactly)
  const updateQuantity = (foodId, newQuantity) => {
    const item = cartItems.find(item => item.id === foodId);
    if (!item) return;

    // Flutter logic: If current quantity is 1 and trying to decrease, show confirmation
    if (item.quantity === 1 && newQuantity < item.quantity) {
      // Show confirmation dialog before removing (matches Flutter)
      if (window.confirm(`Remove ${item.name} from cart?`)) {
        removeCompletelyFromCart(foodId);
      }
      // If user cancels, do nothing (don't decrease quantity)
    } else {
      // Normal quantity update (matches Flutter RemoveFromCart for quantity > 1)
      try {
        cartUtils.updateQuantity(foodId, newQuantity);
        showToast('success', 'Cart updated');
      } catch (error) {
        console.error('Error updating quantity:', error);
        showToast('error', 'Failed to update cart');
      }
    }
  };

  // Add to cart (increase quantity)
  const addToCart = (foodId) => {
    const item = cartItems.find(item => item.id === foodId);
    if (item) {
      updateQuantity(foodId, item.quantity + 1);
    }
  };

  // Remove completely from cart (matches Flutter RemoveCompletelyFromCart)
  const removeCompletelyFromCart = (foodId) => {
    try {
      cartUtils.removeFromCart(foodId);
      showToast('success', 'Item removed from cart');
    } catch (error) {
      console.error('Error removing from cart:', error);
      showToast('error', 'Failed to remove item');
    }
  };

  // Calculate price totals (matches Flutter OrderRepository calculations)
  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateDeliveryFee = () => {
    // Handling & Delivery: 2 ILS per item (sum of quantities)
    const totalQty = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    return totalQty * 2; // ILS
  };

  const calculateTip = () => {
    return 0; // No tip by default (matches Flutter)
  };

  const calculateDiscount = () => {
    return 0; // No discount by default (matches Flutter)
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const deliveryFee = calculateDeliveryFee();
    const tip = calculateTip();
    const discount = calculateDiscount();
    return subtotal + deliveryFee + tip - discount;
  };

  // Handle place order (matches Flutter navigation to tip screen)
  const handlePlaceOrder = () => {
    if (cartItems.length === 0) {
      showToast('error', 'Cart is empty');
      return;
    }
    // Navigate to tip/checkout screen (matches Flutter)
    navigate('/tip');
  };

  if (loading) {
    return <CartLoadingState isFromHome={isFromHome} />;
  }

  return (
    <div className="cart-screen">
      <div className="cart-container">
        {/* Header Component */}
        <CartHeader isFromHome={isFromHome} />

        {/* Empty cart state or Cart Items List */}
        {cartItems.length === 0 ? (
          <CartEmptyState />
        ) : (
          <CartItemsList 
            cartItems={cartItems}
            onUpdateQuantity={updateQuantity}
            onAddToCart={addToCart}
            onRemoveFromCart={removeCompletelyFromCart}
          />
        )}
      </div>

      {/* Price Info Widget Component */}
      <PriceInfoWidget 
        cartItems={cartItems}
        calculateSubtotal={calculateSubtotal}
        calculateDeliveryFee={calculateDeliveryFee}
        calculateTip={calculateTip}
        calculateDiscount={calculateDiscount}
        calculateTotal={calculateTotal}
        onPlaceOrder={handlePlaceOrder}
      />
    </div>
  );
};

export default CartScreen;
