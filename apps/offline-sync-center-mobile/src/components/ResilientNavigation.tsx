import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { TacticalMap } from './TacticalMap';
import { Waypoint, RouteOption, RouteIncidentMatch, NavigationStep } from '../types';
import { TACTICAL_ROUTES } from '../services/mockData';
import { searchPlaces } from '../services/real-location.service';

export const ResilientNavigation: React.FC = () => {
  const {
    currentGPS,
    gpsSource,
    isRealGPSFix,
    realLocationAddress,
    isLocating,
    activateRealGPS,
    switchToSimulation,
    recenterMapCounter,
    triggerRecenterOnUser,
    activeRoute,
    setActiveRoute,
    alternativeRoutes,
    calculateRoadRouteToDestination,
    isRoutingLoading,
    routingError,
    waypoints,
    incidents,
    gpsBreadcrumbs,
    clearBreadcrumbs,
    setCurrentTab,
    showToast,
    startDrivingJourney,
    setIsFullScreenMap
  } = useApp();

  const { t } = useLanguage();
  const [selectedWaypoint, setSelectedWaypoint] = useState<Waypoint | null>(null);
  const [isPinDropMode, setIsPinDropMode] = useState<boolean>(false);
  const [showWaypointList, setShowWaypointList] = useState<boolean>(false);
  const [showTurnByTurn, setShowTurnByTurn] = useState<boolean>(true);

  // Google Maps Direction Search States
  const [originText, setOriginText] = useState<string>('📍 My Current Location');
  const [destinationText, setDestinationText] = useState<string>('');
  const [destinationCoord, setDestinationCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [showRoutePlanner, setShowRoutePlanner] = useState<boolean>(true);

  // Place search autocomplete suggestions
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [placeSuggestions, setPlaceSuggestions] = useState<{ name: string; lat: number; lng: number; address: string }[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const searchTimeoutRef = useRef<any>(null);

  // Update origin label based on real location address
  useEffect(() => {
    if (gpsSource === 'device') {
      if (realLocationAddress) {
        setOriginText(`📍 ${realLocationAddress}`);
      } else {
        setOriginText(`📍 Real Location (${currentGPS.latitude.toFixed(5)}°N, ${currentGPS.longitude.toFixed(5)}°E)`);
      }
    } else {
      setOriginText('🛰️ Simulated Convoy (Tawang Sector)');
    }
  }, [gpsSource, realLocationAddress, currentGPS.latitude, currentGPS.longitude]);

  // Convert degrees to cardinal direction
  const getCardinalDirection = (deg: number | null) => {
    if (deg === null) return 'N';
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((deg % 360) / 45)) % 8;
    return directions[index];
  };

  const handleMapCoordinateSelected = (lat: number, lng: number) => {
    if (isPinDropMode) {
      setIsPinDropMode(false);
      showToast(`Selected Location: ${lat.toFixed(6)}°N, ${lng.toFixed(6)}°E`);
      setCurrentTab('incident-reporting');
    }
  };

  // Distance calculation helper (Haversine formula in meters)
  const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Check route clearance and incident matches for any route
  const getRouteIncidents = (route: RouteOption | null): RouteIncidentMatch[] => {
    if (!route || !route.waypoints || route.waypoints.length === 0) return [];
    const matches: RouteIncidentMatch[] = [];

    incidents.forEach((inc) => {
      let minDistance = Infinity;
      let closestIdx = 0;

      route.waypoints.forEach((wp, idx) => {
        const dist = getDistanceMeters(inc.latitude, inc.longitude, wp[0], wp[1]);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = idx;
        }
      });

      // If incident is within 450 meters of route path, consider it an active route hazard
      if (minDistance <= 450) {
        matches.push({
          incident: inc,
          distanceToRouteMeters: Math.round(minDistance),
          closestWaypointIndex: closestIdx,
          hazardImpact: minDistance < 150 ? 'direct_blockage' : 'corridor_hazard'
        });
      }
    });

    return matches;
  };

  const activeRouteIncidents = useMemo(() => getRouteIncidents(activeRoute), [activeRoute, incidents]);
  const isRouteClear = activeRouteIncidents.length === 0;

  // Search places debounce
  const handleDestinationChange = (text: string) => {
    setDestinationText(text);
    setSearchQuery(text);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!text || text.trim().length < 2) {
      setPlaceSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearchingPlaces(true);
    setShowSuggestions(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchPlaces(text, currentGPS.latitude, currentGPS.longitude);
        setPlaceSuggestions(results);
      } catch {
        setPlaceSuggestions([]);
      } finally {
        setIsSearchingPlaces(false);
      }
    }, 400);
  };

  // Handle selecting a place suggestion
  const handleSelectSuggestion = (place: { name: string; lat: number; lng: number; address: string }) => {
    setDestinationText(place.name);
    setDestinationCoord({ lat: place.lat, lng: place.lng });
    setShowSuggestions(false);
    calculateRoadRouteToDestination(place.lat, place.lng, place.name);
  };

  // Handle selecting a tactical waypoint
  const handleSelectWaypointDestination = (wp: Waypoint) => {
    setDestinationText(`${wp.code} - ${wp.name}`);
    setDestinationCoord({ lat: wp.latitude, lng: wp.longitude });
    setShowSuggestions(false);
    calculateRoadRouteToDestination(wp.latitude, wp.longitude, wp.name);
  };

  // Trigger Road Route Calculation
  const handleCalculateRoute = () => {
    if (destinationCoord) {
      calculateRoadRouteToDestination(destinationCoord.lat, destinationCoord.lng, destinationText);
      return;
    }

    // Check if input matches lat, lng numbers
    const parts = destinationText.split(/[\s,]+/);
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setDestinationCoord({ lat, lng });
        calculateRoadRouteToDestination(lat, lng, 'Target Coordinates');
        return;
      }
    }

    // Default to search first suggestion or prompt
    if (placeSuggestions.length > 0) {
      const top = placeSuggestions[0];
      handleSelectSuggestion(top);
    } else {
      showToast('⚠️ Please enter a destination city, road, or pick from fast choices.');
    }
  };

  // Helper icon for navigation maneuvers
  const getManeuverIcon = (maneuver: string) => {
    if (maneuver.includes('left')) return 'turn_left';
    if (maneuver.includes('right')) return 'turn_right';
    if (maneuver.includes('roundabout')) return 'roundabout_right';
    if (maneuver.includes('arrive')) return 'flag';
    if (maneuver.includes('depart')) return 'navigation';
    if (maneuver.includes('ramp') || maneuver.includes('exit')) return 'ramp_right';
    return 'straight';
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.07 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  return (
    <motion.div 
      className="flex flex-col w-full gap-3 max-w-xl mx-auto pb-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      
      {/* Real-Time Location Tracker Control Bar (Google Maps Mode) */}
      <motion.div variants={itemVariants} className={`card p-3.5 transition-all ${
        gpsSource === 'device'
          ? 'bg-[#101929] border-blue-500/50 shadow-[0_0_20px_rgba(37,99,235,0.2)]'
          : 'bg-surface-container/50 border-hairline'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
              gpsSource === 'device' ? 'bg-blue-500 animate-pulse ring-4 ring-blue-500/25' : 'bg-amber-400'
            }`}>
              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-black uppercase tracking-wider ${
                  gpsSource === 'device' ? 'text-blue-400' : 'text-amber-400'
                }`}>
                  {gpsSource === 'device' ? 'Real Device GPS Active (Google Maps Mode)' : 'Tactical Simulation Active'}
                </span>
                {isLocating && (
                  <span className="material-symbols-outlined text-blue-400 text-[14px] animate-spin">
                    progress_activity
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-text-secondary truncate max-w-[260px] sm:max-w-xs">
                {realLocationAddress || `${currentGPS.latitude.toFixed(6)}°N, ${currentGPS.longitude.toFixed(6)}°E`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {gpsSource === 'device' ? (
              <>
                <button
                  type="button"
                  onClick={triggerRecenterOnUser}
                  className="px-2.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-md transition-all active:scale-95"
                  title="Center map on your real location"
                >
                  <span className="material-symbols-outlined text-[15px]">my_location</span>
                  <span>Center</span>
                </button>
                <button
                  type="button"
                  onClick={switchToSimulation}
                  className="px-2 py-1.5 rounded-full bg-transparent hover:bg-surface-container text-text-secondary text-[10px] font-bold border border-hairline"
                  title="Switch back to tactical simulation"
                >
                  Sim
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={activateRealGPS}
                disabled={isLocating}
                className="px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isLocating ? 'sync' : 'near_me'}
                </span>
                <span>{isLocating ? 'Acquiring...' : 'Trace My Real Location'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Precision readout strip */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-hairline text-[10px] font-mono text-text-secondary">
          <span>Lat: <b className="text-text-primary">{currentGPS.latitude.toFixed(6)}°</b></span>
          <span>Lng: <b className="text-text-primary">{currentGPS.longitude.toFixed(6)}°</b></span>
          <span>Accuracy: <b className="text-blue-400">±{Math.round(currentGPS.accuracy)}m</b></span>
          <span>Speed: <b className="text-secondary">{currentGPS.speed || 0} km/h</b></span>
        </div>
      </motion.div>

      {/* Google Maps Style Route & Location Search Bar */}
      <motion.div variants={itemVariants} className="card p-3.5 flex flex-col gap-2.5 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-500 text-[20px]">directions</span>
            <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Road Network Navigation & Route Calculator
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowRoutePlanner(!showRoutePlanner)}
            className="text-xs text-blue-400 font-bold hover:underline"
          >
            {showRoutePlanner ? 'Hide' : 'Directions'}
          </button>
        </div>

        {showRoutePlanner && (
          <div className="flex flex-col gap-2 pt-1 border-t border-hairline">
            {/* Origin Input (Locked to Real GPS by default) */}
            <div className="flex items-center gap-2">
              <div className="w-6 flex flex-col items-center justify-center">
                <span className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-500/20 shrink-0" />
                <div className="w-0.5 h-6 bg-hairline my-0.5" />
              </div>
              <div className="flex-1 flex items-center bg-surface-container/50 rounded-xl px-3 py-2 border border-hairline">
                <input
                  type="text"
                  value={originText}
                  readOnly
                  placeholder="Current Location..."
                  className="w-full bg-transparent text-xs text-text-primary font-medium focus:outline-none cursor-default truncate"
                />
                <button
                  type="button"
                  onClick={activateRealGPS}
                  className="text-[10px] text-blue-400 font-bold px-2 py-0.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 whitespace-nowrap"
                >
                  GPS Lock
                </button>
              </div>
            </div>

            {/* Destination Input with Autocomplete */}
            <div className="flex items-center gap-2 relative">
              <div className="w-6 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500 text-[18px]">location_on</span>
              </div>
              <div className="flex-1 flex items-center bg-surface-container/50 rounded-xl px-3 py-2 border border-hairline focus-within:border-blue-500 transition-colors">
                <input
                  type="text"
                  value={destinationText}
                  onChange={(e) => handleDestinationChange(e.target.value)}
                  onFocus={() => destinationText.length >= 2 && setShowSuggestions(true)}
                  placeholder="Enter destination, address, city, or coordinates..."
                  className="w-full bg-transparent text-xs text-text-primary font-medium focus:outline-none placeholder-text-secondary/50"
                />
                {isSearchingPlaces ? (
                  <span className="material-symbols-outlined text-[16px] text-text-secondary animate-spin">
                    progress_activity
                  </span>
                ) : destinationText ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDestinationText('');
                      setDestinationCoord(null);
                      setPlaceSuggestions([]);
                    }}
                    className="text-text-secondary hover:text-text-primary"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                ) : null}
              </div>
            </div>

            {/* Place Autocomplete Suggestions Dropdown */}
            {showSuggestions && placeSuggestions.length > 0 && (
              <div className="absolute top-[110px] left-8 right-3 z-30 bg-surface-container border border-hairline rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                {placeSuggestions.map((place, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSuggestion(place)}
                    className="p-2.5 hover:bg-surface-container/50 cursor-pointer border-b border-hairline last:border-0 flex items-start gap-2 text-xs"
                  >
                    <span className="material-symbols-outlined text-blue-400 text-[16px] mt-0.5 shrink-0">place</span>
                    <div className="flex-1 truncate">
                      <div className="font-bold text-text-primary truncate">{place.name}</div>
                      <div className="text-[10px] text-text-secondary truncate">{place.address}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Fast Pick Waypoint Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pl-8">
              <span className="text-[10px] font-bold text-text-secondary uppercase shrink-0">Fast Pick:</span>
              {waypoints.map((wp) => (
                <button
                  key={wp.id}
                  type="button"
                  onClick={() => handleSelectWaypointDestination(wp)}
                  className="text-[10px] font-mono px-3 py-1.5 rounded-full bg-transparent border border-hairline text-text-secondary hover:text-blue-400 hover:border-blue-400 transition-colors whitespace-nowrap cursor-pointer"
                >
                  {wp.code}: {wp.name}
                </button>
              ))}
            </div>

            {/* Big Action: Calculate Actual Road Route */}
            <button
              type="button"
              onClick={handleCalculateRoute}
              disabled={isRoutingLoading}
              className="mt-1 w-full py-2.5 px-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isRoutingLoading ? 'sync' : 'directions_car'}
              </span>
              <span>
                {isRoutingLoading
                  ? 'Calculating Route Along Road Network...'
                  : 'Get Route via Available Roads'}
              </span>
            </button>

            {routingError && (
              <p className="text-[11px] text-error font-medium pl-8">
                ⚠️ {routingError}
              </p>
            )}
          </div>
        )}
      </motion.div>

      {/* Main Interactive Tactical Map */}
      <motion.div variants={itemVariants}>
        <TacticalMap
          heightClass="h-[380px] sm:h-[440px]"
          onSelectCoordinate={handleMapCoordinateSelected}
          isPinDropMode={isPinDropMode}
          onSelectWaypoint={(wp) => setSelectedWaypoint(wp)}
        />
      </motion.div>

      {/* Map Action Quick Bar */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setIsPinDropMode(!isPinDropMode)}
          className={`py-2 px-3 rounded-full font-medium text-xs flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
            isPinDropMode
              ? 'bg-tertiary text-text-primary border-tertiary shadow-lg'
              : 'bg-transparent hover:bg-surface-container text-text-secondary hover:text-text-primary border-hairline'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isPinDropMode ? 'cancel' : 'add_location_alt'}
          </span>
          {isPinDropMode ? t('hud.cancel_pin') : t('hud.drop_pin')}
        </button>

        <button
          type="button"
          onClick={() => setShowWaypointList(!showWaypointList)}
          className="py-2 px-3 rounded-full font-medium text-xs bg-transparent hover:bg-surface-container text-text-secondary hover:text-text-primary border border-hairline flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">flag</span>
          {t('hud.waypoints')} ({waypoints.length})
        </button>

        <button
          type="button"
          onClick={() => setIsFullScreenMap(true)}
          className="py-2 px-3 rounded-full font-medium text-xs bg-transparent hover:bg-surface-container text-text-secondary hover:text-text-primary border border-hairline flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          title="Open Fullscreen Driving Map"
        >
          <span className="material-symbols-outlined text-[18px] text-primary">fullscreen</span>
          <span>Full Map</span>
        </button>

        <button
          type="button"
          onClick={clearBreadcrumbs}
          disabled={gpsBreadcrumbs.length === 0}
          className="py-2 px-3 rounded-full font-medium text-xs bg-transparent hover:bg-surface-container text-text-secondary hover:text-error border border-hairline flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
          {t('hud.reset_track')}
        </button>
      </motion.div>

      {/* Active Road Route Guidance & Turn-by-Turn Maneuvers */}
      {activeRoute && (
        <motion.div variants={itemVariants} className="card p-4 flex flex-col gap-3">
          
          {/* Header & Road Summary Banner */}
          <div className="flex items-start justify-between gap-2 border-b border-hairline pb-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                  {activeRoute.isRealRoadRoute ? '🚗 Drivable Road Route' : 'Tactical Corridor'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                  {activeRoute.callsign || 'ROAD-NAV'}
                </span>
              </div>
              <h3 className="font-bold text-base text-text-primary mt-1">{activeRoute.name}</h3>
              <p className="text-xs text-text-secondary mt-0.5">To: {activeRoute.destination}</p>
            </div>

            {/* Route Status Tag */}
            <span className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-wide flex items-center gap-1 shrink-0 ${
              isRouteClear
                ? 'bg-secondary/20 text-secondary border border-secondary/40 shadow-[0_0_12px_rgba(74,225,131,0.25)]'
                : 'bg-error/20 text-error border border-error/50 shadow-[0_0_12px_rgba(255,180,171,0.25)] animate-pulse'
            }`}>
              <span className="material-symbols-outlined text-[16px]">
                {isRouteClear ? 'check_circle' : 'warning'}
              </span>
              {isRouteClear ? 'Clear of Hazards' : `${activeRouteIncidents.length} Hazards Reported`}
            </span>
          </div>

          {/* Quick Metrics: Distance, ETA, Elevation */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-surface-container/50 p-2.5 rounded-xl border border-hairline">
              <span className="text-text-secondary text-[10px] block uppercase font-bold tracking-wider">Distance</span>
              <span className="font-mono font-bold text-text-primary text-base">{activeRoute.distanceKm} km</span>
            </div>
            <div className="bg-surface-container/50 p-2.5 rounded-xl border border-hairline">
              <span className="text-text-secondary text-[10px] block uppercase font-bold tracking-wider">Estimated Time</span>
              <span className="font-mono font-bold text-blue-400 text-base">{activeRoute.estMinutes} mins</span>
            </div>
            <div className="bg-surface-container/50 p-2.5 rounded-xl border border-hairline">
              <span className="text-text-secondary text-[10px] block uppercase font-bold tracking-wider">Elevation</span>
              <span className="font-mono font-bold text-tertiary text-base">+{activeRoute.elevationGainM} m</span>
            </div>
          </div>

          {/* Primary Google Maps Navigation Buttons: "START" and "Full Map View" */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              id="nav-start-journey-btn"
              type="button"
              onClick={() => startDrivingJourney(activeRoute)}
              className="flex-1 py-3.5 px-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm tracking-wide shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-emerald-400 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[24px]">navigation</span>
              <span className="font-mono text-base font-black">START</span>
              <span className="text-xs font-normal text-emerald-100 font-mono">
                ({activeRoute.estMinutes} mins)
              </span>
            </button>

            <button
              id="nav-fullscreen-map-btn"
              type="button"
              onClick={() => setIsFullScreenMap(true)}
              className="py-3.5 px-4 rounded-full bg-transparent hover:bg-surface-container text-text-primary font-bold text-xs border border-hairline flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
              title="Open full map view to follow route while driving"
            >
              <span className="material-symbols-outlined text-[20px] text-primary">fullscreen</span>
              <span>Full Map View</span>
            </button>
          </div>

          {/* Alternative Road Routes Switcher */}
          {alternativeRoutes.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-text-secondary">
                Alternative Road Routes
              </span>
              <div className="grid grid-cols-2 gap-2">
                {alternativeRoutes.map((altRoute) => (
                  <button
                    key={altRoute.id}
                    type="button"
                    onClick={() => setActiveRoute(altRoute)}
                    className="p-3 rounded-xl text-left bg-transparent hover:bg-surface-container border border-hairline text-xs flex flex-col justify-between cursor-pointer transition-colors"
                  >
                    <span className="font-bold text-text-primary truncate">{altRoute.name}</span>
                    <span className="text-[10px] font-mono text-blue-400 font-bold mt-1">
                      {altRoute.distanceKm} km • {altRoute.estMinutes} mins
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step-by-step Turn Maneuvers List */}
          {activeRoute.steps && activeRoute.steps.length > 0 && (
            <div className="flex flex-col gap-2 pt-1 border-t border-hairline mt-2">
              <button
                type="button"
                onClick={() => setShowTurnByTurn(!showTurnByTurn)}
                className="flex items-center justify-between text-xs font-bold text-text-primary hover:text-blue-400 transition-colors py-1 cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-blue-400">turn_slight_right</span>
                  <span>Turn-by-Turn Road Directions ({activeRoute.steps.length} turns)</span>
                </div>
                <span className="material-symbols-outlined text-[18px]">
                  {showTurnByTurn ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {showTurnByTurn && (
                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                  {activeRoute.steps.map((step, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-2.5 rounded-xl bg-surface-container/30 border border-hairline flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px]">
                          {getManeuverIcon(step.maneuver)}
                        </span>
                      </div>
                      <div className="flex-1 mt-1">
                        <p className="text-xs font-bold text-text-primary leading-snug">
                          {step.instruction}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] font-mono text-text-secondary mt-1">
                          <span>{step.distanceMeters > 1000 ? `${(step.distanceMeters / 1000).toFixed(1)} km` : `${step.distanceMeters} m`}</span>
                          {step.roadName && <span className="text-text-secondary truncate max-w-[200px] border-l border-hairline pl-2">{step.roadName}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tactical Fallback Routes */}
          {!activeRoute.isRealRoadRoute && (
            <div className="flex flex-col gap-1.5 pt-1 border-t border-hairline mt-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-text-secondary mt-2">
                Tactical Pre-Planned Routes
              </span>
              <div className="grid grid-cols-3 gap-2">
                {TACTICAL_ROUTES.map((route) => {
                  const routeIncidents = getRouteIncidents(route);
                  const isThisClear = routeIncidents.length === 0;
                  const isSelected = activeRoute.id === route.id;

                  return (
                    <button
                      key={route.id}
                      type="button"
                      onClick={() => setActiveRoute(route)}
                      className={`p-2.5 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                          : 'bg-transparent text-text-secondary border-hairline hover:text-text-primary hover:bg-surface-container'
                      }`}
                    >
                      <span className="truncate w-full block text-[11px] font-medium">{route.name.split('(')[0].trim()}</span>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold tracking-wider ${
                        isThisClear
                          ? isSelected ? 'bg-black/30 text-secondary' : 'bg-secondary/10 text-secondary'
                          : isSelected ? 'bg-black/30 text-error' : 'bg-error/10 text-error'
                      }`}>
                        {isThisClear ? `● CLEAR` : `● ${routeIncidents.length} HAZARD`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Waypoint Details Drawer / Popover if Selected */}
      {selectedWaypoint && (
        <motion.div variants={itemVariants} className="card p-4 border border-primary/50 shadow-[0_0_20px_rgba(251,187,69,0.15)] flex flex-col gap-3 relative overflow-hidden">
          {/* subtle glow background for waypoint */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
          
          <div className="flex items-center justify-between border-b border-hairline pb-3 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[18px]">place</span>
              </div>
              <h4 className="font-bold text-sm text-text-primary">{selectedWaypoint.name}</h4>
            </div>
            <button
              type="button"
              onClick={() => setSelectedWaypoint(null)}
              className="w-8 h-8 rounded-full bg-transparent border border-hairline text-text-secondary hover:text-text-primary hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
          <p className="text-xs text-text-secondary relative z-10 leading-relaxed">{selectedWaypoint.description}</p>
          <div className="flex items-center justify-between text-[11px] font-mono text-text-secondary pt-1 relative z-10">
            <span>Elevation: {selectedWaypoint.elevationMeters}m</span>
            <span>{selectedWaypoint.latitude.toFixed(4)}°N, {selectedWaypoint.longitude.toFixed(4)}°E</span>
          </div>
          <button
            type="button"
            onClick={() => handleSelectWaypointDestination(selectedWaypoint)}
            className="w-full py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 mt-2 transition-transform active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">directions_car</span>
            <span>Navigate to this Waypoint</span>
          </button>
        </motion.div>
      )}

      {/* Waypoints List Expansion */}
      {showWaypointList && (
        <motion.div variants={itemVariants} className="card p-4 flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
            Sector Objectives & Waypoints
          </h3>
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
            {waypoints.map((wp) => (
              <div
                key={wp.id}
                onClick={() => setSelectedWaypoint(wp)}
                className="bg-transparent border border-hairline p-3 rounded-xl flex items-center justify-between hover:bg-surface-container cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/20">
                    {wp.code}
                  </span>
                  <div>
                    <span className="text-sm font-bold text-text-primary block">{wp.name}</span>
                    <span className="text-[11px] text-text-secondary">{wp.type.toUpperCase()} • Alt {wp.elevationMeters}m</span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                  wp.status === 'active' ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'bg-tertiary/10 text-tertiary border border-tertiary/20'
                }`}>
                  {wp.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

    </motion.div>
  );
};
