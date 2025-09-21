// Client-side helper to request a push notification to be sent to a specific FCM token.
// IMPORTANT: Sending to FCM directly requires server credentials. This helper
// calls our server endpoint, which must use Firebase Admin SDK to actually
// deliver the notification.

export async function sendPushToFcmToken({
  fcmToken,
  title,
  body,
  data = {},
  icon = '/app_icon.png',
}) {
  if (!fcmToken || typeof fcmToken !== 'string') {
    throw new Error('Missing fcmToken');
  }

  const API_BASE = (process.env.REACT_APP_API_BASE && process.env.REACT_APP_API_BASE.trim())
    ? process.env.REACT_APP_API_BASE.trim()
    : (window.location.port === '3000' ? 'http://localhost:5001' : '');

  const payload = {
    token: fcmToken,
    notification: {
      title: title || 'Fans Munch',
      body: body || '',
      icon,
    },
    data: Object.fromEntries(Object.entries(data || {}).map(([k, v]) => [String(k), String(v)])),
  };

  const res = await fetch(`${API_BASE}/api/notify/fcm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch (_) {}

  if (!res.ok) {
    const msg = json?.error || text || 'Failed to send push';
    throw new Error(msg);
  }

  return json || { ok: true };
}

// Convenience wrapper for common order update notification
export async function sendOrderUpdateNotification({ fcmToken, orderId, status }) {
  return sendPushToFcmToken({
    fcmToken,
    title: 'Order Update',
    body: `Your order ${orderId || ''} status: ${status || ''}`.trim(),
    data: { type: 'ORDER_UPDATE', orderId: String(orderId || ''), status: String(status || '') },
  });
}
