// Unified order placement helper for both card and wallet payment flows
// Handles: minimal validation, totals, nearest shop resolution, order creation,
// optional delivery notification, cart/tip cleanup.

import { cartUtils } from '../../../utils/cartUtils';
import { userStorage, stadiumStorage } from '../../../utils/storage';
import orderRepository from '../../../repositories/orderRepository';
import { collection, getDoc, getDocs, doc, query, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { Order } from '../../../models/Order';

// New: Resolve shop based on selected section and stand



// - Main stand: picks first available shop ID (main shop)
// - Checks shopAvailability before selecting
async function resolveShopFromSection(stadiumId, sectionId, strictShopAvailability, stand) {
  if (!stadiumId || !sectionId) return null;
  try {
    const secRef = doc(db, 'stadiums', stadiumId, 'sections', sectionId);
    const secSnap = await getDoc(secRef);
    if (!secSnap.exists()) return null;
    const secData = secSnap.data() || {};
    const shops = Array.isArray(secData.shops) ? secData.shops : [];
    
    if (shops.length === 0) {
      if (strictShopAvailability) throw new Error('No shop is assigned to the selected section.');
      return null;
    }
    
    // Get shop availability data
    const availableShops = [];
    console.log(`🔍 [SHOP SELECTION] Checking availability for ${shops.length} shops in section ${sectionId}`);
    console.log(`📋 [SHOP SELECTION] Original shops array:`, shops);
    
    for (let i = 0; i < shops.length; i++) {
      const shopId = shops[i];
      try {
        const shopRef = doc(db, 'shops', shopId);
        const shopSnap = await getDoc(shopRef);
        if (shopSnap.exists()) {
          const shopData = shopSnap.data();
          console.log(`🔍 [SHOP SELECTION] Shop ${shopId} (index ${i}):`, {
            name: shopData.name,
            availability: shopData.shopAvailability,
            isAvailable: shopData.shopAvailability === true
          });
          
          if (shopData.shopAvailability === true) {
            availableShops.push(shopId);
            console.log(`✅ [SHOP SELECTION] Shop ${shopId} (index ${i}) is AVAILABLE - added to list`);
          } else {
            console.log(`❌ [SHOP SELECTION] Shop ${shopId} (index ${i}) is NOT available - skipped`);
          }
        } else {
          console.log(`❌ [SHOP SELECTION] Shop ${shopId} (index ${i}) does not exist in Firestore`);
        }
      } catch (error) {
        console.warn(`⚠️ [SHOP SELECTION] Error checking shop ${shopId} (index ${i}):`, error);
      }
    }
    
    console.log(`📊 [SHOP SELECTION] Available shops after filtering:`, availableShops);
    console.log(`🎯 [SHOP SELECTION] User selected stand: ${stand}`);
    
    if (availableShops.length === 0) {
      if (strictShopAvailability) throw new Error('No available shops found in the selected section.');
      return null;
    }
    
    // Choose available shop based on stand selection
    let selectedShopId;
    if (stand === 'Gallery') {
      // Gallery stand: check if last shop (gallery) is available, otherwise use first available
      const lastShopInOriginal = shops[shops.length - 1];
      const isGalleryShopAvailable = availableShops.includes(lastShopInOriginal);
      
      if (isGalleryShopAvailable) {
        // Gallery shop is open - use it
        selectedShopId = lastShopInOriginal;
        console.log(`🏟️ [SHOP SELECTION] Gallery stand selected:`);
        console.log(`   → Gallery shop (last in original) is AVAILABLE: ${lastShopInOriginal}`);
        console.log(`   → Selected shop ID: ${selectedShopId}`);
      } else {
        // Gallery shop is closed - use first available shop
        selectedShopId = availableShops[0];
        console.log(`🏟️ [SHOP SELECTION] Gallery stand selected:`);
        console.log(`   → Gallery shop (last in original) is CLOSED: ${lastShopInOriginal}`);
        console.log(`   → Falling back to first available shop: ${selectedShopId}`);
        console.log(`⚠️ [SHOP SELECTION] Gallery shop unavailable, using first available shop`);
      }
    } else {
      // Main stand (or any other): use first available shop ID (main shop)
      selectedShopId = availableShops[0];
      console.log(`🏟️ [SHOP SELECTION] Main stand selected:`);
      console.log(`   → Available shops count: ${availableShops.length}`);
      console.log(`   → Selected index: 0 (first available)`);
      console.log(`   → Selected shop ID: ${selectedShopId}`);
    }
    
    console.log(`🎯 [SHOP SELECTION] FINAL RESULT:`);
    console.log(`   → User stand: ${stand}`);
    console.log(`   → Original shops: ${JSON.stringify(shops)}`);
    console.log(`   → Available shops: ${JSON.stringify(availableShops)}`);
    console.log(`   → Selected shop: ${selectedShopId}`);
    
    if (stand === 'Gallery') {
      const lastShopInOriginal = shops[shops.length - 1];
      const isGalleryShopAvailable = availableShops.includes(lastShopInOriginal);
      console.log(`   → Selection logic: Gallery stand - ${isGalleryShopAvailable ? 'Gallery shop available' : 'Gallery shop closed, using first available'}`);
    } else {
      console.log(`   → Selection logic: Main stand - first available shop`);
    }
    
    return String(selectedShopId);
  } catch (e) {
    if (strictShopAvailability) throw e;
    return null;
  }
}

/**
 * Place an order after a successful payment. Shared by card and wallet flows.
 *
 * @param {Object} params
 * @param {{row:string,seatNo:string,section?:string,seatDetails?:string,area?:string,entrance?:string,stand?:string}} params.formData
 * @param {{amount:number, percentage:number}} params.tipData
 * @param {string|null} params.ticketImage
 * @param {{latitude:number, longitude:number}|null} params.customerLocation
 * @param {number} params.finalTotal
 * @param {boolean} [params.notifyDelivery=false]
 * @param {boolean} [params.strictShopAvailability=false]
 * @returns {Promise<{id:string, orderId:string}>}
 */
export async function placeOrderAfterPayment({
  formData,
  tipData,
  ticketImage,
  customerLocation,
  finalTotal,
  notifyDelivery = false,
  strictShopAvailability = false,
  customerPhone,
  deliveryMethod = 'delivery',
  pickupPointId = null,
  deliveryType = null,
  deliveryLocation = null,
  deliveryNotes = null,
}) {
  const userData = userStorage.getUserData();
  const userDataWithPhone = { ...userData, phone: customerPhone || userData?.phone };
  const stadiumData = stadiumStorage.getSelectedStadium();
  const cartItems = cartUtils.getCartItems();



  // Minimal validation (conditional by stadium and delivery method)
  // Skip seat/room/floor validation if user selected inside or outside delivery
  const usingInsideOutsideDelivery = deliveryType === 'inside' || deliveryType === 'outside';
  
  console.log('🔍 [VALIDATION] deliveryType:', deliveryType);
  console.log('🔍 [VALIDATION] usingInsideOutsideDelivery:', usingInsideOutsideDelivery);
  
  const requireSeats = deliveryMethod === 'delivery' && !!stadiumData?.availableSeats && !usingInsideOutsideDelivery;
  const requireSections = deliveryMethod === 'delivery' && stadiumData?.availableSections !== false && !usingInsideOutsideDelivery;
  const requireFloors = deliveryMethod === 'delivery' && !!stadiumData?.availableFloors && !usingInsideOutsideDelivery;
  const requireRooms = deliveryMethod === 'delivery' && !!stadiumData?.availableRooms && !usingInsideOutsideDelivery;
  const requirePickupPoint = deliveryMethod === 'pickup' && !!stadiumData?.availablePickupPoints;
  
  console.log('🔍 [VALIDATION] requireRooms:', requireRooms);

  if (requirePickupPoint) {
    if (!pickupPointId) {
      throw new Error('Please select a pickup point');
    }
  }

  if (requireSeats) {
    if (!formData?.row || !String(formData.row).trim()) {
      throw new Error('Row number is required');
    }
    if (!formData?.seatNo || !String(formData.seatNo).trim()) {
      throw new Error('Seat number is required');
    }
  }

  if (requireSections) {
    if (!formData?.sectionId || !String(formData.sectionId).trim()) {
      throw new Error('Section is required');
    }
  }

  if (requireFloors) {
    const floorsCount = typeof stadiumData?.floors === 'number' ? stadiumData.floors : parseInt(stadiumData?.floors, 10) || 0;
    if (floorsCount > 0) {
      if (!formData?.floor || !String(formData.floor).trim()) {
        throw new Error('Floor is required');
      }
    }
  }

  if (requireRooms) {
    if (!formData?.room || !String(formData.room).trim()) {
      throw new Error('Room is required');
    }
  }

  if (!userData) throw new Error('User data not found. Please log in again.');
  if (!stadiumData) throw new Error('Stadium data not found. Please select a stadium.');
  if (!cartItems || cartItems.length === 0) throw new Error('Cart is empty. Please add items to cart.');

  console.log('🔍 [PLACE ORDER] formData received:', formData);
  
  const seatInfo = {
    row: formData.row,
    seatNo: formData.seatNo,
    section: formData.section,
    sectionId: formData.sectionId,
    floor: formData.floor || '',
    room: formData.room || '',
    // Map deliveryNotes to seatDetails if specific seatDetails are missing
    seatDetails: formData.seatDetails || deliveryNotes || '',
    area: formData.area,
    entrance: formData.entrance,
    stand: formData.stand,
    ticketImage: ticketImage || ''
  };
  
  console.log('🔍 [PLACE ORDER] seatInfo created:', seatInfo);

  // 1. Resolve shop ID from cart items
  const allShopIdItems = [];
  cartItems.forEach(item => {
    // Ensure we handle IDs as strings and normalize them
    const sid = item.shopId !== undefined && item.shopId !== null ? String(item.shopId).trim() : '';
    if (sid) allShopIdItems.push(sid);
    
    if (Array.isArray(item.shopIds)) {
      item.shopIds.forEach(id => {
        const sid2 = id !== undefined && id !== null ? String(id).trim() : '';
        if (sid2) allShopIdItems.push(sid2);
      });
    }
  });
  
  const uniqueShopIds = [...new Set(allShopIdItems)];
  let selectedShopId = null;
  
  console.log(`🛒 [SHOP SELECTION] Unique shop IDs in cart:`, uniqueShopIds);
  console.log(`🛒 [SHOP SELECTION] Context: method=${deliveryMethod}, type=${deliveryType}`);

  // Logic: 
  // - If Inside/Outside delivery is picked, we MUST use a shop from the cart (those are shop-specific options)
  // - Otherwise, if exactly 1 shop is in cart, use it
  // - Otherwise (traditional delivery with mixed or no shops), resolve from section.
  
  if ((deliveryType === 'inside' || deliveryType === 'outside') && uniqueShopIds.length > 0) {
    selectedShopId = uniqueShopIds[0];
    console.log(`🛒 [SHOP SELECTION] Pro-actively using cart shop for ${deliveryType} delivery: ${selectedShopId}`);
  } else if (uniqueShopIds.length === 1) {
    selectedShopId = uniqueShopIds[0];
    console.log(`🛒 [SHOP SELECTION] Found exactly one shop in cart: ${selectedShopId}`);
  } else {
    // Fallback: Traditional delivery or cart has multiple/no shops
    try {
      console.log(`🔍 [SHOP SELECTION] Resolving shop from section: "${formData?.sectionId || ''}" stand: "${formData?.stand || ''}"`);
      selectedShopId = await resolveShopFromSection(stadiumData.id, formData?.sectionId, false, formData?.stand);
      
      // If resolving from section failed but we have a shop in the cart, use the cart shop as a safety fallback
      // This is helpful for stadiums with no sections configured.
      if (!selectedShopId && uniqueShopIds.length > 0) {
        selectedShopId = uniqueShopIds[0];
        console.log(`🛒 [SHOP SELECTION] Section resolution failed/skipped, falling back to cart shop: ${selectedShopId}`);
      }
      
      if (!selectedShopId && strictShopAvailability) {
        throw new Error('No shop is assigned to the selected section. Please choose a different section.');
      }
    } catch (e) {
      // Final attempt: if it's venue delivery, we really want to use the shop ID from the cart if possible
      if (uniqueShopIds.length > 0) {
        selectedShopId = uniqueShopIds[0];
        console.log(`🛒 [SHOP SELECTION] Error in resolution, using cart shop fallback: ${selectedShopId}`);
      } else {
        throw e;
      }
    }
  }

  if (!selectedShopId) {
    throw new Error('Unable to determine the shop for this order. Please try again or re-add items to your cart.');
  }

  // 2. Fetch shop data for fees and config
  let shopDoc = null;
  try {
    const shopRef = doc(db, 'shops', selectedShopId);
    const shopSnap = await getDoc(shopRef);
    if (shopSnap.exists()) {
      shopDoc = shopSnap.data();
    }
  } catch (err) {
    console.error('❌ [ORDER] Failed to fetch shop data:', err);
  }

  // 3. Determine final delivery fee based on method and type
  let finalFee = 0;
  let deliveryFeeCurrency = 'ILS';

  if (deliveryMethod === 'pickup') {
    finalFee = 0;
    console.log(`🚗 [ORDER] Pickup mode - fee 0`);
  } else if (deliveryType === 'inside' && shopDoc?.insideDelivery?.enabled) {
    const totalItems = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
    const baseFee = shopDoc.insideDelivery.fee || 0;
    finalFee = baseFee * totalItems;
    deliveryFeeCurrency = shopDoc.insideDelivery.currency || 'ILS';
    console.log(`🏟️ [ORDER] Inside delivery - fee ${baseFee} x ${totalItems} items = ${finalFee} ${deliveryFeeCurrency}`);
  } else if (deliveryType === 'outside' && shopDoc?.outsideDelivery?.enabled) {
    finalFee = shopDoc.outsideDelivery.fee || 0;
    deliveryFeeCurrency = shopDoc.outsideDelivery.currency || 'ILS';
    console.log(`🌍 [ORDER] Outside delivery - fee ${finalFee} ${deliveryFeeCurrency}`);
  } else {
    // Traditional delivery (room/section/floor)
    finalFee = shopDoc?.deliveryFee || 0;
    deliveryFeeCurrency = shopDoc?.deliveryFeeCurrency || 'ILS';
    console.log(`📦 [ORDER] Traditional delivery - fee ${finalFee} ${deliveryFeeCurrency}`);
  }

  // Handle currency conversion for fee (matching UI logic)
  const cartCurrency = cartItems.length > 0 ? cartItems[0].currency || 'ILS' : 'ILS';
  let feeInCartCurrency = finalFee;
  if (deliveryFeeCurrency !== cartCurrency) {
    const { convertPrice } = require('../../../utils/currencyConverter');
    const conversion = convertPrice(finalFee, deliveryFeeCurrency);
    feeInCartCurrency = conversion.convertedPrice;
    console.log(`💱 [ORDER] Fee converted to cart currency: ${feeInCartCurrency} ${cartCurrency}`);
  }

  const totals = orderRepository.calculateOrderTotals(
    cartItems,
    feeInCartCurrency,
    tipData?.amount || 0,
    0
  );

  // Build delivery configuration object if inside/outside delivery is selected
  let deliveryConfig = {};
  if (deliveryType === 'inside' || deliveryType === 'outside') {
    if (shopDoc) {
      const deliveryData = deliveryType === 'inside' ? shopDoc.insideDelivery : shopDoc.outsideDelivery;
      
      if (deliveryData && deliveryData.enabled) {
        // Find the selected location from the locations array
        let selectedLocationObj = null;
        if (deliveryData.locations && Array.isArray(deliveryData.locations)) {
          selectedLocationObj = deliveryData.locations.find(loc => {
            const locName = typeof loc === 'string' ? loc : loc.name;
            return locName === deliveryLocation;
          });
        }
        
        // Build the delivery configuration
        const deliveryKey = deliveryType === 'inside' ? 'insideDelivery' : 'outsideDelivery';
        
        // Handle Manual Entry specifically to save exact details into location string
        let finalLocation = selectedLocationObj || deliveryLocation;
        if (deliveryLocation === 'manual_delivery_entry') {
           const parts = [];
           if (formData.room) parts.push(`Room: ${formData.room}`);
           if (formData.floor) parts.push(`Floor: ${formData.floor}`);
           if (formData.section) parts.push(`Section: ${formData.section}`);
           // Fallback if empty but user selected manual
           finalLocation = parts.length > 0 ? parts.join(', ') : 'Manual Entry';
        }

        deliveryConfig[deliveryKey] = {
          fee: deliveryData.fee,
          currency: deliveryData.currency,
          location: finalLocation, 
          notes: deliveryNotes || '',
        };
        
        console.log(`📦 [ORDER] ${deliveryKey} config:`, deliveryConfig[deliveryKey]);
      }
    }
  }

  const order = Order.createFromCart({
    cartItems,
    subtotal: totals.subtotal,
    deliveryFee: totals.deliveryFee,
    discount: totals.discount,
    tipAmount: totals.tipAmount,
    tipPercentage: tipData?.percentage || 0,
    userData: userDataWithPhone,
    seatInfo,
    stadiumId: stadiumData.id,
    shopId: selectedShopId,
    customerLocation,
    location: null,
    deliveryUserId: "",
    deliveryMethod,
    pickupPointId,
    deliveryType: deliveryType || '', // Empty string if not selected
    ...deliveryConfig, // Add insideDelivery or outsideDelivery
  });

  const createdOrder = await orderRepository.createOrder(order);

  // Optionally notify nearest delivery user (if needed in your flow)
  if (notifyDelivery) {
    try {
      // In a future enhancement, you can resolve nearest delivery user here too.
      // For now, we only keep the API in case it is already wired elsewhere.
      // sendNewOrderNotification would need a user id; this util currently does not fetch drivers.
    } catch (_) {}
  }

  // Cleanup
  cartUtils.clearCart();
  localStorage.removeItem('selectedTip');

  return createdOrder;
}