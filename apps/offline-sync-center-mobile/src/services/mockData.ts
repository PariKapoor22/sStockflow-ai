import { MapTilePackage, SyncQueueItem, Waypoint, IncidentReport, RouteOption } from '../types';

export const INITIAL_MAP_PACKAGES: MapTilePackage[] = [
  {
    id: 'tile-tawang',
    name: 'Tawang Sector',
    sectorCode: 'SEC-TW-01',
    region: 'Arunachal Pradesh',
    sizeFormatted: '1.2 GB',
    sizeBytes: 1288490188,
    version: 'v2.1',
    status: 'downloaded',
    downloadProgress: 100,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCJ6cbAjDwfHzUjYjuaOv-DXYpZOesm8FhoTooL_3qBdYEqOAs2hkR8vP7x7SvjCYSJxwxP9JiBVHH_HIOjSJgb1jLqH1pyGhCeLLEa3Kh8WwllM7SpkJmKH_ohP6vVAlhVmr6ygvAr0m3Eg1uU6n1ycUQB7iiakAlZVi3lnV5s7huxNNxRGXLRg44o4uuDAmgTbgCOG9RxBvr35pDmEVA3MjpyRtBJCvylG2tsfrzcxlUDliSfSFf-',
    bounds: { north: 27.8, south: 27.4, east: 92.1, west: 91.7 },
    tileCount: 4200
  },
  {
    id: 'tile-kohima',
    name: 'Kohima Ridge',
    sectorCode: 'SEC-KH-04',
    region: 'Nagaland',
    sizeFormatted: '850 MB',
    sizeBytes: 891289600,
    version: 'v1.8',
    status: 'downloading',
    downloadProgress: 45,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCR66cFhdYWXqVw54DJBIojH81s6m797lUj6pwQyIe71-AvOcqTRIp4d1MqvIcL5AjHNPrthu-gdnvFLVZ348Gp7Jab3zYIEjLBvTBTA121JUKvwnqDM6oguuG-Cz3e9IZWRzKWdGcYxpC2CIMrvc3IDi7bP43EboFvRyzMSiw2CKmpZ7GibjFj2WzvxSxN_b_RUe0q7RDxE7mB_Gy_MxMNRNI4fZ371U-oxHJ5QPPeRJyJOhH_0ul',
    bounds: { north: 25.8, south: 25.5, east: 94.3, west: 93.9 },
    tileCount: 2950
  },
  {
    id: 'tile-ladakh',
    name: 'Ladakh High-Pass',
    sectorCode: 'SEC-LD-09',
    region: 'Changthang Valley',
    sizeFormatted: '1.6 GB',
    sizeBytes: 1717986918,
    version: 'v3.0',
    status: 'available',
    downloadProgress: 0,
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    bounds: { north: 34.4, south: 33.8, east: 78.2, west: 77.2 },
    tileCount: 5600
  },
  {
    id: 'tile-siachen',
    name: 'Siachen Logistics Corridor',
    sectorCode: 'SEC-SC-12',
    region: 'Northern Glaciers',
    sizeFormatted: '920 MB',
    sizeBytes: 964689920,
    version: 'v2.4',
    status: 'update_available',
    downloadProgress: 0,
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80',
    bounds: { north: 35.6, south: 35.1, east: 77.4, west: 76.8 },
    tileCount: 3100
  }
];

export const INITIAL_SYNC_ITEMS: SyncQueueItem[] = [
  {
    id: 'sync-1',
    report_id: 'IR-992',
    idempotency_key: 'idemp_init_992',
    type: 'incident',
    title: 'Incident Report: IR-992',
    subtitle: 'Pending Upload',
    sizeBytes: 420000,
    timestamp: Date.now() - 1000 * 60 * 25,
    status: 'pending',
    sync_stage: 'QUEUED',
    icon: 'assignment_late',
    color: '#fbbb45',
    retryCount: 0,
    payload: {
      category: 'landslide',
      severity: 'high',
      location: 'Mountain Pass Mile 42'
    }
  },
  {
    id: 'sync-2',
    report_id: 'DLV-SEC4-88',
    idempotency_key: 'idemp_init_dlv88',
    type: 'delivery',
    title: 'Delivery: Sector 4 Alpha',
    subtitle: 'Pending Upload',
    sizeBytes: 154000,
    timestamp: Date.now() - 1000 * 60 * 45,
    status: 'pending',
    sync_stage: 'QUEUED',
    icon: 'local_shipping',
    color: '#4ae183',
    retryCount: 1,
    payload: {
      manifestId: 'MN-SEC4-88',
      recipient: 'Station Commander Roy'
    }
  },
  {
    id: 'sync-3',
    report_id: 'SRV-2026-B',
    idempotency_key: 'idemp_init_srv_b',
    type: 'photos',
    title: 'Site Survey Photos',
    subtitle: '12 Items Queued',
    sizeBytes: 8420000,
    timestamp: Date.now() - 1000 * 60 * 75,
    status: 'pending',
    sync_stage: 'QUEUED',
    icon: 'photo_camera',
    color: '#a0caff',
    retryCount: 0,
    payload: {
      photoCount: 12,
      surveyId: 'SRV-2026-B'
    }
  }
];

