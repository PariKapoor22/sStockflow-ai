import { IncidentReport, MapTilePackage, SyncQueueItem, Waypoint, GPSPosition } from '../types';
import { INITIAL_MAP_PACKAGES, INITIAL_SYNC_ITEMS, DEFAULT_TACTICAL_WAYPOINTS, INITIAL_INCIDENT_REPORTS } from './mockData';

const KEYS = {
  SYNC_QUEUE: 'tactical_sync_queue_v1',
  MAP_PACKAGES: 'tactical_map_packages_v1',
  INCIDENTS: 'tactical_incidents_v1',
  WAYPOINTS: 'tactical_waypoints_v1',
  NETWORK_MODE: 'tactical_network_mode_v1',
  LAST_SYNC: 'tactical_last_sync_v1',
  TRACK_LOG: 'tactical_track_log_v1',
  UNIT_ID: 'tactical_unit_id_v1',
  DRIVER_NAME: 'tactical_driver_name_v1'
};

export const getStoredSyncQueue = (): SyncQueueItem[] => {
  try {
    const raw = localStorage.getItem(KEYS.SYNC_QUEUE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load sync queue', e);
  }
  return INITIAL_SYNC_ITEMS;
};

export const saveStoredSyncQueue = (items: SyncQueueItem[]): void => {
  try {
    localStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save sync queue', e);
  }
};

export const getStoredMapPackages = (): MapTilePackage[] => {
  try {
    const raw = localStorage.getItem(KEYS.MAP_PACKAGES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load map packages', e);
  }
  return INITIAL_MAP_PACKAGES;
};

export const saveStoredMapPackages = (packages: MapTilePackage[]): void => {
  try {
    localStorage.setItem(KEYS.MAP_PACKAGES, JSON.stringify(packages));
  } catch (e) {
    console.error('Failed to save map packages', e);
  }
};

export const getStoredIncidents = (): IncidentReport[] => {
  try {
    const raw = localStorage.getItem(KEYS.INCIDENTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load incidents', e);
  }
  return INITIAL_INCIDENT_REPORTS;
};

export const saveStoredIncidents = (incidents: IncidentReport[]): void => {
  try {
    localStorage.setItem(KEYS.INCIDENTS, JSON.stringify(incidents));
  } catch (e) {
    console.error('Failed to save incidents', e);
  }
};

export const getStoredWaypoints = (): Waypoint[] => {
  try {
    const raw = localStorage.getItem(KEYS.WAYPOINTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load waypoints', e);
  }
  return DEFAULT_TACTICAL_WAYPOINTS;
};

export const saveStoredWaypoints = (waypoints: Waypoint[]): void => {
  try {
    localStorage.setItem(KEYS.WAYPOINTS, JSON.stringify(waypoints));
  } catch (e) {
    console.error('Failed to save waypoints', e);
  }
};

export const getStoredTrackLog = (): GPSPosition[] => {
  try {
    const raw = localStorage.getItem(KEYS.TRACK_LOG);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load track log', e);
  }
  return [];
};

export const saveStoredTrackLog = (tracks: GPSPosition[]): void => {
  try {
    // Keep max 200 breadcrumbs
    const trimmed = tracks.slice(-200);
    localStorage.setItem(KEYS.TRACK_LOG, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save track log', e);
  }
};

export const getLastSyncTime = (): number => {
  const val = localStorage.getItem(KEYS.LAST_SYNC);
  return val ? parseInt(val, 10) : Date.now() - 7200000; // 2 hours ago default
};

export const setLastSyncTime = (timestamp: number): void => {
  localStorage.setItem(KEYS.LAST_SYNC, timestamp.toString());
};
