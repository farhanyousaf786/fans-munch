import React, { useState, useEffect, useRef } from 'react';
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
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { sendNewOrderNotification } from '../../utils/notificationUtils';
import { placeOrderAfterWalletSuccess } from './utils/walletOrderHandler';

const OrderConfirmScreen = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
      // Persist to storage so wallet flow can read latest even if state lags
      try { seatStorage.setSeatInfo({
        row: field === 'row' ? value : newData.row,
        seatNo: field === 'seatNo' ? value : newData.seatNo,
        section: field === 'section' ? value : newData.section,
        seatDetails: field === 'seatDetails' ? value : newData.seatDetails,
        area: field === 'area' ? value : newData.area,
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
      rowTrimmed: formData.row?.trim(),
      seatNoTrimmed: formData.seatNo?.trim()
    });
    
    if (!formData.row || !formData.row.trim()) {
      newErrors.row = t('order.err_row_required');
    }
    if (!formData.seatNo || !formData.seatNo.trim()) {
      newErrors.seatNo = t('order.err_seat_required');
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

    // Enable showing errors and validate all fields
    if (!showErrors) setShowErrors(true);
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

      // Recompute delivery fee from cart at payment time (2 ILS per item)
      const totalQty = Array.isArray(cartItems) ? cartItems.reduce((s, it) => s + (it.quantity || 0), 0) : 0;
      const fee = totalQty * 2;

      const totals = orderRepository.calculateOrderTotals(
        cartItems,
        fee, // deliveryFee in ILS
        tipData.amount,
        0
      );

      // Resolve nearest active delivery user (if we have customer location)
      let nearestDeliveryUserId = null;
      try {
        if (customerLocation && typeof customerLocation.latitude === 'number' && typeof customerLocation.longitude === 'number') {
          const snap = await getDocs(collection(db, 'deliveryUsers'));
          let best = { id: null, dist: Number.POSITIVE_INFINITY };
          const toRad = (x) => (x * Math.PI) / 180;
          const haversine = (lat1, lon1, lat2, lon2) => {
            const R = 6371; // km
            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                      Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
          };
          snap.forEach((doc) => {
            const data = doc.data() || {};
            if (data.isActive !== true) return; // only active drivers
            const loc = data.location; // can be GeoPoint or [lat, lng]
            let lat, lng;
            if (loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
              lat = loc.latitude; lng = loc.longitude;
            } else if (Array.isArray(loc) && loc.length === 2) {
              lat = Number(loc[0]); lng = Number(loc[1]);
            }
            if (typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)) {
              const d = haversine(customerLocation.latitude, customerLocation.longitude, lat, lng);
              if (d < best.dist) best = { id: data.id || doc.id, dist: d };
            }
          });
          nearestDeliveryUserId = best.id;
        }
      } catch (e) {
        console.warn('Could not resolve nearest delivery user:', e?.message || e);
      }

      // Resolve nearest shop among those that carry items (cart shopIds); fallback to all shops
      let nearestShopId = null;
      try {
        // Collect candidate shop IDs from cart
        const candidateIds = Array.from(new Set(
          cartItems.flatMap(it => Array.isArray(it.shopIds) ? it.shopIds : (it.shopId ? [it.shopId] : []))
        ));

        const toRad = (x) => (x * Math.PI) / 180;
        const haversine = (lat1, lon1, lat2, lon2) => {
          const R = 6371; // km
          const dLat = toRad(lat2 - lat1);
          const dLon = toRad(lon2 - lon1);
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return R * c;
        };
        const parseNum = (v) => (typeof v === 'number' ? v : (typeof v === 'string' ? Number(v.replace(/[^0-9+\-.]/g, '')) : NaN));

        let shops = [];
        if (candidateIds.length > 0) {
          // Fetch only candidate shops
          const docs = await Promise.all(candidateIds.map(id => getDoc(doc(db, 'shops', id))));
          shops = docs.filter(d => d.exists()).map(d => ({ id: d.id, data: d.data() }));
        } else {
          // Fallback: all shops
          const snap = await getDocs(collection(db, 'shops'));
          shops = snap.docs.map(d => ({ id: d.id, data: d.data() }));
        }

        let bestShop = { id: null, dist: Number.POSITIVE_INFINITY };
        shops.forEach((entry) => {
          const s = entry.data || {};
          let lat, lng;
          // Prefer explicit latitude/longitude fields if present
          if (s.latitude != null && s.longitude != null) {
            lat = parseNum(s.latitude);
            lng = parseNum(s.longitude);
          } else if (s.location && typeof s.location.latitude === 'number' && typeof s.location.longitude === 'number') {
            lat = s.location.latitude; lng = s.location.longitude;
          } else if (Array.isArray(s.location) && s.location.length === 2) {
            lat = parseNum(s.location[0]); lng = parseNum(s.location[1]);
          }
          if (typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng) && customerLocation) {
            const d = haversine(customerLocation.latitude, customerLocation.longitude, lat, lng);
            if (d < bestShop.dist) bestShop = { id: entry.id, dist: d };
          }
        });

        nearestShopId = bestShop.id || null;
      } catch (e) {
        console.warn('Could not resolve nearest shop:', e?.message || e);
      }

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
        shopId: nearestShopId || cartItems[0].shopId || '',
        customerLocation,
        location: null,
        deliveryUserId: nearestDeliveryUserId || null
      });

      const createdOrder = await orderRepository.createOrder(order);

      // 4) Send notification to delivery user if assigned (via utility)
      if (nearestDeliveryUserId) {
        try {
          await sendNewOrderNotification(nearestDeliveryUserId, {
            orderId: createdOrder.orderId,
            customerName: `${userData.firstName} ${userData.lastName}`.trim(),
            stadiumName: stadiumData.name || stadiumData.title || 'Stadium',
            seatInfo: seatInfo,
            totalAmount: finalTotal,
            deliveryFee: fee,
            customerLocation: customerLocation,
            shopId: nearestShopId || cartItems[0].shopId || ''
          });
        } catch (notificationError) {
          console.warn('⚠️ Error sending notification to delivery user:', notificationError);
          // Don't fail the order creation if notification fails
        }
      }

      // 5) Cleanup and reset UI
      cartUtils.clearCart();
      localStorage.removeItem('selectedTip');
      try { seatStorage.clearSeatInfo && seatStorage.clearSeatInfo(); } catch (_) {}
      setFormData({ row: '', seatNo: '', section: '', seatDetails: '', area: '', entrance: '', stand: '' });
      setErrors({});
      setShowErrors(false);
      setIsFormValid(false);
      setTicketImage(null);

      const msg = t('order.order_placed');
      showToast(`${msg} ${t('order.order_id')}: ${createdOrder.orderId}`, 'success', 4000);

      // Navigate after a short delay
      setTimeout(() => navigate('/home', { replace: true }), 1200);
    } catch (error) {
      console.error('❌ Payment/Order creation failed:', error);
      const errorMessage = error.message || t('order.payment_failed_generic');
      showToast(errorMessage, 'error', 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Handler passed to StripePaymentForm for Apple/Google Pay success
  const handleWalletPaymentSuccess = async () => {
    setLoading(true);
    try {
      console.log('[Wallet] Apple/Google Pay success - skipping form validation');
      
      // For wallet payments, we skip form validation entirely
      // Users expect instant payment with Apple/Google Pay without form friction
      // We'll use whatever seat info is available from storage + current form
      const savedSeat = seatStorage.getSeatInfo() || {};
      const effectiveForm = {
        ...savedSeat,
        ...formData,
        row: (formData.row || savedSeat.row || '').toString().trim(),
        seatNo: (formData.seatNo || savedSeat.seatNo || '').toString().trim(),
      };
      
      // Clear any stale errors
      setErrors({});
      setIsFormValid(true);

      console.log('[Wallet] Placing order with effectiveForm, tipData, finalTotal:', { effectiveForm, tipAmount: tipData?.amount, finalTotal });
      const createdOrder = await placeOrderAfterWalletSuccess({
        formData: effectiveForm,
        tipData,
        ticketImage,
        customerLocation,
        finalTotal,
      });

      // Cleanup form inputs and notify & navigate
      try { seatStorage.clearSeatInfo && seatStorage.clearSeatInfo(); } catch (_) {}
      setFormData({ row: '', seatNo: '', section: '', seatDetails: '', area: '', entrance: '', stand: '' });
      setErrors({});
      setShowErrors(false);
      setIsFormValid(false);
      setTicketImage(null);

      // Notify & navigate
      const msg = 'Order placed successfully!';
      showToast(`${msg} Order ID: ${createdOrder.orderId}`, 'success', 4000);
      setTimeout(() => navigate('/home', { replace: true }), 1200);
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