export const DEFAULT_TACTICAL_WAYPOINTS: Waypoint[] = [
  {
    id: 'wp-hq',
    name: 'Tactical Command Hub (Echo-1)',
    code: 'BASE-E1',
    latitude: 27.586142,
    longitude: 91.867215,
    type: 'base',
    description: 'Primary communications relay and tactical refueling base.',
    elevationMeters: 3048,
    status: 'active'
  },
  {
    id: 'wp-cp1',
    name: 'Checkpoint Bravery (NH-13 Km 38)',
    code: 'CP-BRV',
    latitude: 27.594528,
    longitude: 91.879541,
    type: 'checkpoint',
    description: 'Fortified security post with satellite uplink terminal and weather radar.',
    elevationMeters: 3210,
    status: 'active'
  },
  {
    id: 'wp-dest',
    name: 'Sector 4 Alpha Outpost',
    code: 'OUT-4A',
    latitude: 27.608025,
    longitude: 91.895048,
    type: 'delivery',
    description: 'Primary forward supply delivery destination at Sela Pass spur.',
    elevationMeters: 3450,
    status: 'pending'
  },
  {
    id: 'wp-med',
    name: 'Forward Evac Station Red',
    code: 'MED-EVAC',
    latitude: 27.579032,
    longitude: 91.854018,
    type: 'medical',
    description: 'Emergency trauma stabilization point & high-altitude helipad.',
    elevationMeters: 2980,
    status: 'active'
  },
  {
    id: 'wp-hz1',
    name: 'Sela Ridge Landslide Hazard',
    code: 'HAZ-SL1',
    latitude: 27.601245,
    longitude: 91.886032,
    type: 'hazard',
    description: 'Active debris flow reported. Reduced speed & single-lane clearance.',
    elevationMeters: 3340,
    status: 'blocked'
  }
];

export const INITIAL_INCIDENT_REPORTS: IncidentReport[] = [
  {
    id: 'IR-992',
    report_id: 'ir_init_992',
    idempotency_key: 'idemp_key_ir_992',
    tenant_id: 'tactical-unit-07',
    revision: 1,
    title: 'Rockfall & Mud Obstruction',
    category: 'landslide',
    severity: 'high',
    district_road_segment: 'Sela Ridge Pass Kilometer 42 (NH-13)',
    description: 'Heavy shale boulders and mud obstructing eastbound convoy lane at kilometer marker 42. Bulldozer clearing requested.',
    observation_time: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    latitude: 27.601245,
    longitude: 91.886032,
    accuracy_meters: 4.2,
    altitude_meters: 3340,
    gps_status: 'high_precision',
    geo_json: {
      type: 'Point',
      coordinates: [91.886032, 27.601245, 3340]
    },
    locationName: 'Sela Ridge Pass Kilometer 42',
    timestamp: Date.now() - 1000 * 60 * 25,
    reportedBy: 'Driver J. Vance (Unit-07)',
    photos: [
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80'
    ],
    photo_attachments: [],
    syncStatus: 'pending',
    sync_stage: 'QUEUED',
    retry_count: 0
  },
  {
    id: 'IR-988',
    report_id: 'ir_init_988',
    idempotency_key: 'idemp_key_ir_988',
    tenant_id: 'tactical-unit-07',
    revision: 1,
    title: 'Bridge Expansion Joint Gap',
    category: 'bridge_damage',
    severity: 'medium',
    district_road_segment: 'Valley Creek Culvert #14',
    description: 'Heavy frost caused structural joint displacement on culvert 14. Passable by 4x4 high-clearance only.',
    observation_time: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    latitude: 27.591024,
    longitude: 91.871035,
    accuracy_meters: 5.1,
    altitude_meters: 3120,
    gps_status: 'high_precision',
    geo_json: {
      type: 'Point',
      coordinates: [91.871035, 27.591024, 3120]
    },
    locationName: 'Valley Creek Culvert #14',
    timestamp: Date.now() - 1000 * 60 * 180,
    reportedBy: 'Driver J. Vance (Unit-07)',
    photos: [],
    photo_attachments: [],
    syncStatus: 'synced',
    sync_stage: 'SYNCED',
    retry_count: 0
  }
];

