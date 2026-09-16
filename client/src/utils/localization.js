/**
 * Resolve localized name/description from Firestore maps.
 */
export function getLocalizedText(valueOrMap, lang = 'en', fallback = '') {
  if (!valueOrMap) return fallback;
  if (typeof valueOrMap === 'string') return valueOrMap.trim() ? valueOrMap : fallback;
  if (typeof valueOrMap === 'object') {
    const pick = (...keys) => {
      for (const key of keys) {
        const value = valueOrMap[key];
        if (typeof value === 'string' && value.trim()) return value;
      }
      return null;
    };
    return (
      pick(lang, lang === 'he' ? 'en' : 'he', 'en', 'he') ||
      Object.values(valueOrMap).find((v) => typeof v === 'string' && v.trim()) ||
      fallback
    );
  }
  return fallback;
}

export function getLocalizedName(entity, lang = 'en', fallback = '') {
  if (!entity) return fallback;
  return getLocalizedText(entity.nameMap, lang, entity.name || fallback);
}

export function getLocalizedDescription(entity, lang = 'en', fallback = '') {
  if (!entity) return fallback;
  return getLocalizedText(entity.descriptionMap, lang, entity.description || fallback);
}

const PLACEHOLDERS = [
  (typeof process !== 'undefined' && process.env?.PUBLIC_URL ? process.env.PUBLIC_URL : '') + '/assets/images/on-boarding-1.png',
  (typeof process !== 'undefined' && process.env?.PUBLIC_URL ? process.env.PUBLIC_URL : '') + '/assets/images/on-boarding-2.png',
  (typeof process !== 'undefined' && process.env?.PUBLIC_URL ? process.env.PUBLIC_URL : '') + '/assets/images/on-boarding-3.png',
];

export function getFoodImageUrl(food, comboItems = null) {
  if (!food) return PLACEHOLDERS[0];

  if (Array.isArray(food.images) && food.images.length > 0 && food.images[0]) {
    return food.images[0];
  }

  if (food.isCombo && Array.isArray(comboItems) && comboItems.length > 0) {
    for (const item of comboItems) {
      const img = item?.images?.[0] || item?.image;
      if (img) return img;
    }
  }

  if (food.image) return food.image;
  if (food.imageUrl) return food.imageUrl;

  const key = String(food.id || food.name || 'food');
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash |= 0;
  }
  return PLACEHOLDERS[Math.abs(hash) % PLACEHOLDERS.length];
}

export default {
  getLocalizedText,
  getLocalizedName,
  getLocalizedDescription,
  getFoodImageUrl,
};
