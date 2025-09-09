import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartUtils } from '../../utils/cartUtils';
import { showToast } from '../../components/toast/ToastContainer';
import CartHeader from '../cart/components/CartHeader';
import CartLoadingState from '../cart/components/CartLoadingState';
import CartEmptyState from '../cart/components/CartEmptyState';
import CartItemsList from '../cart/components/CartItemsList';
import './PreCartPage.css';

const PreCartPage = ({ isFromHome = false }) => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load cart data from cartUtils
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

  // Update quantity with confirmation dialog for removal
  const updateQuantity = (foodId, newQuantity) => {
    const item = cartItems.find(item => item.id === foodId);
    if (!item) return;

    if (item.quantity === 1 && newQuantity < item.quantity) {
      if (window.confirm(`Remove ${item.name} from cart?`)) {
        removeCompletelyFromCart(foodId);
      }
    } else {
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

  // Remove completely from cart
  const removeCompletelyFromCart = (foodId) => {
    try {
      cartUtils.removeFromCart(foodId);
      showToast('success', 'Item removed from cart');
    } catch (error) {
      console.error('Error removing from cart:', error);
      showToast('error', 'Failed to remove item');
    }
  };

  // Handle continue shopping - go to menu list page
  const handleContinueShopping = () => {
    navigate('/menu'); // Go to menu list page
  };

  // Handle checkout - go to cart page
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      showToast('error', 'Cart is empty');
      return;
    }
    navigate('/cart');
  };

  if (loading) {
    return <CartLoadingState isFromHome={isFromHome} />;
  }

  return (
    <div className="precart-screen">
      <div className="precart-container">
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

      {/* Action Buttons - No price calculations */}
      <div className="precart-actions">
        <button 
          className="continue-shopping-btn"
          onClick={handleContinueShopping}
        >
          Continue Shopping
        </button>
        <button 
          className="checkout-btn"
          onClick={handleCheckout}
          disabled={cartItems.length === 0}
        >
          Checkout
        </button>
      </div>
    </div>
  );
};

export default PreCartPage;
