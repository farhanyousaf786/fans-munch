import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartUtils } from '../../utils/cartUtils';
import { userStorage, stadiumStorage } from '../../utils/storage';
import { Order } from '../../models/Order';
import orderRepository from '../../repositories/orderRepository';
import stripeService from '../../services/stripeService';
import { showToast } from '../../components/toast/ToastContainer';
import ConfirmHeader from './components/ConfirmHeader';
import SeatForm from './components/SeatForm';
import TicketUpload from './components/TicketUpload';
import PaymentMethods from './components/PaymentMethods';
import OrderSummary from './components/OrderSummary';
import PlaceOrderBar from './components/PlaceOrderBar';
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
      
      // Dispatch order update event for bottom navigation badge
      window.dispatchEvent(new CustomEvent('orderUpdated', {
        detail: {
          orderId: createdOrder.orderId,
          status: 'PENDING',
          action: 'created'
        }
      }));
      console.log('🔔 Order update event dispatched for badge update');
      
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
        <ConfirmHeader onBack={handleBack} />

        {/* Seat Information Form */}
        <SeatForm formData={formData} errors={errors} onChange={handleInputChange} />

        {/* Ticket Image Upload */}
        <TicketUpload ticketImage={ticketImage} onImageUpload={handleImageUpload} onCameraCapture={handleCameraCapture} />

        {/* Payment Method */}
        <PaymentMethods selected={selectedPaymentMethod} onSelect={setSelectedPaymentMethod} />

        {/* Order Summary */}
        <OrderSummary orderTotal={orderTotal} tipData={tipData} finalTotal={finalTotal} />

        {/* Place Order Button */}
        <PlaceOrderBar loading={loading} finalTotal={finalTotal} onPlaceOrder={handlePayment} />
      </div>
    </div>
  );
};

export default OrderConfirmScreen;
