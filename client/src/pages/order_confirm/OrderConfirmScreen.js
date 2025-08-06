import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoArrowBack, IoCamera, IoImage, IoCard, IoWallet } from 'react-icons/io5';
import { cartUtils } from '../../utils/cartUtils';
import { userStorage, stadiumStorage } from '../../utils/storage';
import { Order } from '../../models/Order';
import orderRepository from '../../repositories/orderRepository';
import stripeService from '../../services/stripeService';
import { showToast } from '../../components/toast/ToastContainer';
import './OrderConfirmScreen.css';

const OrderConfirmScreen = () => {
  const navigate = useNavigate();
  
  // Form state (matching Flutter form fields)
  const [formData, setFormData] = useState({
    row: '',
    seatNo: '',
    section: '',
    seatDetails: ''
  });
  
  // Order state
  const [orderTotal, setOrderTotal] = useState(0);
  const [tipData, setTipData] = useState({ amount: 0, percentage: 0 });
  const [finalTotal, setFinalTotal] = useState(0);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [ticketImage, setTicketImage] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('visa');

  useEffect(() => {
    // Initialize order data (matches Flutter initState)
    const cartTotal = cartUtils.getTotalPrice();
    setOrderTotal(cartTotal);
    
    // Get tip data from storage
    const savedTip = localStorage.getItem('selectedTip');
    if (savedTip) {
      const tip = JSON.parse(savedTip);
      setTipData(tip);
      setFinalTotal(cartTotal + tip.amount);
    } else {
      setFinalTotal(cartTotal);
    }
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required fields validation (matches Flutter validation)
    if (!formData.row.trim()) {
      newErrors.row = 'Please enter row number';
    }
    if (!formData.seatNo.trim()) {
      newErrors.seatNo = 'Please enter seat number';
    }
    if (!formData.section.trim()) {
      newErrors.section = 'Please enter section';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Create preview URL
      const imageUrl = URL.createObjectURL(file);
      setTicketImage(imageUrl);
      
      // TODO: Implement ML text recognition like Flutter app
      console.log('📷 Ticket image uploaded:', file.name);
    }
  };

  const handleCameraCapture = () => {
    // TODO: Implement camera capture
    console.log('📸 Camera capture requested');
  };

  const handlePayment = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      console.log('💳 Processing payment...');
      
      // Get user and stadium data (matches Flutter logic)
      const userData = userStorage.getUserData();
      const stadiumData = stadiumStorage.getSelectedStadium();
      const cartItems = cartUtils.getCartItems();
      
      if (!userData || !stadiumData || cartItems.length === 0) {
        throw new Error('Missing required data for order creation');
      }
      
      // Validate payment amount
      stripeService.validatePaymentAmount(finalTotal);
      
      const seatInfo = {
        row: formData.row,
        seatNo: formData.seatNo,
        section: formData.section,
        seatDetails: formData.seatDetails
      };
      
      // Calculate order totals (matches Flutter OrderRepository calculations)
      const totals = orderRepository.calculateOrderTotals(
        cartItems,
        2.99, // deliveryFee
        tipData.amount, // tipAmount
        0 // discount
      );
      
      // Step 1: Process Stripe payment (matches Flutter displayPaymentSheet)
      console.log('💳 Processing Stripe payment for:', stripeService.formatAmount(finalTotal));
      
      const paymentResult = await stripeService.processPayment({
        amount: finalTotal,
        currency: 'USD',
        description: `Stadium Food Order - ${cartItems.length} items`,
        customerInfo: {
          email: userData.email,
          name: `${userData.firstName} ${userData.lastName}`
        }
      });
      
      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment processing failed');
      }
      
      console.log('✅ Payment successful:', paymentResult.paymentIntentId);
      showToast('Payment successful! Creating your order...', 'success', 3000);
      
      // Step 2: Create order in Firebase (matches Flutter CreateOrder event)
      console.log('📦 Creating order in Firebase...');
      
      const order = Order.createFromCart({
        cartItems,
        subtotal: totals.subtotal,
        deliveryFee: totals.deliveryFee,
        discount: totals.discount,
        tipAmount: totals.tipAmount,
        userData,
        seatInfo,
        stadiumId: stadiumData.id,
        shopId: cartItems[0].shopId || ''
      });
      
      // Save order to Firebase
      const createdOrder = await orderRepository.createOrder(order);
      console.log('✅ Order created successfully:', createdOrder.orderId);
      
      // Step 3: Clear cart and cleanup (matches Flutter logic)
      cartUtils.clearCart();
      localStorage.removeItem('selectedTip');
      
      // Step 4: Show success message and navigate (matches Flutter)
      showToast(
        `Order placed successfully! Order ID: ${createdOrder.orderId}`,
        'success',
        4000
      );
      
      // Navigate to home after delay (matches Flutter navigation)
      setTimeout(() => {
        navigate('/home', { replace: true });
      }, 2000);
      
    } catch (error) {
      console.error('❌ Payment/Order creation failed:', error);
      
      // Show user-friendly error message
      const errorMessage = error.message || 'Payment failed. Please try again.';
      showToast(errorMessage, 'error', 5000);
      
      // Handle specific error types
      if (error.message.includes('payment')) {
        console.log('💳 Payment error - user can retry');
      } else if (error.message.includes('order')) {
        console.log('📦 Order creation error - may need manual intervention');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="order-confirm-screen">
      <div className="order-confirm-container">
        {/* Header */}
        <div className="order-confirm-header">
          <button className="back-button" onClick={handleBack}>
            <IoArrowBack size={24} />
          </button>
          <h1 className="order-confirm-title">Confirm Order</h1>
        </div>

        {/* Seat Information Form */}
        <div className="seat-info-section">
          <h2 className="section-title">Seat Information</h2>
          
          <div className="form-row">
            <div className="form-field">
              <label className="field-label">Row *</label>
              <input
                type="text"
                className={`field-input ${errors.row ? 'error' : ''}`}
                placeholder="Enter row number"
                value={formData.row}
                onChange={(e) => handleInputChange('row', e.target.value)}
              />
              {errors.row && <span className="error-text">{errors.row}</span>}
            </div>
            
            <div className="form-field">
              <label className="field-label">Seat Number *</label>
              <input
                type="text"
                className={`field-input ${errors.seatNo ? 'error' : ''}`}
                placeholder="Enter seat number"
                value={formData.seatNo}
                onChange={(e) => handleInputChange('seatNo', e.target.value)}
              />
              {errors.seatNo && <span className="error-text">{errors.seatNo}</span>}
            </div>
          </div>

          <div className="form-field">
            <label className="field-label">Section *</label>
            <input
              type="text"
              className={`field-input ${errors.section ? 'error' : ''}`}
              placeholder="Enter section"
              value={formData.section}
              onChange={(e) => handleInputChange('section', e.target.value)}
            />
            {errors.section && <span className="error-text">{errors.section}</span>}
          </div>

          <div className="form-field">
            <label className="field-label">Seat Details (Optional)</label>
            <textarea
              className="field-input textarea"
              placeholder="Additional seat information"
              value={formData.seatDetails}
              onChange={(e) => handleInputChange('seatDetails', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Ticket Image Upload */}
        <div className="ticket-upload-section">
          <h2 className="section-title">Ticket Image (Optional)</h2>
          <p className="section-description">
            Upload your ticket image to auto-fill seat information
          </p>
          
          <div className="upload-options">
            <label className="upload-option">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <IoImage size={24} />
              <span>Gallery</span>
            </label>
            
            <button className="upload-option" onClick={handleCameraCapture}>
              <IoCamera size={24} />
              <span>Camera</span>
            </button>
          </div>
          
          {ticketImage && (
            <div className="uploaded-image">
              <img src={ticketImage} alt="Ticket" className="ticket-preview" />
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div className="payment-method-section">
          <h2 className="section-title">Payment Method</h2>
          
          <div className="payment-options">
            <button
              className={`payment-option ${selectedPaymentMethod === 'visa' ? 'selected' : ''}`}
              onClick={() => setSelectedPaymentMethod('visa')}
            >
              <IoCard size={24} />
              <span>Visa</span>
            </button>
            
            <button
              className={`payment-option ${selectedPaymentMethod === 'paypal' ? 'selected' : ''}`}
              onClick={() => setSelectedPaymentMethod('paypal')}
            >
              <IoWallet size={24} />
              <span>PayPal</span>
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="order-summary-section">
          <h2 className="section-title">Order Summary</h2>
          
          <div className="summary-row">
            <span className="summary-label">Subtotal</span>
            <span className="summary-value">${orderTotal.toFixed(2)}</span>
          </div>
          
          <div className="summary-row">
            <span className="summary-label">Tip ({tipData.percentage}%)</span>
            <span className="summary-value">${tipData.amount.toFixed(2)}</span>
          </div>
          
          <div className="summary-row total">
            <span className="summary-label">Total</span>
            <span className="summary-value">${finalTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Place Order Button */}
        <div className="place-order-section">
          <button
            className="place-order-button"
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? 'Processing...' : `Place Order - $${finalTotal.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmScreen;
