// Unified order placement helper for both card and wallet payment flows
// Handles: minimal validation, totals, nearest shop resolution, order creation,
// optional delivery notification, cart/tip cleanup.

import { cartUtils } from '../../../utils/cartUtils';
import { userStorage, stadiumStorage } from '../../../utils/storage';
import orderRepository from '../../../repositories/orderRepository';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { Order } from '../../../models/Order';
import { sendNewOrderNotification } from '../../../utils/notificationUtils';

function toRad(x) { return (x * Math.PI) / 180; }
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function parseNum(v) {
  return (typeof v === 'number') ? v : (typeof v === 'string' ? Number(v.replace(/[^0-9+\-.]/g, '')) : NaN);
}

async function resolveNearestAvailableShop(stadiumId, customerLocation, strictShopAvailability) {
  // Query shops where shopAvailability == true and (if possible) stadiumId == current stadium
  let shopSnap;
  try {
    if (stadiumId) {
      const q = query(
        collection(db, 'shops'),
        where('shopAvailability', '==', true),
        where('stadiumId', '==', stadiumId)
      );
      shopSnap = await getDocs(q);
    }
  } catch (_) {}

  if (!shopSnap) {
    // Fallback to availability only
    const qAvail = query(collection(db, 'shops'), where('shopAvailability', '==', true));
    shopSnap = await getDocs(qAvail);
  }

  const shops = shopSnap.docs.map(d => ({ id: d.id, data: d.data() }));

  if (shops.length === 0) {
    if (strictShopAvailability) {
      throw new Error('Shops are closed today. Please try again later.');
    } else {
      return null; // let caller fallback to cart shop
    }
  }

  let bestShop = { id: null, dist: Number.POSITIVE_INFINITY };
  shops.forEach((entry) => {
    const s = entry.data || {};
    let lat, lng;
    if (s.latitude != null && s.longitude != null) {
      lat = parseNum(s.latitude);
      lng = parseNum(s.longitude);
    } else if (s.location && typeof s.location.latitude === 'number' && typeof s.location.longitude === 'number') {
      lat = s.location.latitude; lng = s.location.longitude;
    } else if (Array.isArray(s.location) && s.location.length === 2) {
      lat = parseNum(s.location[0]); lng = parseNum(s.location[1]);
    }

    if (typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)) {
      if (customerLocation) {
        const d = haversine(customerLocation.latitude, customerLocation.longitude, lat, lng);
        if (d < bestShop.dist) bestShop = { id: entry.id, dist: d };
      } else if (!bestShop.id) {
        bestShop = { id: entry.id, dist: 0 };
      }
    }
  });

  let nearestShopId = bestShop.id;
  if (!nearestShopId && shops.length > 0) {
    nearestShopId = shops[0].id;
  }
  return nearestShopId;
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
}) {
  // Minimal validation
  if (!formData?.row || !String(formData.row).trim()) {
    throw new Error('Row number is required');
  }
  if (!formData?.seatNo || !String(formData.seatNo).trim()) {
    throw new Error('Seat number is required');
  }

  const userData = userStorage.getUserData();
  const stadiumData = stadiumStorage.getSelectedStadium();
  const cartItems = cartUtils.getCartItems();

  if (!userData) throw new Error('User data not found. Please log in again.');
  if (!stadiumData) throw new Error('Stadium data not found. Please select a stadium.');
  if (!cartItems || cartItems.length === 0) throw new Error('Cart is empty. Please add items to cart.');

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

  // Recompute delivery fee from cart (2 ILS per item)
  const totalQty = Array.isArray(cartItems) ? cartItems.reduce((s, it) => s + (it.quantity || 0), 0) : 0;
  const fee = totalQty * 2;

  const totals = orderRepository.calculateOrderTotals(
    cartItems,
    fee,
    tipData?.amount || 0,
    0
  );

  // Resolve nearest available shop
  let nearestShopId = null;
  try {
    nearestShopId = await resolveNearestAvailableShop(stadiumData.id, customerLocation, strictShopAvailability);
  } catch (e) {
    // If strict and no shops, rethrow
    throw e;
  }

  // Fallback to a shop from cart when not strict
  if (!nearestShopId && cartItems.length > 0) {
    nearestShopId = (cartItems.find(it => it.shopId)?.shopId) ||
                    (cartItems.find(it => Array.isArray(it.shopIds) && it.shopIds.length > 0)?.shopIds[0]) ||
                    '';
  }

  const order = Order.createFromCart({
    cartItems,
    subtotal: totals.subtotal,
    deliveryFee: totals.deliveryFee,
    discount: totals.discount,
    tipAmount: totals.tipAmount,
    tipPercentage: tipData?.percentage || 0,
    userData,
    seatInfo,
    stadiumId: stadiumData.id,
    shopId: nearestShopId || '',
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