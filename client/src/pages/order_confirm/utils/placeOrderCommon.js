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
}) {
  const userData = userStorage.getUserData();
  const userDataWithPhone = { ...userData, phone: customerPhone || userData?.phone };
  const stadiumData = stadiumStorage.getSelectedStadium();
  const cartItems = cartUtils.getCartItems();

  // Minimal validation (conditional by stadium)
  const requireSeats = !!stadiumData?.availableSeats;
  const requireSections = stadiumData?.availableSections !== false;
  const requireFloors = !!stadiumData?.availableFloors;
  const requireRooms = !!stadiumData?.availableRooms;

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
    seatDetails: formData.seatDetails,
    area: formData.area,
    entrance: formData.entrance,
    stand: formData.stand,
    ticketImage: ticketImage || ''
  };
  
  console.log('🔍 [PLACE ORDER] seatInfo created:', seatInfo);

  // Recompute delivery fee from cart (2 ILS per regular item, 4 ILS per combo item)
  const fee = Array.isArray(cartItems) ? cartItems.reduce((s, it) => {
    // Check if item is combo by multiple methods (supports Hebrew and English)
    const isComboItem = it.isCombo === true || 
                       (it.name && (it.name.includes('+') || it.name.includes(' ו') || it.name.includes(' + '))) || 
                       (it.category && (it.category.toLowerCase() === 'combo' || it.category.includes('קומבו'))) ||
                       (it.comboItemIds && it.comboItemIds.length > 0);
    
    const itemFee = isComboItem ? 4 : 2;
    return s + (itemFee * (it.quantity || 0));
  }, 0) : 0;

  const totals = orderRepository.calculateOrderTotals(
    cartItems,
    fee,
    tipData?.amount || 0,
    0
  );

  // Check if all cart items have the same single shopId
  const allShopIds = [];
  cartItems.forEach(item => {
    if (item.shopId) allShopIds.push(item.shopId);
    if (item.shopIds && Array.isArray(item.shopIds)) {
      allShopIds.push(...item.shopIds);
    }
  });
  
  const uniqueShopIds = [...new Set(allShopIds)];
  
  let selectedShopId = null;
  
  // If there's only one unique shop ID across all items, use it
  if (uniqueShopIds.length === 1) {
    selectedShopId = uniqueShopIds[0];
    console.log(`🛒 [SHOP SELECTION] Using single shop ID from cart items: ${selectedShopId}`);
  } else {
    // Otherwise, resolve shop from section as before
    try {
      selectedShopId = await resolveShopFromSection(stadiumData.id, formData.sectionId, strictShopAvailability, formData.stand);
      
      // Enforce that a shop is resolved from section if we couldn't determine from cart
      if (!selectedShopId) {
        throw new Error('No shop is assigned to the selected section. Please choose a different section.');
      }
    } catch (e) {
      throw e;
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