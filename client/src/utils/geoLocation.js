/**
 * Geolocation helpers for nearest-venue selection.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Haversine distance between two coordinates in kilometers.
 */
export function distanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Normalize latitude/longitude from a stadium-like object.
 * Supports number fields or nested GeoPoint-like { latitude, longitude }.
 */
export function getStadiumCoords(stadium) {
  if (!stadium) return null;

  let lat = stadium.latitude;
  let lng = stadium.longitude;

  if ((lat == null || lng == null) && stadium.geo && typeof stadium.geo === 'object') {
    lat = stadium.geo.latitude ?? stadium.geo.lat;
    lng = stadium.geo.longitude ?? stadium.geo.lng;
  }

  if ((lat == null || lng == null) && stadium.coordinates && typeof stadium.coordinates === 'object') {
    lat = stadium.coordinates.latitude ?? stadium.coordinates.lat;
    lng = stadium.coordinates.longitude ?? stadium.coordinates.lng;
  }

  const latitude = typeof lat === 'number' ? lat : parseFloat(lat);
  const longitude = typeof lng === 'number' ? lng : parseFloat(lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  return { latitude, longitude };
}

/**
 * Request the user's current position.
 * @returns {Promise<{latitude:number, longitude:number}>}
 */
export function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported on this device'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        const message =
          err?.code === 1
            ? 'Location permission denied'
            : err?.code === 2
              ? 'Location unavailable'
              : err?.code === 3
                ? 'Location request timed out'
                : (err?.message || 'Failed to get location');
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
        ...options,
      }
    );
  });
}

/**
 * Find the nearest stadium to a user position.
 * @param {object[]} stadiums
 * @param {number} userLat
 * @param {number} userLng
 * @param {{ maxDistanceKm?: number }} [options] - If set, ignore venues farther than this.
 * @returns {{ stadium: object, distanceKm: number } | null}
 */
export function findNearestStadium(stadiums, userLat, userLng, options = {}) {
  if (!Array.isArray(stadiums) || stadiums.length === 0) return null;
  if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) return null;

  const maxDistanceKm = Number.isFinite(options.maxDistanceKm)
    ? options.maxDistanceKm
    : null;

  let best = null;

  stadiums.forEach((stadium) => {
    const coords = getStadiumCoords(stadium);
    if (!coords) return;
    const d = distanceKm(userLat, userLng, coords.latitude, coords.longitude);
    if (maxDistanceKm != null && d > maxDistanceKm) return;
    if (!best || d < best.distanceKm) {
      best = { stadium, distanceKm: d };
    }
  });

  return best;
}

/** Default max distance for auto-selecting a venue (km). */
export const NEAREST_VENUE_MAX_KM = 200;

/**
 * Format distance for UI.
 */
export function formatDistanceKm(km) {
  if (!Number.isFinite(km)) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
