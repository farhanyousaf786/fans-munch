import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userStorage } from '../../utils/storage';
import { stadiumStorage } from '../../utils/storage';
import { cartUtils } from '../../utils/cartUtils';
import { showToast } from '../../components/toast/ToastContainer';
import { createAnonymousUser } from '../../utils/anonymousUserService';
import CartHeader from '../cart/components/CartHeader';
import CartLoadingState from '../cart/components/CartLoadingState';
import CartEmptyState from '../cart/components/CartEmptyState';
import CartItemsList from '../cart/components/CartItemsList';
import AuthRequiredModal from '../cart/components/AuthRequiredModal';
import './PreCartPage.css';

const PreCartPage = ({ isFromHome = false }) => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

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

  // Handle checkout - check auth first
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      showToast('error', 'Cart is empty');
      return;
    }
    
    // Check if user is logged in
    if (!userStorage.isLoggedIn || !userStorage.isLoggedIn()) {
      // Show auth modal if not logged in
      setShowAuthModal(true);
      return;
    }
    
    // User is logged in, proceed to tip page
    navigate('/tip');
  };

  const handleAuthModalConfirm = () => {
    try { localStorage.setItem('postLoginNext', '/tip'); } catch (_) {}
    setShowAuthModal(false);
    navigate('/auth?next=%2Ftip');
  };

  const handleAuthModalCancel = () => {
    setShowAuthModal(false);
  };

  const handleContinueAsGuest = async () => {
    try {
      setShowAuthModal(false);
      showToast('info', 'Creating guest account...');
      
      // Create anonymous user and sign them in
      const anonymousUser = await createAnonymousUser();
      
      showToast('success', `Welcome ${anonymousUser.displayName}!`);
      
      // Check if stadium is already selected
      const selectedStadium = stadiumStorage.getSelectedStadium();
      if (selectedStadium) {
        // Stadium already selected, go directly to tip page
        navigate('/tip');
      } else {
        // No stadium selected, go to stadium selection
        navigate('/stadium-selection');
      }
      
    } catch (error) {
      console.error('Failed to create guest account:', error);
      showToast('error', 'Failed to create guest account. Please try signing in.');
    }
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

      <AuthRequiredModal 
        open={showAuthModal}
        onCancel={handleAuthModalCancel}
        onConfirm={handleAuthModalConfirm}
        onContinueAsGuest={handleContinueAsGuest}
      />
    </div>
  );
};

export default PreCartPage;