export const TACTICAL_ROUTES: RouteOption[] = [
  {
    id: 'route-alpha',
    name: 'Primary Ridge Corridor (Standard NH-13)',
    destination: 'Sector 4 Alpha Outpost',
    callsign: 'CONVOY-ECHO',
    roadSegment: 'NH-13 Ridge Pass',
    distanceKm: 8.4,
    estMinutes: 24,
    elevationGainM: 402,
    hazardCount: 1,
    isOfflineCached: true,
    steps: [
      {
        instruction: 'Head northeast on NH-13 Ridge Pass toward Checkpoint Bravo',
        distanceMeters: 1200,
        durationSeconds: 210,
        maneuver: 'depart',
        roadName: 'NH-13 Ridge Pass',
        location: [27.586142, 91.867215]
      },
      {
        instruction: 'In 600m, keep right at the Valley Junction toward Sela Ridge',
        distanceMeters: 1800,
        durationSeconds: 320,
        maneuver: 'fork-right',
        roadName: 'Sela Ridge Road',
        location: [27.591210, 91.874980]
      },
      {
        instruction: 'Caution: Pass Mile Marker 42 rockfall caution zone carefully',
        distanceMeters: 2200,
        durationSeconds: 410,
        maneuver: 'straight',
        roadName: 'High Ridge Corridor',
        location: [27.596810, 91.881220]
      },
      {
        instruction: 'Turn slight left toward Forward Outpost Alpha access gate',
        distanceMeters: 1600,
        durationSeconds: 280,
        maneuver: 'turn-left',
        roadName: 'Alpha Access Way',
        location: [27.604010, 91.889020]
      },
      {
        instruction: 'Arrive at Sector 4 Alpha Outpost command perimeter',
        distanceMeters: 1600,
        durationSeconds: 220,
        maneuver: 'arrive',
        roadName: 'Sector 4 Alpha Base',
        location: [27.608025, 91.895048]
      }
    ],
    waypoints: [
      [27.586142, 91.867215],
      [27.587820, 91.869340],
      [27.589540, 91.872050],
      [27.591210, 91.874980],
      [27.592860, 91.877240],
      [27.594528, 91.879541],
      [27.596810, 91.881220],
      [27.599040, 91.883010],
      [27.601245, 91.886032],
      [27.602890, 91.887550],
      [27.604010, 91.889020],
      [27.606120, 91.892180],
      [27.608025, 91.895048]
    ]
  },
  {
    id: 'route-bravo',
    name: 'Valley Bypass (Hazard Avoidance)',
    destination: 'Sector 4 Alpha Outpost',
    callsign: 'CONVOY-BRAVO',
    roadSegment: 'Lower Valley Sector 4 Connector',
    distanceKm: 12.1,
    estMinutes: 32,
    elevationGainM: 280,
    hazardCount: 0,
    isOfflineCached: true,
    steps: [
      {
        instruction: 'Depart base heading south along Lower Valley Creek Road',
        distanceMeters: 2100,
        durationSeconds: 360,
        maneuver: 'depart',
        roadName: 'Lower Valley Creek Road',
        location: [27.586142, 91.867215]
      },
      {
        instruction: 'Turn sharp left onto Lower Valley Connector Bypass',
        distanceMeters: 3400,
        durationSeconds: 540,
        maneuver: 'turn-left',
        roadName: 'Lower Valley Bypass',
        location: [27.582020, 91.871030]
      },
      {
        instruction: 'Continue straight along Riverbed Embankment for 3.2 km',
        distanceMeters: 3800,
        durationSeconds: 580,
        maneuver: 'straight',
        roadName: 'Riverbed Embankment',
        location: [27.587040, 91.882040]
      },
      {
        instruction: 'Turn slight right ascending North Spur toward Sector 4 Gate',
        distanceMeters: 2800,
        durationSeconds: 440,
        maneuver: 'turn-right',
        roadName: 'North Spur Ascent',
        location: [27.596040, 91.892010]
      },
      {
        instruction: 'Arrive at Sector 4 Alpha Outpost main entrance',
        distanceMeters: 0,
        durationSeconds: 0,
        maneuver: 'arrive',
        roadName: 'Sector 4 Alpha Base',
        location: [27.608025, 91.895048]
      }
    ],
    waypoints: [
      [27.586142, 91.867215],
      [27.584110, 91.868840],
      [27.582020, 91.871030],
      [27.583450, 91.875220],
      [27.585120, 91.878950],
      [27.587040, 91.882040],
      [27.590120, 91.885620],
      [27.593250, 91.888940],
      [27.596040, 91.892010],
      [27.601850, 91.893820],
      [27.608025, 91.895048]
    ]
  }
];
