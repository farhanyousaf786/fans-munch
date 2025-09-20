import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartUtils } from '../../utils/cartUtils';
import { userStorage, stadiumStorage, seatStorage } from '../../utils/storage';
import { Order } from '../../models/Order';
import orderRepository from '../../repositories/orderRepository';
import { showToast } from '../../components/toast/ToastContainer';
import SeatForm from './components/SeatForm';
import TicketUpload from './components/TicketUpload';
import OrderSummary from './components/OrderSummary';
import PlaceOrderBar from './components/PlaceOrderBar';
import StripePaymentForm from './components/StripePaymentForm';
import './OrderConfirmScreen.css';
import { db } from '../../config/firebase';
import { useTranslation } from '../../i18n/i18n';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { placeOrderAfterWalletSuccess } from './utils/walletOrderHandler';
import { placeOrderAfterPayment } from './utils/placeOrderCommon';

const OrderConfirmScreen = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const paymentRef = useRef(null);
  const [stripeIntent, setStripeIntent] = useState(null); // { id, clientSecret, mode }
  
  // Form state
  const [formData, setFormData] = useState({
    row: '',
    seatNo: '',
    entrance: '',
    stand: 'Main' // Default to Main stand
  });
  
  // Order state
  const [orderTotal, setOrderTotal] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0); // ILS per item
  const [tipData, setTipData] = useState({ amount: 0, percentage: 0 });
  const [finalTotal, setFinalTotal] = useState(0);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [ticketImage, setTicketImage] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [showErrors, setShowErrors] = useState(false); // hide red borders until submit or explicit show

  useEffect(() => {
    // Initialize order data
    const cartItems = cartUtils.getCartItems();
    const cartTotal = cartUtils.getTotalPrice();
    
    // Do not show validation errors on initial load; we'll validate on change and on submit
    setOrderTotal(cartTotal);
    // Delivery fee = 2 ILS per item (sum of quantities)
    const totalQty = Array.isArray(cartItems) ? cartItems.reduce((s, it) => s + (it.quantity || 0), 0) : 0;
    const fee = totalQty * 2;
    setDeliveryFee(fee);
    
    // Get tip data
    const savedTip = localStorage.getItem('selectedTip');
    if (savedTip) {
      const tip = JSON.parse(savedTip);
      setTipData(tip);
      setFinalTotal(cartTotal + fee + tip.amount);
    } else {
      setFinalTotal(cartTotal + fee);
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
          setLocationPermissionDenied(false);
        },
        (err) => {
          console.log('ℹ️ Geolocation unavailable:', err?.message);
          setLocationPermissionDenied(true);
        },
        { enableHighAccuracy: false, maximumAge: 60000, timeout: 5000 }
      );
    } else {
      console.log('ℹ️ Geolocation not supported by this browser');
      setLocationPermissionDenied(true);
    }

    // Run an initial validation to set isFormValid (errors remain hidden until submit)
    setTimeout(() => validateForm(), 0);
  }, []);

  // Calculate final total whenever order components change
  useEffect(() => {
    const total = orderTotal + deliveryFee + (tipData.amount || 0);
    setFinalTotal(total);
  }, [orderTotal, deliveryFee, tipData.amount]);

  // Pre-create payment intent on load so card UI can render immediately
  useEffect(() => {
    // Only create intent if we have a valid amount
    if (!finalTotal || finalTotal <= 0) {
      console.log('[OrderConfirm] Skipping intent creation - invalid amount:', finalTotal);
      return;
    }

    let cancelled = false;
    const createIntentIfNeeded = async () => {
      try {
        const API_BASE = (process.env.REACT_APP_API_BASE && process.env.REACT_APP_API_BASE.trim())
          ? process.env.REACT_APP_API_BASE.trim()
          : (window.location.port === '3000' ? 'http://localhost:5001' : '');
        const CURRENCY = (process.env.REACT_APP_CURRENCY && process.env.REACT_APP_CURRENCY.trim()) || 'USD';

        // Do not recreate if we already have a valid Stripe intent
        if (stripeIntent?.id && stripeIntent?.clientSecret) return;

        console.log('[OrderConfirm] Creating payment intent with amount:', finalTotal);

        const res = await fetch(`${API_BASE}/api/stripe/create-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            amount: finalTotal,
            currency: 'ils',
            vendorConnectedAccountId: process.env.REACT_APP_STRIPE_VENDOR_ACCOUNT_ID,
            // Send fee breakdown for payment splitting
            deliveryFee: deliveryFee,
            tipAmount: tipData.amount || 0
          })
        });
        const text = await res.text();
        let data; try { data = JSON.parse(text); } catch (_) {}
        if (!res.ok) {
          console.warn('OrderConfirm Pre-create Stripe intent failed:', text);
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
  }, [finalTotal, deliveryFee, tipData.amount]);

  const handleInputChange = (field, value) => {
    console.log('[INPUT CHANGE]', { field, value, currentFormData: formData });
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      console.log('[INPUT CHANGE] New form data:', newData);
      // Save to storage
      try { seatStorage.setSeatInfo({
        row: field === 'row' ? value : newData.row,
        seatNo: field === 'seatNo' ? value : newData.seatNo,
        entrance: field === 'entrance' ? value : newData.entrance,
        stand: field === 'stand' ? value : newData.stand,
      }); } catch (e) { console.warn('seatStorage set error', e); }
      return newData;
    });
    
    // Re-validate form after input change
    setTimeout(() => validateForm(), 0);
  };

  const validateForm = () => {
    const newErrors = {};
    
    console.log('[VALIDATION] Checking form data:', {
      row: formData.row,
      seatNo: formData.seatNo,
      entrance: formData.entrance,
      stand: formData.stand
    });
    
    if (!formData.row || !formData.row.trim()) {
      newErrors.row = t('order.err_row_required');
    }
    if (!formData.seatNo || !formData.seatNo.trim()) {
      newErrors.seatNo = t('order.err_seat_required');
    }
    if (!formData.entrance || !formData.entrance.trim()) {
      newErrors.entrance = t('order.err_entrance_required');
    }
    
    console.log('[VALIDATION] Validation result:', {
      errors: newErrors,
      isValid: Object.keys(newErrors).length === 0
    });
    
    // Only surface errors in UI if showErrors is enabled
    setErrors(showErrors ? newErrors : {});
    const isValid = Object.keys(newErrors).length === 0;
    setIsFormValid(isValid);
    return isValid;
  };

  // Unified validation with user feedback for both wallet and card flows
  const validateAndToast = useCallback(async () => {
    // Ensure any focused input commits its latest value (mobile keyboards)
    try { if (document && document.activeElement && typeof document.activeElement.blur === 'function') { document.activeElement.blur(); } } catch (_) {}
    // Give the browser a moment to commit input value after blur (helps on mobile)
    await new Promise(res => setTimeout(res, 60));
    // First, ensure location permission is granted
    if (locationPermissionDenied) {
      showToast(t('order.location_required_desc'), 'error', 3000);
      try { window && window.scrollTo && window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (_) {}
      return false;
    }

    // Surface errors in UI
    if (!showErrors) setShowErrors(true);

    // Run the same validation used by the form
    // Use a merged snapshot to avoid last-keystroke race when user taps Wallet immediately
    const savedSeat = seatStorage.getSeatInfo() || {};
    const pick = (primary, fallback) => {
      const p = (primary ?? '').toString();
      if (p.trim().length > 0) return p;
      const f = (fallback ?? '').toString();
      return f;
    };
    const effective = {
      row: pick(formData.row, savedSeat.row),
      seatNo: pick(formData.seatNo, savedSeat.seatNo),
      entrance: pick(formData.entrance, savedSeat.entrance),
    };

    const newErrors = {};
    if (!effective.row.trim()) newErrors.row = t('order.err_row_required');
    if (!effective.seatNo.trim()) newErrors.seatNo = t('order.err_seat_required');
    if (!effective.entrance.trim()) newErrors.entrance = t('order.err_entrance_required');

    try {
      console.log('[VALIDATE WALLET] effective values:', effective, 'errors:', newErrors);
    } catch (_) {}

    setErrors(newErrors);
    const ok = Object.keys(newErrors).length === 0;
    setIsFormValid(ok);

    if (!ok) {
      // Build a succinct message of missing fields
      const missing = [];
      if (newErrors.row) missing.push(t('order.row'));
      if (newErrors.seatNo) missing.push(t('order.seat'));
      if (newErrors.entrance) missing.push(t('order.entrance'));

      const prefix = t('order.complete_required_fields_prefix');
      const msg = `${prefix} ${missing.join(', ')}`.trim();
      showToast(msg, 'error', 4000);
      // Ensure the user sees the form at the top where the inputs live
      try { window && window.scrollTo && window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (_) {}
      return false;
    }
    return true;
  }, [locationPermissionDenied, showErrors, formData, t]);

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

  const requestLocationPermission = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCustomerLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
          setLocationPermissionDenied(false);
          showToast('Location access granted!', 'success', 2000);
        },
        (err) => {
          console.log('ℹ️ Geolocation permission denied again:', err?.message);
          setLocationPermissionDenied(true);
          showToast('Location access is required for delivery. Please enable it in your browser settings.', 'error', 4000);
        },
        { enableHighAccuracy: false, maximumAge: 60000, timeout: 5000 }
      );
    }
  };


  const handlePayment = async () => {
    // Check location permission first
    if (locationPermissionDenied) {
      showToast(t('order.location_required_desc'), 'error', 3000);
      return;
    }

    // Validate required fields with feedback
    const valid = await validateAndToast();
    if (!valid) return;

    setLoading(true);
    
    try {
      // Ensure we have an intent (pre-created in useEffect; if missing, create now)
      const API_BASE = (process.env.REACT_APP_API_BASE && process.env.REACT_APP_API_BASE.trim())
        ? process.env.REACT_APP_API_BASE.trim()
        : (window.location.port === '3000' ? 'http://localhost:5001' : '');
      // const CURRENCY = (process.env.REACT_APP_CURRENCY && process.env.REACT_APP_CURRENCY.trim()) || 'USD';

      // Stripe payment flow only
      if (!stripeIntent?.id || !stripeIntent?.clientSecret) {
        const res = await fetch(`${API_BASE}/api/stripe/create-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Testing: force static ₪5.00 amount. Commented out dynamic amount line below.
          // amount: finalTotal,
          body: JSON.stringify({ 
            amount: finalTotal, 
            currency: 'ils',
            vendorConnectedAccountId: process.env.REACT_APP_STRIPE_VENDOR_ACCOUNT_ID,
            // Send fee breakdown for payment splitting
            
            deliveryFee: deliveryFee,
            tipAmount: tipData.amount || 0
          })
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
        if (!confirmRes?.ok) {
          throw new Error(confirmRes?.error?.message || 'Stripe card confirmation failed');
        }
      }

      // 2) Save order in Firebase
      const userData = userStorage.getUserData();
      const stadiumData = stadiumStorage.getSelectedStadium();
      const cartItems = cartUtils.getCartItems();
      
      // Debug what data we have
      console.log('[ORDER DEBUG] userData:', !!userData, 'stadiumData:', !!stadiumData, 'cartItems:', cartItems.length);
      console.log('[ORDER DEBUG] stadiumData details:', stadiumData);
      
      // Check auth first - redirect to login if not authenticated
      if (!userData) {
        showToast('Please sign in to complete your order', 'error', 3000);
        try { localStorage.setItem('postLoginNext', '/order/confirm'); } catch (_) {}
        navigate('/auth?next=%2Forder%2Fconfirm');
        return;
      }
      
      if (!stadiumData) {
        showToast('Please select a stadium first', 'error', 3000);
        navigate('/stadium-selection');
        return;
      }
      
      if (cartItems.length === 0) {
        showToast('Cart is empty', 'error', 3000);
        navigate('/home');
        return;
      }

      // Build effective form exactly like wallet flow (merge savedSeat + current form, prefer non-empty)
      const savedSeatForCard = seatStorage.getSeatInfo() || {};
      const pickTrimCard = (primary, fallback) => {
        const p = (primary ?? '').toString().trim();
        if (p.length > 0) return p;
        return (fallback ?? '').toString().trim();
      };
      const effectiveFormForCard = {
        row: pickTrimCard(formData.row, savedSeatForCard.row),
        seatNo: pickTrimCard(formData.seatNo, savedSeatForCard.seatNo),
        entrance: pickTrimCard(formData.entrance, savedSeatForCard.entrance),
        stand: pickTrimCard(formData.stand, savedSeatForCard.stand),
        section: pickTrimCard(formData.section, savedSeatForCard.section),
        seatDetails: pickTrimCard(formData.seatDetails, savedSeatForCard.seatDetails),
        area: pickTrimCard(formData.area, savedSeatForCard.area),
      };

      const createdOrder = await placeOrderAfterPayment({
        formData: effectiveFormForCard,
        tipData,
        ticketImage,
        customerLocation,
        finalTotal,
        notifyDelivery: false,
        strictShopAvailability: true,
      });

      // 4) Cleanup and reset UI (cart/tip already cleared in helper)
      try { seatStorage.clearSeatInfo && seatStorage.clearSeatInfo(); } catch (_) {}
      setFormData({ row: '', seatNo: '', section: '', seatDetails: '', area: '', entrance: '', stand: 'Main' });
      setErrors({});
      setShowErrors(false);
      setIsFormValid(false);
      setTicketImage(null);

      const msg = t('order.order_placed');
      showToast(`${msg} ${t('order.order_id')}: ${createdOrder.orderId}`, 'success', 4000);

      // Navigate to order tracking screen after a short delay
      console.log('Order Doc ID:', createdOrder.id);
      setTimeout(() => navigate(`/order/${createdOrder.id}`, { replace: true }), 1200);
    } catch (error) {
      console.error('❌ Payment/Order creation failed:', error);
      const errorMessage = error.message || t('order.payment_failed_generic');
      showToast(errorMessage, 'error', 5000);
    } finally {
      setLoading(false);
    }
  };

  // const handleBack = () => {
  //   navigate(-1);
  // };

  // Handler passed to StripePaymentForm for Apple/Google Pay success
  const handleWalletPaymentSuccess = async () => {
    // Validation for wallet is already handled before payment via validateBeforeWalletPay
    // Here we proceed to place the order after successful wallet charge
    setLoading(true);
    try {
      // We'll use a merged snapshot of storage + current form for ALL fields
      const savedSeat = seatStorage.getSeatInfo() || {};
      const pickTrim = (primary, fallback) => {
        const p = (primary ?? '').toString().trim();
        if (p.length > 0) return p;
        return (fallback ?? '').toString().trim();
      };
      const effectiveForm = {
        row: pickTrim(formData.row, savedSeat.row),
        seatNo: pickTrim(formData.seatNo, savedSeat.seatNo),
        entrance: pickTrim(formData.entrance, savedSeat.entrance),
        stand: pickTrim(formData.stand, savedSeat.stand),
        section: pickTrim(formData.section, savedSeat.section),
        seatDetails: pickTrim(formData.seatDetails, savedSeat.seatDetails),
        area: pickTrim(formData.area, savedSeat.area),
      };
      
      // Clear any stale errors
      setErrors({});
      setIsFormValid(true);

      try {
        const createdOrder = await placeOrderAfterWalletSuccess({
          formData: effectiveForm,
          tipData,
          ticketImage,
          customerLocation,
          finalTotal,
        });

        // Cleanup form inputs and notify & navigate
        try { seatStorage.clearSeatInfo && seatStorage.clearSeatInfo(); } catch (_) {}
        setFormData({ row: '', seatNo: '', section: '', seatDetails: '', area: '', entrance: '', stand: 'Main' });
        setErrors({});
        setShowErrors(false);
        setIsFormValid(false);
        setTicketImage(null);

        // Notify & navigate
        const msg = 'Order placed successfully!';
        showToast(`${msg} Order ID: ${createdOrder.orderId}`, 'success', 4000);
        setTimeout(() => navigate(`/order/${createdOrder.id}`, { replace: true }), 1200);
      } catch (orderError) {
        // Handle "shops are closed" error
        if (orderError.message && orderError.message.includes('Shops are closed today')) {
          showToast('Shops are closed today. Please try again later.', 'error', 5000);
        } else {
          showToast(orderError.message || 'Order failed. Please try again.', 'error', 4000);
        }
        console.error('[Wallet] Order placement failed:', orderError);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-confirm-screen">
      <div className="order-confirm-container">
        {/* Full-screen loader overlay */}
        {loading && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ background: '#fff', padding: 20, borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center' }}>
              <div className="spinner" style={{
                width: 24, height: 24, border: '3px solid #eee', borderTopColor: '#3b82f6', borderRadius: '50%',
                animation: 'spin 1s linear infinite', marginInlineEnd: 12
              }} />
              <div style={{ fontSize: 14, color: '#374151' }}>{t('order.processing_full')}</div>
            </div>
            {/* Simple keyframes for spinner */}
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}
        {/* Header Text Section */}
        <div className="order-header-section">
          <h2 className="order-header-title">{t('order.upload_ticket_header')}</h2>
          <p className="order-header-subtitle">{t('order.upload_ticket_subheader')}</p>
        </div>

        {/* Ticket Image Upload */}
        <TicketUpload ticketImage={ticketImage} onImageUpload={handleImageUpload} onCameraCapture={handleCameraCapture} />

        {/* Seat Information Form */}
        <SeatForm formData={formData} errors={errors} onChange={handleInputChange} />

        {/* Order Summary */}
        <OrderSummary orderTotal={orderTotal} deliveryFee={deliveryFee} tipData={tipData} finalTotal={finalTotal} />

        {/* Location Permission Warning */}
        {locationPermissionDenied && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '16px',
            margin: '16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ fontSize: '20px' }}>📍</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>
                {t('order.location_required')}
              </div>
              <div style={{ fontSize: '14px', color: '#a16207', marginBottom: '12px' }}>
                {t('order.location_required_desc')}
              </div>
              <button
                onClick={requestLocationPermission}
                style={{
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                {t('order.enable_location')}
              </button>
            </div>
          </div>
        )}

        {/* Stripe Payment Form with integrated Place Order button */}
        <StripePaymentForm
          ref={paymentRef}
          intentId={stripeIntent?.id}
          clientSecret={stripeIntent?.clientSecret}
          mode={stripeIntent?.mode}
          showConfirmButton={false}
          totalAmount={finalTotal}
          currency={'ils'}
          isFormValid={isFormValid && !locationPermissionDenied}
          onWalletPaymentSuccess={handleWalletPaymentSuccess}
          validateBeforeWalletPay={validateAndToast}
          disabled={locationPermissionDenied}
        />

        {/* Place Order CTA - moved right after card input */}
        <PlaceOrderBar 
          loading={loading} 
          finalTotal={finalTotal} 
          onPlaceOrder={handlePayment}
          disabled={locationPermissionDenied}
        />
      </div>
    </div>
  );
};

export default OrderConfirmScreen;
