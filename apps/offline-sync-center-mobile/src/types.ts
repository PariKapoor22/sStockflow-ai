export type AppTab = 
  | 'driver-home'
  | 'resilient-navigation'
  | 'incident-reporting'
  | 'emergency-sos'
  | 'offline-sync-center';

export type MapLayerType = 'google_hybrid' | 'google_terrain' | 'open_topo' | 'tactical_dark' | 'osm_standard';

export type GPSQuality = 'high_precision' | 'standard' | 'degraded' | 'denied' | 'manual_pin';

export interface GPSPosition {
  latitude: number;
  longitude: number;
  altitude: number | null;
  speed: number | null; // km/h
  heading: number | null; // degrees
  accuracy: number; // meters
  timestamp: number;
  altitudeAccuracy?: number | null;
  quality?: GPSQuality;
  isManual?: boolean;
}

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number, number?]; // [longitude, latitude, elevation?]
}

export interface GeoJSONFeature<G = GeoJSONPoint, P = Record<string, any>> {
  type: 'Feature';
  geometry: G;
  properties: P;
}

export interface Waypoint {
  id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  type: 'base' | 'checkpoint' | 'delivery' | 'medical' | 'hazard' | 'refuel';
  description: string;
  elevationMeters: number;
  status: 'active' | 'cleared' | 'blocked' | 'pending';
}

export interface NavigationStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  maneuver: string; // 'turn-left', 'turn-right', 'continue', 'roundabout', 'arrive', etc.
  roadName: string;
  location: [number, number]; // [lat, lng]
}

export interface RouteOption {
  id: string;
  name: string;
  destination: string;
  distanceKm: number;
  estMinutes: number;
  elevationGainM: number;
  hazardCount: number;
  isOfflineCached: boolean;
  waypoints: [number, number][]; // lat, lng pairs strictly along roads
  callsign?: string;
  roadSegment?: string;
  steps?: NavigationStep[];
  isRealRoadRoute?: boolean;
  summary?: string;
  primaryRoad?: string;
}

export type IncidentCategory = 
  | 'landslide' 
  | 'roadblock' 
  | 'vehicle_breakdown' 
  | 'weather_hazard' 
  | 'medical_emergency' 
  | 'bridge_damage'
  | 'hostile_contact';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export type SyncStatusStage = 
  | 'LOCAL_ONLY' 
  | 'QUEUED' 
  | 'UPLOADING_PHOTOS' 
  | 'SUBMITTING' 
  | 'SYNCED' 
  | 'CONFLICT' 
  | 'FAILED';

export interface PhotoAttachment {
  id: string;
  report_id: string;
  name: string;
  dataUrl?: string; // base64 preview
  blob?: Blob;
  sizeBytes: number;
  originalSizeBytes: number;
  mimeType: string;
  isCompressed: boolean;
  compressionRatio: number;
  isUploaded: boolean;
  remoteUrl?: string;
  timestamp: number;
}

export interface ServerIncidentRevision {
  report_id: string;
  revision: number;
  title: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  description: string;
  district_road_segment: string;
  latitude: number;
  longitude: number;
  photos_count: number;
  updated_at: number;
  updated_by: string;
}

export interface IncidentReport {
  id: string; // display ID (e.g. IR-402)
  report_id: string; // stable UUID v4
  idempotency_key: string; // unique UUID for idempotent submissions
  tenant_id: string; // tenant segregation identifier e.g. "tactical-unit-07"
  revision: number; // revision number controlled by server
  
  title: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  district_road_segment: string;
  description: string;
  observation_time: string; // ISO 8601 string
  
  latitude: number;
  longitude: number;
  accuracy_meters: number;
  altitude_meters: number;
  gps_status: GPSQuality;
  geo_json: GeoJSONPoint;
  locationName: string;
  
  reportedBy: string;
  photos: string[]; // preview URLs or thumbnail dataURLs
  photo_attachments: PhotoAttachment[];
  
  timestamp: number;
  syncStatus: 'synced' | 'pending' | 'syncing' | 'failed';
  sync_stage: SyncStatusStage;
  sync_error?: string;
  retry_count: number;
  last_sync_attempt?: number;
  
  server_version?: ServerIncidentRevision; // populates on 409 CONFLICT
}

export interface RouteIncidentMatch {
  incident: IncidentReport;
  distanceToRouteMeters: number;
  closestWaypointIndex: number;
  hazardImpact: 'direct_blockage' | 'corridor_hazard';
}

export interface SyncQueueItem {
  id: string;
  report_id: string;
  idempotency_key: string;
  type: 'incident' | 'delivery' | 'photos' | 'telemetry' | 'checkpoint_checkin';
  title: string;
  subtitle: string;
  sizeBytes: number;
  timestamp: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  sync_stage: SyncStatusStage;
  icon: string;
  color: string;
  retryCount: number;
  nextRetryTimestamp?: number;
  error_message?: string;
  payload?: any;
}

export interface MapTilePackage {
  id: string;
  name: string;
  sectorCode: string;
  region: string;
  sizeFormatted: string;
  sizeBytes: number;
  version: string;
  status: 'downloaded' | 'downloading' | 'available' | 'update_available';
  downloadProgress: number; // 0-100
  imageUrl: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  tileCount: number;
}

export interface SOSEvent {
  id: string;
  activatedAt: number;
  driverName: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  altitude: number;
  medicalAssistanceNeeded: boolean;
  vehicleDisabled: boolean;
  underThreat: boolean;
  status: 'broadcasting' | 'acknowledged' | 'dispatched' | 'cancelled';
  satelliteBurstTransmitted: boolean;
}
