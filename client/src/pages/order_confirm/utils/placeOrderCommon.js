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
// - Gallery stand: picks last shop ID (gallery shop)
// - Main stand: picks first shop ID (main shop)
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
    
    // Choose shop based on stand selection
    let selectedShopId;
    if (stand === 'Gallery') {
      // Gallery stand: use last shop ID (gallery shop)
      selectedShopId = shops[shops.length - 1];
      console.log(`🏟️ [SHOP SELECTION] Gallery stand selected - using last shop: ${selectedShopId}`);
    } else {
      // Main stand (or any other): use first shop ID (main shop)
      selectedShopId = shops[0];
      console.log(`🏟️ [SHOP SELECTION] Main stand selected - using first shop: ${selectedShopId}`);
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
  // Minimal validation
  if (!formData?.row || !String(formData.row).trim()) {
    throw new Error('Row number is required');
  }
  if (!formData?.seatNo || !String(formData.seatNo).trim()) {
    throw new Error('Seat number is required');
  }

  const userData = userStorage.getUserData();
  const userDataWithPhone = { ...userData, phone: customerPhone || userData?.phone };
  const stadiumData = stadiumStorage.getSelectedStadium();
  const cartItems = cartUtils.getCartItems();

  if (!userData) throw new Error('User data not found. Please log in again.');
  if (!stadiumData) throw new Error('Stadium data not found. Please select a stadium.');
  if (!cartItems || cartItems.length === 0) throw new Error('Cart is empty. Please add items to cart.');

  console.log('🔍 [PLACE ORDER] formData received:', formData);
  
  const seatInfo = {
    row: formData.row,
    seatNo: formData.seatNo,
    section: formData.section,
    sectionId: formData.sectionId,
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

  // Resolve shop from the selected section based on stand selection
  let selectedShopId = null;
  try {
    selectedShopId = await resolveShopFromSection(stadiumData.id, formData.sectionId, strictShopAvailability, formData.stand);
  } catch (e) {
    throw e;
  }

  // Enforce that a shop is resolved from section; do not fallback to cart shops
  if (!selectedShopId) {
    throw new Error('No shop is assigned to the selected section. Please choose a different section.');
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