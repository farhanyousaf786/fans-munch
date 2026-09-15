import stadiumRepository from '../repositories/stadiumRepository';
import { stadiumStorage } from './storage';

const BRANDING_KEYS = [
  'logoUrl',
  'bannerUrl',
  'color',
  'secondaryColor',
  'brandName',
  'name',
  'imageUrl',
];

/**
 * Merge latest stadium branding from Firestore into localStorage.
 * Keeps logo/banner/colors in sync after dashboard edits.
 */
export async function refreshSelectedStadiumFromFirestore() {
  const cached = stadiumStorage.getSelectedStadium();
  if (!cached?.id) return cached || null;

  try {
    const fresh = await stadiumRepository.getStadiumById(cached.id);
    if (!fresh) return cached;

    const merged = { ...cached, ...fresh.toMap() };
    const changed = BRANDING_KEYS.some((key) => cached[key] !== merged[key]);
    if (changed) {
      stadiumStorage.setSelectedStadium(merged);
    }
    return merged;
  } catch (error) {
    console.warn('[stadiumSync] Failed to refresh stadium branding:', error?.message || error);
    return cached;
  }
}

export default refreshSelectedStadiumFromFirestore;
