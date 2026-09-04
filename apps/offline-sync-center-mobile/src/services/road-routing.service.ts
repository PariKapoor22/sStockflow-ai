// Road Routing Service (Google Maps-Grade Road Network Routing)
// Computes real drivable routes strictly adhering to available road networks, street turns, and highways.
import { RouteOption, NavigationStep } from '../types';

interface OSRMStep {
  distance: number;
  duration: number;
  geometry: {
    coordinates: [number, number][];
  };
  name: string;
  maneuver: {
    type: string;
    modifier?: string;
    location: [number, number]; // [lng, lat]
  };
}

interface OSRMRoute {
  distance: number; // meters
  duration: number; // seconds
  geometry: {
    coordinates: [number, number][]; // [lng, lat]
  };
  legs: {
    distance: number;
    duration: number;
    steps: OSRMStep[];
    summary: string;
  }[];
}

interface OSRMResponse {
  code: string;
  routes: OSRMRoute[];
}

/**
 * Format maneuver to friendly Google Maps style instruction
 */
function buildManeuverInstruction(step: OSRMStep): { instruction: string; maneuverType: string } {
  const road = step.name ? step.name.trim() : '';
  const type = step.maneuver.type;
  const modifier = step.maneuver.modifier || '';

  let instruction = '';
  let maneuverType = 'straight';

  if (type === 'depart') {
    instruction = road ? `Head out onto ${road}` : 'Head out';
    maneuverType = 'depart';
  } else if (type === 'arrive') {
    instruction = 'Arrive at your destination';
    maneuverType = 'arrive';
  } else if (type === 'turn') {
    if (modifier.includes('left')) {
      instruction = modifier.includes('slight') 
        ? `Slight left onto ${road || 'road'}` 
        : modifier.includes('sharp')
        ? `Sharp left onto ${road || 'road'}`
        : `Turn left onto ${road || 'road'}`;
      maneuverType = 'turn-left';
    } else if (modifier.includes('right')) {
      instruction = modifier.includes('slight')
        ? `Slight right onto ${road || 'road'}`
        : modifier.includes('sharp')
        ? `Sharp right onto ${road || 'road'}`
        : `Turn right onto ${road || 'road'}`;
      maneuverType = 'turn-right';
    } else {
      instruction = `Turn onto ${road || 'road'}`;
      maneuverType = 'turn';
    }
  } else if (type === 'new name' || type === 'continue') {
    instruction = road ? `Continue straight on ${road}` : 'Continue straight';
    maneuverType = 'straight';
  } else if (type === 'roundabout' || type === 'rotary') {
    instruction = `Enter roundabout and take exit onto ${road || 'road'}`;
    maneuverType = 'roundabout';
  } else if (type === 'merge') {
    instruction = `Merge onto ${road || 'highway'}`;
    maneuverType = 'merge';
  } else if (type === 'fork') {
    instruction = modifier.includes('left') ? `Keep left at the fork` : `Keep right at the fork`;
    maneuverType = modifier.includes('left') ? 'fork-left' : 'fork-right';
  } else if (type === 'on ramp') {
    instruction = `Take ramp onto ${road || 'highway'}`;
    maneuverType = 'ramp';
  } else if (type === 'off ramp') {
    instruction = `Take exit onto ${road || 'road'}`;
    maneuverType = 'exit';
  } else {
    instruction = road ? `Proceed on ${road}` : 'Continue along available road';
    maneuverType = 'straight';
  }

  return { instruction, maneuverType };
}

/**
 * Fetch real drivable road route from origin to destination via OSRM
 */
export async function calculateRoadRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  destinationTitle?: string
): Promise<RouteOption[]> {
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true&alternatives=true&annotations=false`;

  try {
    const res = await fetch(osrmUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`OSRM routing server responded with status: ${res.status}`);
    }

    const data: OSRMResponse = await res.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No drivable road route found between these locations.');
    }

    const routes: RouteOption[] = data.routes.map((osrmRoute, index) => {
      // Convert OSRM [longitude, latitude] coordinates to Leaflet [latitude, longitude]
      const waypoints: [number, number][] = osrmRoute.geometry.coordinates.map(
        ([lng, lat]) => [Number(lat.toFixed(6)), Number(lng.toFixed(6))]
      );

      const distanceKm = Number((osrmRoute.distance / 1000).toFixed(1));
      const estMinutes = Math.max(1, Math.round(osrmRoute.duration / 60));

      // Extract road steps
      const steps: NavigationStep[] = [];
      const primaryRoadNames: string[] = [];

      if (osrmRoute.legs && osrmRoute.legs[0] && osrmRoute.legs[0].steps) {
        osrmRoute.legs[0].steps.forEach((step) => {
          const { instruction, maneuverType } = buildManeuverInstruction(step);
          if (step.name && step.name.trim() && !primaryRoadNames.includes(step.name.trim())) {
            primaryRoadNames.push(step.name.trim());
          }

          steps.push({
            instruction,
            distanceMeters: Math.round(step.distance),
            durationSeconds: Math.round(step.duration),
            maneuver: maneuverType,
            roadName: step.name || 'Local Road',
            location: [Number(step.maneuver.location[1].toFixed(6)), Number(step.maneuver.location[0].toFixed(6))]
          });
        });
      }

      const mainRoad = primaryRoadNames.length > 0 ? primaryRoadNames[0] : 'Available Road Network';
      const summaryText = primaryRoadNames.length > 1 
        ? `via ${primaryRoadNames.slice(0, 2).join(' & ')}` 
        : `via ${mainRoad}`;

      const routeName = index === 0 
        ? `Fastest Road Route (${summaryText})` 
        : `Alternative Road Route ${index} (${summaryText})`;

      return {
        id: `road-route-${index + 1}-${Date.now()}`,
        name: routeName,
        destination: destinationTitle || 'Target Destination',
        distanceKm,
        estMinutes,
        elevationGainM: Math.round(distanceKm * 12), // terrain grade estimate
        hazardCount: 0,
        isOfflineCached: true,
        waypoints,
        callsign: `ROAD-CORRIDOR-0${index + 1}`,
        roadSegment: summaryText,
        steps,
        isRealRoadRoute: true,
        summary: summaryText,
        primaryRoad: mainRoad
      };
    });

    return routes;
  } catch (err: any) {
    console.warn('Live road routing query failed, checking fallback:', err);
    throw new Error(err?.message || 'Unable to compute drivable road route.');
  }
}
