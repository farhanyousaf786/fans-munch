import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartUtils } from '../../utils/cartUtils';
import { userStorage, stadiumStorage, seatStorage } from '../../utils/storage';
import { Order } from '../../models/Order';
import orderRepository from '../../repositories/orderRepository';
import { showToast } from '../../components/toast/ToastContainer';
import ConfirmHeader from './components/ConfirmHeader';
import SeatForm from './components/SeatForm';
import TicketUpload from './components/TicketUpload';
import OrderSummary from './components/OrderSummary';
import PlaceOrderBar from './components/PlaceOrderBar';
import StripePaymentForm from './components/StripePaymentForm';
import './OrderConfirmScreen.css';

const OrderConfirmScreen = () => {
  const navigate = useNavigate();
  const paymentRef = useRef(null);
  const [stripeIntent, setStripeIntent] = useState(null); // { id, clientSecret, mode }
  
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

  // Pre-create payment intent on load so card UI can render immediately
  useEffect(() => {
    let cancelled = false;
    const createIntentIfNeeded = async () => {
      try {
        const API_BASE = (process.env.REACT_APP_API_BASE && process.env.REACT_APP_API_BASE.trim())
          ? process.env.REACT_APP_API_BASE.trim()
          : (window.location.port === '3000' ? 'http://localhost:5001' : '');
        const CURRENCY = (process.env.REACT_APP_CURRENCY && process.env.REACT_APP_CURRENCY.trim()) || 'USD';

        // Do not recreate if we already have a valid Stripe intent
        if (stripeIntent?.id && stripeIntent?.clientSecret) return;

        const res = await fetch(`${API_BASE}/api/stripe/create-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: finalTotal, currency: CURRENCY })
        });
        const text = await res.text();
        let data; try { data = JSON.parse(text); } catch (_) {}
        if (!res.ok) {
          console.warn('[OrderConfirm] Pre-create Stripe intent failed:', text);
          return;
        }
        if (!cancelled) {
          setStripeIntent({ id: data?.intentId, clientSecret: data?.clientSecret, mode: data?.mode });
        }
      } catch (e) {
        console.warn('[OrderConfirm] Pre-create intent error:', e?.message || e);
      }
    };

    createIntentIfNeeded();
    return () => { cancelled = true; };
    // Recreate if total changes significantly (e.g., tip change)
  }, [finalTotal, stripeIntent?.id, stripeIntent?.clientSecret]);

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
      // Ensure we have an intent (pre-created in useEffect; if missing, create now)
      const API_BASE = (process.env.REACT_APP_API_BASE && process.env.REACT_APP_API_BASE.trim())
        ? process.env.REACT_APP_API_BASE.trim()
        : (window.location.port === '3000' ? 'http://localhost:5001' : '');
      const CURRENCY = (process.env.REACT_APP_CURRENCY && process.env.REACT_APP_CURRENCY.trim()) || 'USD';

      // Stripe payment flow only
      if (!stripeIntent?.id || !stripeIntent?.clientSecret) {
        const res = await fetch(`${API_BASE}/api/stripe/create-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: finalTotal, currency: CURRENCY })
        });
        const text = await res.text();
        let data; try { data = JSON.parse(text); } catch (_) {}
        if (!res.ok) {
          throw new Error((data && (data.error || data.message)) || text || 'Create Stripe intent failed');
        }
        setStripeIntent({ id: data?.intentId, clientSecret: data?.clientSecret, mode: data?.mode });
        showToast('✅ Stripe payment intent ready. Processing your order...', 'success', 2000);
      }

      // Wait for Stripe element to be ready, then confirm
      if (paymentRef.current?.confirm) {
        let attempts = 0;
        const maxAttempts = 15; // ~3s @ 200ms
        while (!(paymentRef.current.isReady && paymentRef.current.isReady()) && attempts < maxAttempts) {
          await new Promise(r => setTimeout(r, 200));
          attempts += 1;
        }

        if (!(paymentRef.current.isReady && paymentRef.current.isReady())) {
          throw new Error('Stripe card element not ready');
        }

        const confirmRes = await paymentRef.current.confirm();
        console.log('[OrderConfirm] Stripe confirm() result:', confirmRes);
        if (!confirmRes?.ok) {
          throw new Error(confirmRes?.error?.message || 'Stripe card confirmation failed');
        }
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

      const msg = 'Order placed successfully!';
      showToast(`${msg} Order ID: ${createdOrder.orderId}`, 'success', 4000);

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


        {/* Order Summary */}
        <OrderSummary orderTotal={orderTotal} tipData={tipData} finalTotal={finalTotal} />

        {/* Stripe Payment Form */}
        <StripePaymentForm
          ref={paymentRef}
          intentId={stripeIntent?.id}
          clientSecret={stripeIntent?.clientSecret}
          mode={stripeIntent?.mode}
          showConfirmButton={false}
        />

        {/* Place Order Button */}
        <PlaceOrderBar loading={loading} finalTotal={finalTotal} onPlaceOrder={handlePayment} />
      </div>
    </div>
  );
};

export default OrderConfirmScreen;
