import { GeoJSONPoint, GeoJSONFeature, GPSPosition, GPSQuality, IncidentReport, RouteIncidentMatch, RouteOption } from '../types';

/**
 * Converts GPS position coordinates to standard GeoJSON Point object
 */
export const toGeoJSONPoint = (
  latitude: number,
  longitude: number,
  altitude: number | null = null
): GeoJSONPoint => {
  return {
    type: 'Point',
    coordinates: altitude !== null 
      ? [Number(longitude.toFixed(6)), Number(latitude.toFixed(6)), Math.round(altitude)] 
      : [Number(longitude.toFixed(6)), Number(latitude.toFixed(6))]
  };
};

/**
 * Converts an IncidentReport to a GeoJSON Feature
 */
export const toGeoJSONFeature = (incident: IncidentReport): GeoJSONFeature => {
  return {
    type: 'Feature',
    geometry: incident.geo_json || toGeoJSONPoint(incident.latitude, incident.longitude, incident.altitude_meters),
    properties: {
      report_id: incident.report_id,
      id: incident.id,
      title: incident.title,
      category: incident.category,
      severity: incident.severity,
      district_road_segment: incident.district_road_segment,
      accuracy_meters: incident.accuracy_meters,
      observation_time: incident.observation_time,
      sync_stage: incident.sync_stage,
      reported_by: incident.reportedBy,
      photo_count: incident.photos.length
    }
  };
};

/**
 * Evaluates GPS Quality based on accuracy in meters
 */
export const evaluateGPSQuality = (accuracyMeters: number, isManual = false): GPSQuality => {
  if (isManual) return 'manual_pin';
  if (accuracyMeters <= 8) return 'high_precision';
  if (accuracyMeters <= 25) return 'standard';
  return 'degraded';
};

/**
 * Formats GPS coordinates into high-precision sub-meter representation (up to 6 decimal places)
 */
export const formatCoordinates = (lat: number, lng: number, decimals: number = 6): string => {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(decimals)}°${latDir}, ${Math.abs(lng).toFixed(decimals)}°${lngDir}`;
};

/**
 * Calculates accurate forward azimuth / bearing from Point A to Point B (0-360 degrees)
 */
export const calculateBearing = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { degrees: number; cardinal: string } => {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  let theta = Math.atan2(y, x);
  let deg = (theta * 180) / Math.PI;
  deg = (deg + 360) % 360;
  const roundedDeg = Math.round(deg);

  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((roundedDeg % 360) / 22.5) % 16;
  return {
    degrees: roundedDeg,
    cardinal: directions[index]
  };
};

/**
 * Converts Latitude & Longitude to Tactical MGRS / Military Grid representation
 */
export const toMGRS = (lat: number, lon: number): string => {
  // Determine UTM zone
  const zone = Math.floor((lon + 180) / 6) + 1;
  const bandLetters = 'CDEFGHJKLMNPQRSTUVWX';
  const latIndex = Math.min(Math.max(Math.floor((lat + 80) / 8), 0), bandLetters.length - 1);
  const band = bandLetters[latIndex] || 'R';

  // Compute 100km square identifiers based on zone & lat
  const colChar = String.fromCharCode(65 + ((zone * 3 + Math.floor(lon * 10)) % 8));
  const rowChar = String.fromCharCode(70 + (Math.floor(lat * 8) % 15));

  // 1-meter precision 5-digit easting / northing
  const eastingFrac = Math.abs(lon - Math.floor(lon));
  const northingFrac = Math.abs(lat - Math.floor(lat));
  const easting5 = Math.floor(eastingFrac * 100000).toString().padStart(5, '0');
  const northing5 = Math.floor(northingFrac * 100000).toString().padStart(5, '0');

  return `${zone}${band} ${colChar}${rowChar} ${easting5} ${northing5}`;
};

/**
 * Calculates micro-nudge on coordinates in meters (North/South, East/West)
 */
export const nudgeCoordinate = (
  lat: number,
  lng: number,
  deltaMetersNorth: number,
  deltaMetersEast: number
): { latitude: number; longitude: number } => {
  const earthRadius = 6378137; // WGS84 major axis in meters
  const dLat = (deltaMetersNorth / earthRadius) * (180 / Math.PI);
  const dLng =
    (deltaMetersEast / (earthRadius * Math.cos((lat * Math.PI) / 180))) *
    (180 / Math.PI);
  return {
    latitude: Number((lat + dLat).toFixed(6)),
    longitude: Number((lng + dLng).toFixed(6))
  };
};

/**
 * Haversine formula calculation for exact distance between two points in meters
 */
export const calculateDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

/**
 * Calculates Route Clearance and identifies any hazard incidents within corridor
 */
export const evaluateRouteHazards = (
  route: RouteOption | null,
  incidents: IncidentReport[]
): RouteIncidentMatch[] => {
  if (!route || !route.waypoints || route.waypoints.length === 0) return [];
  const matches: RouteIncidentMatch[] = [];

  incidents.forEach((inc) => {
    let minDistance = Infinity;
    let closestIdx = 0;

    route.waypoints.forEach((wp, idx) => {
      const dist = calculateDistanceMeters(inc.latitude, inc.longitude, wp[0], wp[1]);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });

    // Corridor buffer: 450m
    if (minDistance <= 450) {
      matches.push({
        incident: inc,
        distanceToRouteMeters: minDistance,
        closestWaypointIndex: closestIdx,
        hazardImpact: minDistance < 150 ? 'direct_blockage' : 'corridor_hazard'
      });
    }
  });

  return matches;
};
