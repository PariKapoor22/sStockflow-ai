import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  ArrowUp, 
  CornerUpLeft, 
  CornerUpRight, 
  GitFork, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  X, 
  Play, 
  Pause, 
  FastForward, 
  Compass, 
  AlertTriangle, 
  MapPin, 
  ListOrdered, 
  Flag,
  Crosshair,
  Layers,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TacticalMap } from './TacticalMap';
import { calculateDistanceMeters } from '../services/gps-geojson.service';
import { speakInstruction } from '../services/voice-guidance.service';

export const ActiveDrivingHUD: React.FC = () => {
  const {
    activeRoute,
    currentGPS,
    gpsSource,
    currentStepIndex,
    setCurrentStepIndex,
    stopDrivingJourney,
    voiceGuidanceEnabled,
    setVoiceGuidanceEnabled,
    isDriveSimulating,
    setIsDriveSimulating,
    driveSimulationSpeed,
    setDriveSimulationSpeed,
    triggerRecenterOnUser,
    realLocationAddress,
    createIncident,
    showToast,
    mapLayer,
    setMapLayer
  } = useApp();

  const [showStepsDrawer, setShowStepsDrawer] = useState(false);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showQuickHazardModal, setShowQuickHazardModal] = useState(false);
  const [hazardCategory, setHazardCategory] = useState<'landslide' | 'convoy_hold' | 'bridge_out' | 'washout'>('landslide');

  // If no active route, fallback to empty or first
  if (!activeRoute) return null;

  const steps = activeRoute.steps || [];
  const currentStep = steps[currentStepIndex] || steps[0] || {
    instruction: `Proceed along ${activeRoute.roadSegment || activeRoute.name}`,
    distanceMeters: 500,
    durationSeconds: 120,
    maneuver: 'straight',
    roadName: activeRoute.roadSegment || 'Main Highway',
    location: activeRoute.waypoints[0]
  };

  const nextStep = steps[currentStepIndex + 1] || null;

  // Calculate live remaining distance from current vehicle to destination
  const remainingDistanceMeters = currentStep ? Math.round(
    steps.slice(currentStepIndex).reduce((acc, s) => acc + s.distanceMeters, 0)
  ) : Math.round(activeRoute.distanceKm * 1000);

  const remainingKm = Math.max(0.1, Number((remainingDistanceMeters / 1000).toFixed(1)));
  const remainingMinutes = Math.max(1, Math.round((remainingKm / 35) * 60));

  // Compute estimated arrival time string
  const arrivalDate = new Date(Date.now() + remainingMinutes * 60000);
  const arrivalTimeStr = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Distance to current maneuver
  const distanceToManeuver = currentStep.location
    ? calculateDistanceMeters(
        currentGPS.latitude,
        currentGPS.longitude,
        currentStep.location[0],
        currentStep.location[1]
      )
    : currentStep.distanceMeters;

  // Helper for maneuver icon
  const renderManeuverIcon = (maneuver: string, className = "w-8 h-8 text-white") => {
    switch (maneuver) {
      case 'turn-left':
        return <CornerUpLeft className={className} />;
      case 'turn-right':
        return <CornerUpRight className={className} />;
      case 'fork-left':
      case 'fork-right':
        return <GitFork className={className} />;
      case 'roundabout':
        return <RotateCw className={className} />;
      case 'arrive':
        return <Flag className={className} />;
      default:
        return <ArrowUp className={className} />;
    }
  };

  const formatDistance = (meters: number) => {
    if (meters < 50) return 'Turn Now';
    if (meters < 1000) return `In ${Math.round(meters / 10) * 10} m`;
    return `In ${(meters / 1000).toFixed(1)} km`;
  };

  const handleQuickReportHazard = async () => {
    try {
      await createIncident({
        title: `Road Hazard: ${hazardCategory.toUpperCase().replace('_', ' ')}`,
        category: hazardCategory,
        severity: 'critical',
        district_road_segment: activeRoute.roadSegment || 'En Route Highway',
        latitude: currentGPS.latitude,
        longitude: currentGPS.longitude,
        altitude_meters: currentGPS.altitude,
        accuracy_meters: currentGPS.accuracy,
        photos: []
      });
      setShowQuickHazardModal(false);
      showToast('⚠️ Hazard beacon registered on live convoy mesh!');
    } catch {
      showToast('Failed to report hazard');
    }
  };

  return (
    <div id="active-driving-fullscreen-hud" className="fixed inset-0 z-50 bg-[#0c1014] flex flex-col select-none overflow-hidden">
      {/* 1. Fullscreen Map Background */}
      <div className="absolute inset-0 z-0">
        <TacticalMap 
          heightClass="h-full w-full"
          showControlsBar={false}
          showTileCacheIndicator={false}
          showGridOverlay={false}
        />
      </div>

      {/* 2. Top Google Maps Turn Card */}
      <header className="relative z-20 pt-3 px-3 sm:px-6 pointer-events-none">
        <div className="max-w-xl mx-auto pointer-events-auto bg-[#0f241a]/95 border-2 border-emerald-500/80 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md text-white transition-all duration-300">
          <div className="flex items-start gap-3.5">
            {/* Maneuver Graphic */}
            <div className="w-14 h-14 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center flex-shrink-0 shadow-inner">
              {renderManeuverIcon(currentStep.maneuver, "w-8 h-8 text-emerald-300 stroke-[2.5]")}
            </div>

            {/* Instruction Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest font-mono text-emerald-300/90 font-bold">
                  {formatDistance(distanceToManeuver)}
                </span>
                {activeRoute.roadSegment && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/50 text-emerald-200 font-mono">
                    {activeRoute.roadSegment}
                  </span>
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug mt-0.5 drop-shadow">
                {currentStep.instruction}
              </h2>

              {/* Next turn preview */}
              {nextStep && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-emerald-200/80 font-medium">
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-600/30">
                    THEN
                  </span>
                  <span className="truncate">{nextStep.instruction}</span>
                </div>
              )}
            </div>

            {/* Audio & Action Buttons */}
            <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
              <button
                id="hud-voice-toggle-btn"
                type="button"
                onClick={() => {
                  const nextState = !voiceGuidanceEnabled;
                  setVoiceGuidanceEnabled(nextState);
                  if (nextState) {
                    speakInstruction(currentStep.instruction, true);
                  }
                  showToast(nextState ? 'Voice Guidance: Audio Enabled' : 'Voice Guidance: Muted');
                }}
                className={`p-2.5 rounded-xl border transition-colors ${
                  voiceGuidanceEnabled 
                    ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 hover:bg-emerald-500/35' 
                    : 'bg-black/40 border-white/20 text-slate-400 hover:text-white'
                }`}
                title="Toggle Voice Guidance"
              >
                {voiceGuidanceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>

              {/* Map Layer / Topo Mode Switcher Button */}
              <button
                id="hud-layer-toggle-btn"
                type="button"
                onClick={() => setShowLayerMenu(!showLayerMenu)}
                className={`p-2.5 rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  mapLayer === 'google_terrain' || mapLayer === 'open_topo'
                    ? 'bg-amber-500/25 border-amber-400 text-amber-200 hover:bg-amber-500/35'
                    : 'bg-black/40 border-white/20 text-slate-300 hover:text-white hover:bg-black/60'
                }`}
                title="Change Map Style (Topo / Satellite / Street)"
              >
                <Layers className="w-5 h-5" />
                <span className="text-[11px] font-mono font-bold uppercase hidden xs:inline">
                  {mapLayer === 'google_terrain' ? 'Topo' : mapLayer === 'open_topo' ? 'OpenTopo' : mapLayer === 'google_hybrid' ? 'Sat' : 'Dark'}
                </span>
              </button>

              <button
                id="hud-steps-toggle-btn"
                type="button"
                onClick={() => setShowStepsDrawer(!showStepsDrawer)}
                className="p-2.5 rounded-xl bg-black/40 border border-white/20 text-slate-300 hover:text-white hover:bg-black/60 transition-colors"
                title="View All Turn Directions"
              >
                <ListOrdered className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Map Layer Selector Popover in HUD */}
          {showLayerMenu && (
            <div className="mt-2 ml-auto w-56 bg-[#12171e]/98 border border-slate-700/90 rounded-2xl p-2.5 shadow-2xl backdrop-blur-xl flex flex-col gap-1.5 animate-fadeIn pointer-events-auto">
              <div className="text-[10px] font-mono uppercase text-slate-400 font-bold px-2 py-0.5 flex items-center justify-between">
                <span>Map Layer & Style</span>
                <span className="text-[9px] text-amber-400 font-mono">Live</span>
              </div>

              <button
                id="hud-layer-google-topo"
                type="button"
                onClick={() => {
                  setMapLayer('google_terrain');
                  setShowLayerMenu(false);
                  showToast('⛰️ Topo Mode: Google Topographic Relief & Altitude Contours');
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-mono font-medium transition-colors text-left cursor-pointer ${
                  mapLayer === 'google_terrain'
                    ? 'bg-amber-500/25 text-amber-200 border border-amber-500/50 shadow-sm'
                    : 'text-slate-300 hover:bg-white/5 border border-transparent'
                }`}
              >
                <span className="text-base">⛰️</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-amber-100">Google Topo</div>
                  <div className="text-[10px] text-slate-400">Mountain relief & contours</div>
                </div>
              </button>

              <button
                id="hud-layer-open-topo"
                type="button"
                onClick={() => {
                  setMapLayer('open_topo');
                  setShowLayerMenu(false);
                  showToast('🧭 OpenTopo: Military Elevation Contour Lines');
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-mono font-medium transition-colors text-left cursor-pointer ${
                  mapLayer === 'open_topo'
                    ? 'bg-amber-500/25 text-amber-200 border border-amber-500/50 shadow-sm'
                    : 'text-slate-300 hover:bg-white/5 border border-transparent'
                }`}
              >
                <span className="text-base">🧭</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-amber-100">OpenTopo Map</div>
                  <div className="text-[10px] text-slate-400">20m/50m elevation contours</div>
                </div>
              </button>

              <button
                id="hud-layer-google-hybrid"
                type="button"
                onClick={() => {
                  setMapLayer('google_hybrid');
                  setShowLayerMenu(false);
                  showToast('🛰️ Satellite HD: Photogrammetry & Road Overlay');
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-mono font-medium transition-colors text-left cursor-pointer ${
                  mapLayer === 'google_hybrid'
                    ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-500/50 shadow-sm'
                    : 'text-slate-300 hover:bg-white/5 border border-transparent'
                }`}
              >
                <span className="text-base">🛰️</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-cyan-100">Satellite HD</div>
                  <div className="text-[10px] text-slate-400">Photogrammetry + labels</div>
                </div>
              </button>

              <button
                id="hud-layer-tactical-dark"
                type="button"
                onClick={() => {
                  setMapLayer('tactical_dark');
                  setShowLayerMenu(false);
                  showToast('🌙 Tactical Dark: High-contrast night mode');
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-mono font-medium transition-colors text-left cursor-pointer ${
                  mapLayer === 'tactical_dark'
                    ? 'bg-blue-500/25 text-blue-200 border border-blue-500/50 shadow-sm'
                    : 'text-slate-300 hover:bg-white/5 border border-transparent'
                }`}
              >
                <span className="text-base">🌙</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-blue-100">Tactical Dark</div>
                  <div className="text-[10px] text-slate-400">Night HUD mode</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Floating Center Controls & Sim Controls (Floating in middle area) */}
      <div className="relative z-20 pointer-events-none mt-auto mb-2 px-4 flex items-center justify-between">
        {/* Left: Re-center Camera Button */}
        <button
          id="hud-recenter-driver-btn"
          type="button"
          onClick={() => {
            triggerRecenterOnUser();
            showToast('📍 Camera re-centered on vehicle');
          }}
          className="pointer-events-auto flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#101418]/90 border border-cyan-500/40 text-cyan-300 hover:bg-[#151c22] transition-colors shadow-lg backdrop-blur-md text-xs font-mono font-medium"
        >
          <Crosshair className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>Follow Vehicle</span>
        </button>

        {/* Right: Simulation Speed & Controls (if simulation mode) */}
        {gpsSource === 'simulation' ? (
          <div className="pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-xl bg-[#101418]/90 border border-amber-500/40 text-amber-300 shadow-lg backdrop-blur-md">
            <button
              id="hud-toggle-sim-play-btn"
              type="button"
              onClick={() => setIsDriveSimulating(!isDriveSimulating)}
              className="p-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 transition-colors"
              title={isDriveSimulating ? 'Pause Drive' : 'Resume Drive'}
            >
              {isDriveSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              id="hud-toggle-sim-speed-btn"
              type="button"
              onClick={() => {
                const next = driveSimulationSpeed === 1 ? 2 : driveSimulationSpeed === 2 ? 4 : 1;
                setDriveSimulationSpeed(next);
                showToast(`Simulation Speed: ${next}x`);
              }}
              className="px-2.5 py-1 text-xs font-mono font-bold rounded bg-amber-500/20 text-amber-200 hover:bg-amber-500/30"
              title="Simulation Speed Multiplier"
            >
              {driveSimulationSpeed}x
            </button>
          </div>
        ) : (
          <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 shadow-lg backdrop-blur-md text-xs font-mono">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Live GPS Active (±{currentGPS.accuracy}m)</span>
          </div>
        )}
      </div>

      {/* 3. Bottom Google Maps Driving Summary Bar */}
      <footer className="relative z-20 p-3 sm:p-4 bg-[#101418]/95 border-t border-slate-800 backdrop-blur-lg shadow-2xl">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          {/* Remaining ETA, Distance & Clock */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight font-mono">
                {remainingMinutes} <span className="text-sm font-semibold uppercase text-emerald-300">min</span>
              </span>
              <span className="text-sm font-mono text-slate-300">
                ({remainingKm} km)
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono truncate">
              <span>ETA {arrivalTimeStr}</span>
              <span>•</span>
              <span className="text-slate-300 truncate">{activeRoute.destination}</span>
            </div>
          </div>

          {/* Center Speedometer Badge */}
          <div className="hidden xs:flex flex-col items-center justify-center px-3 py-1.5 rounded-xl bg-black/50 border border-slate-700/60 font-mono">
            <span className="text-lg font-bold text-white leading-none">
              {Math.round(currentGPS.speed || 0)}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 mt-0.5">km/h</span>
          </div>

          {/* Quick Hazard Report Button */}
          <button
            id="hud-quick-hazard-btn"
            type="button"
            onClick={() => setShowQuickHazardModal(true)}
            className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 hover:bg-amber-500/30 transition-colors"
            title="Report Road Hazard Ahead"
          >
            <AlertTriangle className="w-5 h-5" />
          </button>

          {/* Large Exit / End Button (Google Maps red exit pill) */}
          <button
            id="hud-end-navigation-btn"
            type="button"
            onClick={stopDrivingJourney}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-red-950 transition-colors font-mono"
          >
            <X className="w-4 h-4 stroke-[3]" />
            <span>END</span>
          </button>
        </div>
      </footer>

      {/* 4. Directions Drawer (Slide-up list of all upcoming turns) */}
      {showStepsDrawer && (
        <div className="absolute inset-x-0 bottom-0 top-20 z-40 bg-[#0e1318]/98 border-t-2 border-slate-700/80 p-4 rounded-t-3xl shadow-2xl flex flex-col backdrop-blur-xl animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">Turn-by-Turn Directions</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowStepsDrawer(false)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 mt-2 pr-1">
            {steps.map((step, idx) => {
              const isCurrent = idx === currentStepIndex;
              const isPassed = idx < currentStepIndex;

              return (
                <div
                  key={`hud-step-${idx}`}
                  onClick={() => {
                    setCurrentStepIndex(idx);
                    if (voiceGuidanceEnabled) speakInstruction(step.instruction, true);
                  }}
                  className={`p-3.5 flex items-start gap-3.5 cursor-pointer rounded-xl transition-colors ${
                    isCurrent 
                      ? 'bg-emerald-950/60 border border-emerald-500/50 text-white' 
                      : isPassed
                      ? 'opacity-40 text-slate-400 hover:opacity-80'
                      : 'hover:bg-slate-800/50 text-slate-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isCurrent ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {renderManeuverIcon(step.maneuver, "w-5 h-5")}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold leading-snug ${isCurrent ? 'text-emerald-200' : 'text-slate-200'}`}>
                      {step.instruction}
                    </p>
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-1">
                      <span>{step.distanceMeters} m</span>
                      <span>•</span>
                      <span>{step.roadName || 'Road'}</span>
                      {isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500 text-black font-bold uppercase ml-auto">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowStepsDrawer(false)}
            className="w-full py-3 mt-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-colors"
          >
            Resume Live Driving View
          </button>
        </div>
      )}

      {/* 5. Quick Road Hazard Reporter Modal */}
      {showQuickHazardModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12171d] border border-amber-500/50 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <div className="flex items-center gap-2.5 text-amber-400 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-white text-lg">Report Road Obstacle</h3>
            </div>
            <p className="text-xs text-slate-300 mb-4 font-mono">
              Instantly broadcasts hazard at GPS {currentGPS.latitude.toFixed(5)}°N, {currentGPS.longitude.toFixed(5)}°E to all convoy vehicles.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { id: 'landslide', label: '🪨 Rockfall / Slide' },
                { id: 'washout', label: '🌊 Road Washout' },
                { id: 'convoy_hold', label: '🛑 Blocked Road' },
                { id: 'bridge_out', label: '🌉 Damaged Bridge' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setHazardCategory(opt.id as any)}
                  className={`p-2.5 text-xs rounded-xl font-medium border text-left transition-colors ${
                    hazardCategory === opt.id 
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200' 
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowQuickHazardModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleQuickReportHazard}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors"
              >
                Broadcast Hazard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
