import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartUtils } from '../../utils/cartUtils';
import { userStorage, stadiumStorage, seatStorage, cartStorage, STORAGE_KEYS } from '../../utils/storage';
import { Order } from '../../models/Order';
import orderRepository from '../../repositories/orderRepository';
import { showToast } from '../../components/toast/ToastContainer';
import SeatForm from './components/SeatForm';
import TicketUpload from './components/TicketUpload';
import OrderSummary from './components/OrderSummary';
import PlaceOrderBar from './components/PlaceOrderBar';
import StripePaymentForm from './components/StripePaymentForm';
// Location permission UI removed; location no longer required
import './OrderConfirmScreen.css';
import { db } from '../../config/firebase';
import { useTranslation } from '../../i18n/i18n';
import { collection, getDocs, doc, getDoc, query } from 'firebase/firestore';
import { placeOrderAfterPayment } from './utils/placeOrderCommon';
import { fetchCustomerPhone, validatePhone, saveCustomerPhoneIfMissing, normalizePhone } from './utils/phoneHelper';
import QrScanner from '../../components/qr-scanner/QrScanner';

const OrderConfirmScreen = () => {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  console.log('🌐 OrderConfirmScreen language:', lang);
  console.log('🌐 Phone title translation:', t('order.phone_contact_title'));
  const paymentRef = useRef(null);
  const phoneInputRef = useRef(null);
  const [stripeIntent, setStripeIntent] = useState(null); // { id, clientSecret, mode }
  
  // Form state
  const [formData, setFormData] = useState({
    row: '',
    seatNo: '',
    entrance: '',
    stand: 'Main', // Default to Main stand
    section: '',
    sectionId: '',
    seatDetails: '',
    area: ''
  });
  
  // Order state
  const [orderTotal, setOrderTotal] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0); // ILS per item
  const [tipData, setTipData] = useState({ amount: 0, percentage: 0 });
  const [finalTotal, setFinalTotal] = useState(0);
  // Stadium and sections state
  const [stadiumId, setStadiumId] = useState(() => stadiumStorage.getSelectedStadium()?.id || null);
  const [sectionsOptions, setSectionsOptions] = useState([]); // [{id,name,shops:[], no:number}]
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [ticketImage, setTicketImage] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [showErrors, setShowErrors] = useState(false); // hide red borders until submit or explicit show
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [geoPermissionState, setGeoPermissionState] = useState('unknown'); // 'granted' | 'denied' | 'prompt' | 'unknown'

  // Phone state (for delivery contact)
  const [customerPhone, setCustomerPhone] = useState('');
  const [hasPhoneInCustomer, setHasPhoneInCustomer] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);

  useEffect(() => {
    // Initialize order data
    const cartItems = cartUtils.getCartItems();
    const cartTotal = cartUtils.getTotalPrice();
    
    // Do not show validation errors on initial load; we'll validate on change and on submit
    setOrderTotal(cartTotal);
    // Delivery fee = 2 ILS per regular item, 4 ILS per combo item
    console.log('🛒 Cart items for fee calculation:', cartItems);
    const fee = Array.isArray(cartItems) ? cartItems.reduce((s, it) => {
      // Check if item is combo by multiple methods
      const isComboItem = it.isCombo === true || 
                         (it.name && it.name.includes('+')) || 
                         (it.category && it.category.toLowerCase() === 'combo') ||
                         (it.comboItemIds && it.comboItemIds.length > 0);
      
      const itemFee = isComboItem ? 4 : 2;
      console.log(`📦 Item: ${it.name}, isCombo: ${it.isCombo}, detectedCombo: ${isComboItem}, quantity: ${it.quantity}, fee: ${itemFee}`);
      return s + (itemFee * (it.quantity || 0));
    }, 0) : 0;
    console.log('💰 Total delivery fee calculated:', fee);
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

    // Priority 1: Check URL parameters (direct QR scan)
    console.log('🔍 [ORDER] Checking for seat data...');
    console.log('🔍 [ORDER] Current URL:', window.location.href);
    
    const urlParams = new URLSearchParams(window.location.search);
    console.log('🔍 [ORDER] URL params:', Object.fromEntries(urlParams.entries()));
    
    const urlSeatData = {
      row: urlParams.get('row') || '',
      seatNo: urlParams.get('seat') || urlParams.get('seatNo') || '',
      section: urlParams.get('section') || '',
      sectionId: urlParams.get('sectionId') || '',
      entrance: urlParams.get('entrance') || urlParams.get('gate') || '',
      stand: urlParams.get('stand') || '',
      seatDetails: urlParams.get('details') || urlParams.get('seatDetails') || '',
      area: urlParams.get('area') || ''
    };

    const hasUrlData = Object.values(urlSeatData).some(v => v && String(v).trim() !== '');
    console.log('🔍 [ORDER] Has URL data?', hasUrlData, urlSeatData);
    
    // Priority 2: Check sessionStorage (from home page URL)
    console.log('🔍 [ORDER] Checking sessionStorage...');
    let sessionSeatData = null;
    try {
      const pendingData = sessionStorage.getItem('pending_seat_data');
      console.log('🔍 [ORDER] Raw sessionStorage data:', pendingData);
      
      if (pendingData) {
        sessionSeatData = JSON.parse(pendingData);
        console.log('✅ [ORDER] Parsed session data:', sessionSeatData);
      } else {
        console.log('⚠️ [ORDER] No data in sessionStorage');
      }
    } catch (e) {
      console.error('❌ [ORDER] Failed to parse pending seat data:', e);
    }
    
    if (hasUrlData) {
      // URL parameters take highest priority
      console.log('✅ [ORDER] Auto-filling from URL parameters:', urlSeatData);
      setFormData(prev => {
        const newData = { 
          ...prev, 
          ...urlSeatData,
          // Default stand to 'Main' if not provided in QR code
          stand: urlSeatData.stand || 'Main'
        };
        console.log('📝 [ORDER] Form data updated:', newData);
        return newData;
      });
      showToast('Seat info loaded from QR code!', 'success', 2000);
      // Clear session data after using URL params
      sessionStorage.removeItem('pending_seat_data');
      console.log('🗑️ [ORDER] Cleared sessionStorage');
    } else if (sessionSeatData) {
      // Session data (from home page) takes second priority
      console.log('✅ [ORDER] Auto-filling from session storage:', sessionSeatData);
      setFormData(prev => {
        const newData = { 
          ...prev, 
          ...sessionSeatData,
          // Default stand to 'Main' if not provided in QR code
          stand: sessionSeatData.stand || 'Main'
        };
        console.log('📝 [ORDER] Form data updated:', newData);
        return newData;
      });
      showToast('Seat info loaded from QR code!', 'success', 2000);
      // Clear session data after using it
      sessionStorage.removeItem('pending_seat_data');
      console.log('🗑️ [ORDER] Cleared sessionStorage');
    } else {
      // Priority 3: Fallback to saved seat info from storage
      console.log('🔍 [ORDER] Checking seatStorage...');
      const savedSeat = seatStorage.getSeatInfo();
      if (savedSeat) {
        console.log('✅ [ORDER] Auto-filling from seatStorage:', savedSeat);
        setFormData(prev => ({
          ...prev,
          ...savedSeat
        }));
      } else {
        console.log('⚠️ [ORDER] No seat data found anywhere - form will be empty');
      }
    }

    // Load phone from customers collection
    try {
      const u = userStorage.getUserData();
      if (u?.id) {
        fetchCustomerPhone(u.id).then(({ phone, exists }) => {
          setCustomerPhone(normalizePhone(phone));
          setHasPhoneInCustomer(!!exists && !!normalizePhone(phone));
          setEditingPhone(!exists || !normalizePhone(phone));
        });
      }
    } catch (_) {}

    // Load stadium sections for the selected stadium
    (async () => {
      try {
        const selectedStadium = stadiumStorage.getSelectedStadium();
        let sid = stadiumId || selectedStadium?.id;
        console.log('[Sections] Selected stadium from storage:', selectedStadium);
        // Fallback: if no stadium selected in storage, try the first stadium in collection
        if (!sid) {
          try {
            const stadSnap = await getDocs(collection(db, 'stadiums'));
            if (!stadSnap.empty) {
              sid = stadSnap.docs[0].id;
              setStadiumId(sid);
              console.log('[Sections] Using fallback stadium id from collection:', sid);
              try { showToast(`Using default stadium ${sid}`, 'info', 2500); } catch (_) {}
            }
          } catch (e) {
            console.warn('[Sections] Failed to load fallback stadium list:', e);
          }
        }
        if (sid) {
          const secsCol = collection(db, 'stadiums', sid, 'sections');
          const secsSnap = await getDocs(secsCol);
          console.log('[Sections] Fetched sections count:', secsSnap.size, 'for stadiumId:', sid);
          try {
            console.log('[Sections] Raw docs:', secsSnap.docs.map(d => ({ id: d.id, data: d.data() })));
          } catch (_) {}
          const all = secsSnap.docs.map(d => {
            const data = d.data() || {};
            const no = typeof data.sectionNo === 'number' ? data.sectionNo : Number(data.sectionNo);
            const display = (typeof no === 'number' && !Number.isNaN(no))
              ? `Section ${no}`
              : (data.sectionName || data.name || d.id);
            return {
              id: d.id,
              name: display,
              shops: data.shops || [],
              no: (typeof no === 'number' && !Number.isNaN(no)) ? no : null,
              isActive: (data.isActive === undefined || data.isActive === null) ? true : !!data.isActive
            };
          });
          // Show ALL sections (no isActive filter)
          const allSorted = [...all];
          allSorted.sort((a, b) => {
            if (a.no != null && b.no != null) return a.no - b.no;
            if (a.no != null) return -1;
            if (b.no != null) return 1;
            return String(a.name).localeCompare(String(b.name));
          });
          setSectionsOptions(allSorted);
          try {
            if (allSorted.length > 0) {
              showToast(`Loaded ${allSorted.length} sections for stadium ${sid}`, 'success', 2000);
            } else {
              showToast(`No sections found for stadium ${sid}`, 'error', 3000);
            }
          } catch (_) {}
          console.log('[Sections] Options after sort (all):', allSorted);
          // Auto-preselect if only one and none chosen yet
          if (allSorted.length === 1 && !formData.sectionId) {
            const only = allSorted[0];
            setFormData(prev => ({ ...prev, sectionId: only.id, section: only.name }));
            try { seatStorage.setSeatInfo({
              row: formData.row,
              seatNo: formData.seatNo,
              stand: formData.stand,
              sectionId: only.id,
              section: only.name,
              entrance: formData.entrance,
            }); } catch (_) {}
          }
        } else {
          setSectionsOptions([]);
          try { showToast('No stadium selected. Please choose a stadium first.', 'error', 3000); } catch (_) {}
        }
      } catch (e) {
        console.warn('[OrderConfirm] Failed to load sections:', e?.message || e);
        setSectionsOptions([]);
        try { showToast(`Failed to load sections: ${e?.message || e}`, 'error', 4000); } catch (_) {}
      }
    })();

    // Geolocation collection removed: location is not required for placing orders

    // Run an initial validation to set isFormValid (errors remain hidden until submit)
    setTimeout(() => validateForm(), 0);
    // We intentionally run this only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stadiumId]);

  // React to stadium changes dynamically via localStorage 'storage' event
  useEffect(() => {
    const handler = (evt) => {
      try {
        if (evt?.key === STORAGE_KEYS.SELECTED_STADIUM) {
          const sid = stadiumStorage.getSelectedStadium()?.id || null;
          setStadiumId(sid);
          // reset section selection on stadium change
          setFormData(prev => ({ ...prev, sectionId: '', section: '' }));
        }
      } catch (_) {}
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Auto-select sectionId from section name when coming from QR or saved seat
  useEffect(() => {
    try {
      // If we already have an id or no name, nothing to do
      const name = (formData.section || '').toString().trim();
      const hasId = !!(formData.sectionId && String(formData.sectionId).trim());
      if (!name || hasId || sectionsOptions.length === 0) return;

      const norm = name.toLowerCase();
      // Try exact name match (case-insensitive)
      let match = sectionsOptions.find(s => (s.name || '').toString().toLowerCase() === norm);

      // If the name looks like "Section N", match by number
      if (!match) {
        const m = /section\s*(\d+)/i.exec(name);
        if (m) {
          const num = Number(m[1]);
          if (!Number.isNaN(num)) {
            match = sectionsOptions.find(s => s.no === num) || null;
          }
        }
      }

      if (match) {
        setFormData(prev => ({ ...prev, sectionId: match.id, section: match.name }));
        try { seatStorage.setSeatInfo({
          row: formData.row,
          seatNo: formData.seatNo,
          entrance: formData.entrance,
          stand: formData.stand,
          section: match.name,
          sectionId: match.id,
        }); } catch (_) {}
        try { showToast(`Section auto-selected: ${match.name}`, 'success', 1600); } catch (_) {}
      }
    } catch (e) {
      console.warn('Auto-select sectionId failed:', e);
    }
  }, [sectionsOptions, formData.section, formData.sectionId]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        section: field === 'section' ? value : newData.section,
        sectionId: field === 'sectionId' ? value : newData.sectionId,
      }); } catch (e) { console.warn('seatStorage set error', e); }
      return newData;
    });
    
    // Re-validate form after input change
    setTimeout(() => validateForm(), 0);
  };

  const validateForm = () => {
    // Read the freshest phone directly from the input (avoids React state lag on mobile)
    let effectivePhone = customerPhone;
    try {
      const domVal = phoneInputRef.current?.value;
      if (typeof domVal === 'string') {
        effectivePhone = normalizePhone(domVal);
        if (effectivePhone !== customerPhone) setCustomerPhone(effectivePhone);
      }
    } catch (_) {}

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
    // Entrance no longer required
    // Require section selection
    if (!formData.sectionId || !String(formData.sectionId).trim()) {
      newErrors.section = t('order.err_section_required');
    }
    // Require phone only if it's missing in customer profile
    if (!hasPhoneInCustomer) {
      const ok = validatePhone(effectivePhone);
      if (!ok) {
        newErrors.customerPhone = t('order.err_phone_required');
      }
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
    // Location is no longer required

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
      sectionId: pick(formData.sectionId, savedSeat.sectionId),
    };

    // Read freshest phone directly from input
    let effectivePhone = customerPhone;
    try {
      const domVal = phoneInputRef.current?.value;
      if (typeof domVal === 'string') {
        effectivePhone = normalizePhone(domVal);
        if (effectivePhone !== customerPhone) setCustomerPhone(effectivePhone);
      }
    } catch (_) {}

    const newErrors = {};
    if (!effective.row.trim()) newErrors.row = t('order.err_row_required');
    if (!effective.seatNo.trim()) newErrors.seatNo = t('order.err_seat_required');
    if (!effective.sectionId || !String(effective.sectionId).trim()) newErrors.section = t('order.err_section_required');
    if (!hasPhoneInCustomer) {
      const okPhone = validatePhone(effectivePhone);
      if (!okPhone) newErrors.customerPhone = t('order.err_phone_required');
    }

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
      // entrance no longer required
      if (newErrors.customerPhone) missing.push(t('auth.phone'));

      const prefix = t('order.complete_required_fields_prefix');
      const msg = `${prefix} ${missing.join(', ')}`.trim();
      showToast(msg, 'error', 4000);
      // Ensure the user sees the form at the top where the inputs live
      try { window && window.scrollTo && window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (_) {}
      return false;
    }
    return true;
  }, [showErrors, formData, t, hasPhoneInCustomer]);

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

  // Phone change handler
  const handlePhoneChange = (value) => {
    // Normalize as the user types so validation matches the visible value
    try {
      const normalized = normalizePhone(value);
      setCustomerPhone(normalized);
    } catch (_) {
      setCustomerPhone(value);
    }
    // Re-validate to surface or clear phone errors live
    setTimeout(() => validateForm(), 0);
  };

  const handleQrScanSuccess = (seatData) => {
    try {
      // Update form data with scanned information
      setFormData(prev => ({
        ...prev,
        row: seatData.row || prev.row,
        seatNo: seatData.seatNo || prev.seatNo,
        section: seatData.section || prev.section,
        sectionId: seatData.sectionId || prev.sectionId,
        entrance: seatData.entrance || prev.entrance,
        stand: seatData.stand || prev.stand || 'Main',
        seatDetails: seatData.seatDetails || prev.seatDetails,
        area: seatData.area || prev.area
      }));

      // Save to storage
      try {
        seatStorage.setSeatInfo({
          row: seatData.row || formData.row,
          seatNo: seatData.seatNo || formData.seatNo,
          section: seatData.section || formData.section,
          sectionId: seatData.sectionId || formData.sectionId,
          entrance: seatData.entrance || formData.entrance,
          stand: seatData.stand || formData.stand || 'Main',
          seatDetails: seatData.seatDetails || formData.seatDetails,
          area: seatData.area || formData.area
        });
      } catch (_) {}

      setShowQrScanner(false);
      
      // Re-validate form after QR scan
      setTimeout(() => validateForm(), 100);
    } catch (error) {
      console.error('Failed to process QR scan data:', error);
      showToast('Failed to process QR code data', 'error', 3000);
    }
  };

  // Location permission workflow removed


  const handlePayment = async () => {
    // Location permission no longer required

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
        sectionId: pickTrimCard(formData.sectionId, savedSeatForCard.sectionId),
        seatDetails: pickTrimCard(formData.seatDetails, savedSeatForCard.seatDetails),
        area: pickTrimCard(formData.area, savedSeatForCard.area),
      };
      
      console.log('🔍 [ORDER DEBUG] formData:', formData);
      console.log('🔍 [ORDER DEBUG] savedSeatForCard:', savedSeatForCard);
      console.log('🔍 [ORDER DEBUG] effectiveFormForCard:', effectiveFormForCard);

      // Capture the freshest phone value at the moment of placing the order
      let effectivePhoneForCard = customerPhone;
      try {
        const domVal = phoneInputRef.current?.value;
        if (typeof domVal === 'string') {
          effectivePhoneForCard = normalizePhone(domVal);
          if (effectivePhoneForCard !== customerPhone) setCustomerPhone(effectivePhoneForCard);
        }
      } catch (_) {}

      const createdOrder = await placeOrderAfterPayment({
        formData: effectiveFormForCard,
        tipData,
        ticketImage,
        customerLocation,
        finalTotal,
        notifyDelivery: false,
        strictShopAvailability: true,
        customerPhone: effectivePhoneForCard || undefined,
      });

      // Save phone to customer profile only if it was missing and provided now
      try {
        const u = userStorage.getUserData();
        if (u?.id && !hasPhoneInCustomer && validatePhone(effectivePhoneForCard)) {
          await saveCustomerPhoneIfMissing(u.id, effectivePhoneForCard);
          setHasPhoneInCustomer(true);
        }
      } catch (_) {}

      // 4) Cleanup and reset UI (cart/tip already cleared in helper)
      try { seatStorage.clearSeatInfo && seatStorage.clearSeatInfo(); } catch (_) {}
      setFormData({ row: '', seatNo: '', section: '', sectionId: '', seatDetails: '', area: '', entrance: '', stand: 'Main' });
      setErrors({});
      setShowErrors(false);
      setIsFormValid(false);
      setTicketImage(null);
      setEditingPhone(false);

      const msg = t('order.order_placed');
      showToast(`${msg} ${t('order.order_id')}: ${createdOrder.orderId}`, 'success', 4000);

      // Clear cart after successful order
      try {
        cartStorage.clearCart();
        console.log('🛒 Cart cleared after successful order');
      } catch (e) {
        console.warn('Failed to clear cart:', e);
      }

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
        sectionId: pickTrim(formData.sectionId, savedSeat.sectionId),
        seatDetails: pickTrim(formData.seatDetails, savedSeat.seatDetails),
        area: pickTrim(formData.area, savedSeat.area),
      };
      
      // Clear any stale errors
      setErrors({});
      setIsFormValid(true);

      // Capture the freshest phone value at the moment of placing the order (wallet)
      let effectivePhoneForWallet = customerPhone;
      try {
        const domVal = phoneInputRef.current?.value;
        if (typeof domVal === 'string') {
          effectivePhoneForWallet = normalizePhone(domVal);
          if (effectivePhoneForWallet !== customerPhone) setCustomerPhone(effectivePhoneForWallet);
        }
      } catch (_) {}

      try {
        const createdOrder = await placeOrderAfterPayment({
          formData: effectiveForm,
          tipData,
          ticketImage,
          customerLocation: null,
          finalTotal,
          notifyDelivery: false,
          strictShopAvailability: true,
          customerPhone: effectivePhoneForWallet || undefined,
        });

        // Save phone to customer profile only if it was missing and provided now
        try {
          const u = userStorage.getUserData();
          if (u?.id && !hasPhoneInCustomer && validatePhone(effectivePhoneForWallet)) {
            await saveCustomerPhoneIfMissing(u.id, effectivePhoneForWallet);
            setHasPhoneInCustomer(true);
          }
        } catch (_) {}

        // Cleanup form inputs and notify & navigate
        try { seatStorage.clearSeatInfo && seatStorage.clearSeatInfo(); } catch (_) {}
        setFormData({ row: '', seatNo: '', section: '', sectionId: '', seatDetails: '', area: '', entrance: '', stand: 'Main' });
        setErrors({});
        setShowErrors(false);
        setIsFormValid(false);
        setTicketImage(null);
        setEditingPhone(false);

        // Clear cart after successful order
        try {
          cartStorage.clearCart();
          console.log('🛒 Cart cleared after successful order (Apple/Google Pay)');
        } catch (e) {
          console.warn('Failed to clear cart:', e);
        }

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
        <SeatForm 
          formData={formData} 
          errors={errors} 
          onChange={handleInputChange} 
          sectionsOptions={sectionsOptions}
          onScanQr={() => setShowQrScanner(true)}
        />

        {/* Customer Phone for Delivery Contact */}
        <div className="seat-info-section phone-section">
          <h2 className="section-title">{t('order.phone_contact_title') || 'Delivery Contact Phone'}</h2>
          <p className="helper-text" style={{ margin: '6px 0 10px', color: '#6b7280', fontSize: 14 }}>
            {t('order.phone_contact_hint') || 'This number will be used by the delivery person if they need help finding you.'}
          </p>
          {(!editingPhone && customerPhone) ? (
            <div className="phone-row">
              <div style={{ fontSize: 16, fontWeight: 600 }}>{customerPhone}</div>
              <button
                type="button"
                onClick={() => setEditingPhone(true)}
                style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}
              >
                {t('common.edit') || 'Edit'}
              </button>
            </div>
          ) : (
            <div style={{ maxWidth: 360 }}>
              <input
                type="tel"
                inputMode="tel"
                placeholder={t('order.phone_input_ph') || '+972501234567'}
                className={`field-input ${errors.customerPhone ? 'error' : ''}`}
                value={customerPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                ref={phoneInputRef}
                style={{ width: '100%' }}
              />
              {errors.customerPhone && (
                <div className="error-text" style={{ color: '#dc2626', fontSize: 12, marginTop: 6 }}>
                  {errors.customerPhone}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Order Summary */}
        <OrderSummary orderTotal={orderTotal} deliveryFee={deliveryFee} tipData={tipData} finalTotal={finalTotal} />

        {/* Stripe Payment Form with integrated Place Order button */}
        <StripePaymentForm
          ref={paymentRef}
          intentId={stripeIntent?.id}
          clientSecret={stripeIntent?.clientSecret}
          mode={stripeIntent?.mode}
          showConfirmButton={false}
          totalAmount={finalTotal}
          currency={'ils'}
          isFormValid={isFormValid}
          onWalletPaymentSuccess={handleWalletPaymentSuccess}
          validateBeforeWalletPay={validateAndToast}
          disabled={false}
        />

        {/* Place Order CTA - moved right after card input */}
        <PlaceOrderBar 
          loading={loading} 
          finalTotal={finalTotal} 
          onPlaceOrder={handlePayment}
          disabled={!isFormValid}
        />

        {/* QR Scanner Modal */}
        <QrScanner
          visible={showQrScanner}
          onScanSuccess={handleQrScanSuccess}
          onClose={() => setShowQrScanner(false)}
        />
      </div>
    </div>
  );
};
export default OrderConfirmScreen;
