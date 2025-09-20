// Handles Firebase order placement after a successful Apple Pay / Google Pay wallet payment
// Keep all complex logic out of the screen component

import { cartUtils } from '../../../utils/cartUtils';
import { userStorage, stadiumStorage } from '../../../utils/storage';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { sendNewOrderNotification } from '../../../utils/notificationUtils';
import { placeOrderAfterPayment } from './placeOrderCommon';

export async function placeOrderAfterWalletSuccess({
  formData,
  tipData,
  ticketImage,
  customerLocation,
  finalTotal,
}) {
  // Pre-compute data needed for optional delivery user notification
  const userData = userStorage.getUserData();
  const stadiumData = stadiumStorage.getSelectedStadium();
  const cartItems = cartUtils.getCartItems();

  // Recompute delivery fee from cart at payment time (2 ILS per item) for notification payload only
  const totalQty = Array.isArray(cartItems) ? cartItems.reduce((s, it) => s + (it.quantity || 0), 0) : 0;
  const fee = totalQty * 2;

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

  // Use common helper to create the order, enforcing strict shop availability like before
  const createdOrder = await placeOrderAfterPayment({
    formData,
    tipData,
    ticketImage,
    customerLocation,
    finalTotal,
    notifyDelivery: false,
    strictShopAvailability: true,
  });

  if (nearestDeliveryUserId) {
    try {
      const seatInfo = {
        row: formData.row,
        seatNo: formData.seatNo,
        section: formData.section,
        seatDetails: formData.seatDetails,
        area: formData.area,
        entrance: formData.entrance,
        stand: formData.stand,
      };
      await sendNewOrderNotification(nearestDeliveryUserId, {
        orderId: createdOrder.orderId,
        customerName: `${userData.firstName} ${userData.lastName}`.trim(),
        stadiumName: stadiumData.name || stadiumData.title || 'Stadium',
        seatInfo: seatInfo,
        totalAmount: finalTotal,
        deliveryFee: fee,
      });
    } catch (notificationError) {
      console.warn('⚠️ Error sending notification to delivery user:', notificationError);
    }
  }
  return createdOrder;
}
