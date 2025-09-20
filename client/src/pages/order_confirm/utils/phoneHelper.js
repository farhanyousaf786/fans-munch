// Utilities for handling customer phone display/edit/save during order confirmation
// Responsible for: fetching phone from customers collection, validating, normalizing,
// and saving it back ONLY if it was missing previously.

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';

export function normalizePhone(raw) {
  if (raw == null) return '';
  let s = String(raw).trim();
  // Allow user-friendly input: remove spaces, dashes, parentheses
  // Preserve a single leading + if present
  const hasPlus = s.startsWith('+');
  s = s.replace(/[^0-9]/g, '');
  if (hasPlus) s = `+${s}`;
  return s;
}

export function validatePhone(phone) {
  const s = normalizePhone(phone);
  if (!s) return false;
  // Count digits after an optional leading +
  const digits = s.startsWith('+') ? s.slice(1) : s;
  const len = digits.replace(/\D/g, '').length;
  return len >= 6 && len <= 16;
}

export async function fetchCustomerPhone(userId) {
  if (!userId) return { phone: '', exists: false };
  try {
    const ref = doc(db, 'customers', userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return { phone: '', exists: false };
    const data = snap.data() || {};
    const phone = normalizePhone(data.phone || data.userPhoneNo || '');
    return { phone, exists: true };
  } catch (e) {
    console.warn('[phoneHelper] fetchCustomerPhone error:', e);
    return { phone: '', exists: false };
  }
}

export async function saveCustomerPhoneIfMissing(userId, phone) {
  if (!userId) return { saved: false };
  const normalized = normalizePhone(phone);
  try {
    const ref = doc(db, 'customers', userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return { saved: false };
    const data = snap.data() || {};
    const existing = normalizePhone(data.phone || data.userPhoneNo || '');
    if (existing) {
      // Already has a phone, do NOT overwrite
      return { saved: false };
    }
    await updateDoc(ref, { phone: normalized });
    return { saved: true };
  } catch (e) {
    console.warn('[phoneHelper] saveCustomerPhoneIfMissing error:', e);
    return { saved: false };
  }
}
