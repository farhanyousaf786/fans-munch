import React, { useState, useEffect } from 'react';
import './CartScreen.css';

const CartScreen = () => {
  const [cartItems, setCartItems] = useState([]);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);

  useEffect(() => {
    // TODO: Load cart from localStorage/Firebase
    // For now, using mock data
    setCartItems([
      {
        id: '1',
        name: 'Classic Burger',
        restaurant: 'Stadium Burgers',
        price: 12.99,
        quantity: 2,
        image: '🍔',
        customizations: ['No pickles', 'Extra cheese']
      },
      {
        id: '2',
        name: 'Large Fries',
        restaurant: 'Stadium Burgers',
        price: 4.99,
        quantity: 1,
        image: '🍟',
        customizations: []
      },
      {
        id: '3',
        name: 'Pepperoni Pizza Slice',
        restaurant: 'Pizza Corner',
        price: 6.50,
        quantity: 3,
        image: '🍕',
        customizations: ['Extra pepperoni']
      }
    ]);
  }, []);

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity === 0) {
      removeItem(id);
      return;
    }
    setCartItems(items => 
      items.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (id) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const applyPromoCode = () => {
    // Mock promo code validation
    if (promoCode.toLowerCase() === 'stadium10') {
      setAppliedPromo({ code: 'STADIUM10', discount: 0.1, type: 'percentage' });
      setPromoCode('');
    } else if (promoCode.toLowerCase() === 'free5') {
      setAppliedPromo({ code: 'FREE5', discount: 5, type: 'fixed' });
      setPromoCode('');
    } else {
      alert('Invalid promo code');
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateDiscount = () => {
    if (!appliedPromo) return 0;
    const subtotal = calculateSubtotal();
    if (appliedPromo.type === 'percentage') {
      return subtotal * appliedPromo.discount;
    }
    return appliedPromo.discount;
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    return (subtotal - discount) * 0.08; // 8% tax
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const tax = calculateTax();
    return subtotal - discount + tax;
  };

  const groupedItems = cartItems.reduce((groups, item) => {
    const restaurant = item.restaurant;
    if (!groups[restaurant]) {
      groups[restaurant] = [];
    }
    groups[restaurant].push(item);
    return groups;
  }, {});

  return (
    <div className="cart-screen">
      <div className="cart-container">
        {/* Header */}
        <div className="cart-header">
          <h1 className="cart-title">My Cart</h1>
          <p className="cart-subtitle">{cartItems.length} items in your cart</p>
        </div>

        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-icon">🛒</div>
            <h3>Your cart is empty</h3>
            <p>Add some delicious food to get started!</p>
            <button className="browse-button">Browse Menu</button>
          </div>
        ) : (
          <>
            {/* Cart Items by Restaurant */}
            <div className="cart-items">
              {Object.entries(groupedItems).map(([restaurant, items]) => (
                <div key={restaurant} className="restaurant-group">
                  <h3 className="restaurant-name">{restaurant}</h3>
                  {items.map(item => (
                    <div key={item.id} className="cart-item">
                      <div className="item-image">{item.image}</div>
                      <div className="item-details">
                        <h4 className="item-name">{item.name}</h4>
                        {item.customizations.length > 0 && (
                          <div className="item-customizations">
                            {item.customizations.map((custom, index) => (
                              <span key={index} className="customization">
                                {custom}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="item-price">${item.price.toFixed(2)}</p>
                      </div>
                      <div className="item-controls">
                        <div className="quantity-controls">
                          <button 
                            className="quantity-btn"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            -
                          </button>
                          <span className="quantity">{item.quantity}</span>
                          <button 
                            className="quantity-btn"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                        <button 
                          className="remove-btn"
                          onClick={() => removeItem(item.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Promo Code */}
            <div className="promo-section">
              <h3>Promo Code</h3>
              {appliedPromo ? (
                <div className="applied-promo">
                  <span className="promo-code">{appliedPromo.code}</span>
                  <span className="promo-discount">
                    -{appliedPromo.type === 'percentage' 
                      ? `${(appliedPromo.discount * 100)}%` 
                      : `$${appliedPromo.discount.toFixed(2)}`}
                  </span>
                  <button className="remove-promo" onClick={removePromo}>×</button>
                </div>
              ) : (
                <div className="promo-input">
                  <input
                    type="text"
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                  <button onClick={applyPromoCode}>Apply</button>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="order-summary">
              <h3>Order Summary</h3>
              <div className="summary-line">
                <span>Subtotal</span>
                <span>${calculateSubtotal().toFixed(2)}</span>
              </div>
              {appliedPromo && (
                <div className="summary-line discount">
                  <span>Discount ({appliedPromo.code})</span>
                  <span>-${calculateDiscount().toFixed(2)}</span>
                </div>
              )}
              <div className="summary-line">
                <span>Tax</span>
                <span>${calculateTax().toFixed(2)}</span>
              </div>
              <div className="summary-line total">
                <span>Total</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <div className="checkout-section">
              <button className="checkout-button">
                Proceed to Checkout • ${calculateTotal().toFixed(2)}
              </button>
              <p className="pickup-info">
                🕐 Estimated pickup time: 15-20 minutes
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartScreen;
