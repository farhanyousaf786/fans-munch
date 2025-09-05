import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartUtils } from '../../utils/cartUtils';
import { userStorage, stadiumStorage, seatStorage } from '../../utils/storage';
import { Order } from '../../models/Order';
import orderRepository from '../../repositories/orderRepository';
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
  
  // Form state
  const [formData, setFormData] = useState({
    row: '',
    seatNo: '',
    section: '',
    seatDetails: '',
    area: '',
    entrance: '',
    stand: ''
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
  const [customerLocation, setCustomerLocation] = useState(null);

  useEffect(() => {
    // Initialize order data
    const cartTotal = cartUtils.getTotalPrice();
    setOrderTotal(cartTotal);
    
    // Get tip data
    const savedTip = localStorage.getItem('selectedTip');
    if (savedTip) {
      const tip = JSON.parse(savedTip);
      setTipData(tip);
      setFinalTotal(cartTotal + tip.amount);
    } else {
      setFinalTotal(cartTotal);
    }

    // Prefill seat info
    const savedSeat = seatStorage.getSeatInfo();
    if (savedSeat) {
      setFormData(prev => ({
        ...prev,
        ...savedSeat
      }));
    }

    // Try to capture geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCustomerLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
        },
        (err) => {
          console.log('ℹ️ Geolocation permission denied or unavailable:', err?.message);
        },
        { enableHighAccuracy: false, maximumAge: 60000, timeout: 5000 }
      );
    }
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.row.trim()) {
      newErrors.row = 'Please enter row number';
    }
    if (!formData.seatNo.trim()) {
      newErrors.seatNo = 'Please enter seat number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setTicketImage(imageUrl);
      console.log('📷 Ticket image uploaded:', file.name);
    }
  };

  const handleCameraCapture = () => {
    console.log('📸 Camera capture requested');
  };

  const handlePayment = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Build base URL to call server correctly in dev and prod
      const API_BASE = (process.env.REACT_APP_API_BASE && process.env.REACT_APP_API_BASE.trim())
        ? process.env.REACT_APP_API_BASE.trim()
        : (window.location.port === '3000' ? 'http://localhost:5001' : '');

      // 1) Call backend test endpoint to simulate payment success
      const res = await fetch(`${API_BASE}/api/airwallex/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: finalTotal, currency: 'USD' })
      });

      // Accept JSON or plain text (proxy errors)
      const text = await res.text();
      let data; try { data = JSON.parse(text); } catch (_) {}
      if (!res.ok) {
        throw new Error((data && data.message) || text || 'Server test failed');
      }

      // 2) Save order in Firebase
      const userData = userStorage.getUserData();
      const stadiumData = stadiumStorage.getSelectedStadium();
      const cartItems = cartUtils.getCartItems();
      if (!userData || !stadiumData || cartItems.length === 0) {
        throw new Error('Missing required data to create order');
      }

      const seatInfo = {
        row: formData.row,
        seatNo: formData.seatNo,
        section: formData.section,
        seatDetails: formData.seatDetails,
        area: formData.area,
        entrance: formData.entrance,
        stand: formData.stand,
        ticketImage: ticketImage || ''
      };

      const totals = orderRepository.calculateOrderTotals(
        cartItems,
        2, // deliveryFee
        tipData.amount,
        0
      );

      const order = Order.createFromCart({
        cartItems,
        subtotal: totals.subtotal,
        deliveryFee: totals.deliveryFee,
        discount: totals.discount,
        tipAmount: totals.tipAmount,
        tipPercentage: tipData.percentage || 0,
        userData,
        seatInfo,
        stadiumId: stadiumData.id,
        shopId: cartItems[0].shopId || '',
        customerLocation,
        location: customerLocation
      });

      const createdOrder = await orderRepository.createOrder(order);

      // 3) Cleanup and notify
      cartUtils.clearCart();
      localStorage.removeItem('selectedTip');

      const msg = (data && data.message) || 'Order placed successfully!';
      alert(`${msg} Order ID: ${createdOrder.orderId}`);
      showToast(`Order placed successfully! Order ID: ${createdOrder.orderId}`, 'success', 4000);

      // Navigate after a short delay
      setTimeout(() => navigate('/home', { replace: true }), 1200);
    } catch (error) {
      console.error('❌ Payment/Order creation failed:', error);
      const errorMessage = error.message || 'Payment failed. Please try again.';
      showToast(errorMessage, 'error', 5000);
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

        {/* Ticket Image Upload */}
        <TicketUpload ticketImage={ticketImage} onImageUpload={handleImageUpload} onCameraCapture={handleCameraCapture} />

        {/* Seat Information Form */}
        <SeatForm formData={formData} errors={errors} onChange={handleInputChange} />

        {/* Payment Methods */}
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
