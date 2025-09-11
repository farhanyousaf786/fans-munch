// Handles Firebase order placement after a successful Apple Pay / Google Pay wallet payment
// Keep all complex logic out of the screen component

import { cartUtils } from '../../../utils/cartUtils';
import { userStorage, stadiumStorage } from '../../../utils/storage';
import orderRepository from '../../../repositories/orderRepository';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { Order } from '../../../models/Order';
import { sendNewOrderNotification } from '../../../utils/notificationUtils';

export async function placeOrderAfterWalletSuccess({
  formData,
  tipData,
  ticketImage,
  customerLocation,
  finalTotal,
}) {
  // Validate required fields
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

  // Recompute delivery fee from cart at payment time (2 ILS per item)
  const totalQty = Array.isArray(cartItems) ? cartItems.reduce((s, it) => s + (it.quantity || 0), 0) : 0;
  const fee = totalQty * 2;

  const totals = orderRepository.calculateOrderTotals(
    cartItems,
    fee, // deliveryFee in ILS
    tipData?.amount || 0,
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
      snap.forEach((docItem) => {
        const data = docItem.data() || {};
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
          if (d < best.dist) best = { id: data.id || docItem.id, dist: d };
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
      const docs = await Promise.all(candidateIds.map(id => getDoc(doc(db, 'shops', id))));
      shops = docs.filter(d => d.exists()).map(d => ({ id: d.id, data: d.data() }));
    } else {
      const snap = await getDocs(collection(db, 'shops'));
      shops = snap.docs.map(d => ({ id: d.id, data: d.data() }));
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
    tipPercentage: tipData?.percentage || 0,
    userData,
    seatInfo,
    stadiumId: stadiumData.id,
    shopId: nearestShopId || cartItems[0].shopId || '',
    customerLocation,
    location: null,
    deliveryUserId: nearestDeliveryUserId || null
  });

  const createdOrder = await orderRepository.createOrder(order);

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
    }
  }

  // Cleanup cart and tip storage
  cartUtils.clearCart();
  localStorage.removeItem('selectedTip');

  return createdOrder;
}
