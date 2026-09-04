// Real Device Location Service (Google Maps-Grade Geolocation & Geocoding)
import { GPSPosition, GPSQuality } from '../types';

export interface LocationPermissionState {
  state: 'granted' | 'prompt' | 'denied' | 'unsupported';
  message?: string;
}

export interface GeocodedAddress {
  displayName: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  state?: string;
  country?: string;
  postcode?: string;
}

// In-memory reverse geocode cache to avoid redundant network hits
const reverseGeocodeCache = new Map<string, string>();

/**
 * Check browser geolocation permission status
 */
export async function checkLocationPermission(): Promise<LocationPermissionState> {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    return { state: 'unsupported', message: 'Geolocation is not supported by your browser.' };
  }

  try {
    if ('permissions' in navigator && navigator.permissions.query) {
      const status = await navigator.permissions.query({ name: 'geolocation' });
      return { state: status.state };
    }
    return { state: 'prompt' };
  } catch {
    return { state: 'prompt' };
  }
}

/**
 * Acquire accurate current position with two-stage fallback:
 * Stage 1: High accuracy (GPS satellite / cellular assist)
 * Stage 2: Standard Wi-Fi / IP positioning if high accuracy times out (crucial for desktops/laptops)
 */
export async function getAccurateCurrentPosition(): Promise<GPSPosition> {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    throw new Error('Geolocation is not supported in this browser environment.');
  }

  // Attempt Stage 1: High Accuracy
  const tryHighAccuracy = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 9000,
        maximumAge: 0
      });
    });
  };

  // Attempt Stage 2: Standard Accuracy (Wi-Fi / Network positioning fallback)
  const tryStandardAccuracy = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 14000,
        maximumAge: 30000
      });
    });
  };

  let pos: GeolocationPosition;
  let usedFallback = false;

  try {
    pos = await tryHighAccuracy();
  } catch (err: any) {
    console.warn('High accuracy geolocation timed out or failed, falling back to network positioning:', err?.message);
    try {
      pos = await tryStandardAccuracy();
      usedFallback = true;
    } catch (fallbackErr: any) {
      let friendlyError = 'Unable to retrieve your location.';
      if (fallbackErr.code === 1) {
        friendlyError = 'Location permission was denied. Please allow location access in your browser settings.';
      } else if (fallbackErr.code === 2) {
        friendlyError = 'Position unavailable. GPS or network location could not be determined.';
      } else if (fallbackErr.code === 3) {
        friendlyError = 'Location request timed out. Please check your network connection and retry.';
      }
      throw new Error(friendlyError);
    }
  }

  const accuracy = Math.round(pos.coords.accuracy || (usedFallback ? 25 : 8));
  let quality: GPSQuality = 'high_precision';
  if (accuracy > 30) quality = 'standard';
  if (accuracy > 100) quality = 'degraded';

  return {
    latitude: Number(pos.coords.latitude.toFixed(6)),
    longitude: Number(pos.coords.longitude.toFixed(6)),
    altitude: pos.coords.altitude ? Math.round(pos.coords.altitude) : null,
    speed: pos.coords.speed !== null && pos.coords.speed > 0 ? Math.round(pos.coords.speed * 3.6) : null,
    heading: pos.coords.heading !== null && !isNaN(pos.coords.heading) ? Math.round(pos.coords.heading) : null,
    accuracy,
    timestamp: pos.timestamp || Date.now(),
    altitudeAccuracy: pos.coords.altitudeAccuracy ? Math.round(pos.coords.altitudeAccuracy) : null,
    quality,
    isManual: false
  };
}

/**
 * Start watching location continuously like Google Maps
 */
export function watchRealLocation(
  onSuccess: (pos: GPSPosition) => void,
  onError: (err: GeolocationPositionError) => void
): () => void {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const accuracy = Math.round(pos.coords.accuracy || 10);
      let quality: GPSQuality = 'high_precision';
      if (accuracy > 30) quality = 'standard';
      if (accuracy > 100) quality = 'degraded';

      const gpsPos: GPSPosition = {
        latitude: Number(pos.coords.latitude.toFixed(6)),
        longitude: Number(pos.coords.longitude.toFixed(6)),
        altitude: pos.coords.altitude ? Math.round(pos.coords.altitude) : null,
        speed: pos.coords.speed !== null && pos.coords.speed > 0 ? Math.round(pos.coords.speed * 3.6) : null,
        heading: pos.coords.heading !== null && !isNaN(pos.coords.heading) ? Math.round(pos.coords.heading) : null,
        accuracy,
        timestamp: pos.timestamp || Date.now(),
        altitudeAccuracy: pos.coords.altitudeAccuracy ? Math.round(pos.coords.altitudeAccuracy) : null,
        quality,
        isManual: false
      };
      onSuccess(gpsPos);
    },
    (err) => {
      onError(err);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 15000
    }
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}

/**
 * Reverse geocode latitude and longitude to a human-readable street or area address
 */
export async function reverseGeocodeLocation(lat: number, lng: number): Promise<string> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (reverseGeocodeCache.has(cacheKey)) {
    return reverseGeocodeCache.get(cacheKey)!;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TacticalFieldNavigation/1.0'
      }
    });

    if (!res.ok) {
      throw new Error(`Reverse geocode failed: ${res.status}`);
    }

    const data = await res.json();
    const addr = data.address || {};
    
    // Pick the most relevant name components
    const road = addr.road || addr.street || addr.highway || addr.pedestrian;
    const area = addr.suburb || addr.neighbourhood || addr.city_district || addr.quarter;
    const city = addr.city || addr.town || addr.village || addr.county;
    
    let label = '';
    if (road && area) {
      label = `${road}, ${area}`;
    } else if (road && city) {
      label = `${road}, ${city}`;
    } else if (data.name) {
      label = `${data.name}, ${city || area || ''}`.replace(/,\s*$/, '');
    } else if (data.display_name) {
      label = data.display_name.split(',').slice(0, 3).join(',').trim();
    } else {
      label = `${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E`;
    }

    reverseGeocodeCache.set(cacheKey, label);
    return label;
  } catch (err) {
    console.warn('Reverse geocoding error:', err);
    return `${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E`;
  }
}

/**
 * Search places by name/query via OpenStreetMap Nominatim
 */
export async function searchPlaces(
  query: string,
  userLat?: number,
  userLng?: number
): Promise<{ name: string; lat: number; lng: number; address: string }[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`;
    if (userLat && userLng) {
      url += `&viewbox=${userLng - 0.5},${userLat + 0.5},${userLng + 0.5},${userLat - 0.5}&bounded=0`;
    }

    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TacticalFieldNavigation/1.0'
      }
    });

    if (!res.ok) return [];
    const results = await res.json();

    return results.map((item: any) => ({
      name: item.name || item.display_name.split(',')[0],
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      address: item.display_name
    }));
  } catch (err) {
    console.warn('Place search failed:', err);
    return [];
  }
}
