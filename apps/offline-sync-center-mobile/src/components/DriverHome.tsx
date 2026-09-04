import React from 'react';
import { useApp } from '../context/AppContext';
import { TacticalMap } from './TacticalMap';
import { motion, type Variants } from 'motion/react';
import { CountUp } from './CountUp';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export const DriverHome: React.FC = () => {
  const {
    currentGPS,
    isOnline,
    setCurrentTab,
    syncQueue,
    forceSync,
    isSyncing,
    incidents,
    activeRoute,
    showToast,
    setIsFullScreenMap,
    startDrivingJourney
  } = useApp();

  const pendingCount = syncQueue.filter(
    (i) => i.status === 'pending' || i.status === 'failed'
  ).length;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col w-full gap-4 max-w-xl mx-auto pb-6"
    >
      
      {/* Active Mission Banner */}
      <motion.div variants={itemVariants} className="bg-[var(--bg-surface)] rounded-[16px] p-5 border border-[var(--border-hairline)] relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-primary/5 -skew-x-12 pointer-events-none" />
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--status-green,#4ae183)] animate-pulse" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--status-green,#4ae183)]">
              Active Mission Order
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold bg-primary/20 text-primary px-2 py-0.5 rounded border border-primary/30">
            OP-SHIELD-04
          </span>
        </div>

        <h2 className="font-headline-md text-lg sm:text-xl font-medium text-[var(--text-primary)]">
          Supply Convoy: Sector 4 Alpha
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
          Deliver critical cold-weather medical kits & tactical radio transceivers to outpost commander.
        </p>

        {/* Mission metrics */}
        <div className="grid grid-cols-3 mt-4 pt-4 border-t border-[var(--border-hairline)] text-center divide-x divide-[var(--border-hairline)]">
          <div className="px-2">
            <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold block mb-1">Next Checkpoint</span>
            <span className="text-xs font-bold text-[var(--text-primary)] font-mono">CP-BRV (<CountUp value={1.2} decimals={1} suffix=" km" />)</span>
          </div>
          <div className="px-2">
            <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold block mb-1">Remaining</span>
            <span className="text-xs font-bold text-primary font-mono"><CountUp value={activeRoute ? activeRoute.distanceKm : 8.4} decimals={1} suffix=" km" /></span>
          </div>
          <div className="px-2">
            <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold block mb-1">Hazards</span>
            <span className="text-xs font-bold text-tertiary font-mono"><CountUp value={1} /> Active</span>
          </div>
        </div>

        {/* Start Journey and Full Map Launch Strip */}
        <div className="flex items-center gap-2.5 mt-4 pt-4 border-t border-[var(--border-hairline)]">
          <button
            onClick={() => {
              if (activeRoute) {
                startDrivingJourney(activeRoute);
              } else {
                setCurrentTab('resilient-navigation');
              }
            }}
            className="flex-1 py-3 px-4 rounded-full bg-[var(--text-primary)] text-[var(--bg-base)] font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-all hover:brightness-105 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">navigation</span>
            <span>START JOURNEY</span>
          </button>
          <button
            onClick={() => {
              setCurrentTab('resilient-navigation');
              setIsFullScreenMap(true);
            }}
            className="py-3 px-3.5 rounded-full bg-transparent text-[var(--text-primary)] font-medium text-xs border border-[var(--border-hairline)] flex items-center justify-center gap-1.5 transition-all hover:border-opacity-100 cursor-pointer"
            title="Open Full Map View"
          >
            <span className="material-symbols-outlined text-[18px]">fullscreen</span>
          </button>
        </div>
      </motion.div>

      {/* Mini Live Tactical Map */}
      <motion.div variants={itemVariants} className="bg-[var(--bg-surface)] rounded-[16px] p-4 border border-[var(--border-hairline)] flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--text-primary)] text-[18px]">near_me</span>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Real-Time Location & Sector
            </span>
          </div>
          <button
            onClick={() => {
              setCurrentTab('resilient-navigation');
              setIsFullScreenMap(true);
            }}
            className="text-xs text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            Full Map View
            <span className="material-symbols-outlined text-[14px]">fullscreen</span>
          </button>
        </div>

        <TacticalMap
          heightClass="h-44"
          showControls={false}
          interactive={false}
        />

        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)] px-1 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-primary)] font-semibold">
              {currentGPS.latitude.toFixed(4)}°N, {currentGPS.longitude.toFixed(4)}°E
            </span>
            <span>•</span>
            <span className="font-bold"><CountUp value={currentGPS.speed || 0} /> km/h</span>
          </div>
          <span>Alt: <CountUp value={currentGPS.altitude || 3048} />m</span>
        </div>
      </motion.div>

      {/* Quick Action Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={() => setCurrentTab('resilient-navigation')}
          className="bg-[var(--bg-surface)] hover:bg-[var(--bg-surface)]/80 border border-[var(--border-hairline)] p-4 rounded-[16px] flex flex-col items-center justify-center gap-2 text-center transition-all active:scale-95"
        >
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[22px]">navigation</span>
          </div>
          <span className="text-xs font-bold text-on-surface">Navigate Route</span>
        </button>

        <button
          onClick={() => setCurrentTab('incident-reporting')}
          className="bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 p-3 rounded-xl flex flex-col items-center justify-center gap-1.5 text-center transition-all active:scale-95 shadow-sm"
        >
          <div className="w-10 h-10 rounded-full bg-tertiary/20 flex items-center justify-center text-tertiary">
            <span className="material-symbols-outlined text-[22px]">add_alert</span>
          </div>
          <span className="text-xs font-bold text-on-surface">Log Incident</span>
        </button>

        <button
          onClick={() => setCurrentTab('offline-sync-center')}
          className="bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 p-3 rounded-xl flex flex-col items-center justify-center gap-1.5 text-center transition-all active:scale-95 shadow-sm"
        >
          <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-[22px]">sync</span>
          </div>
          <span className="text-xs font-bold text-on-surface">Sync Queue ({pendingCount})</span>
        </button>

        <button
          onClick={() => setCurrentTab('emergency-sos')}
          className="bg-[var(--bg-surface)] hover:bg-[var(--bg-surface)]/80 border border-[var(--accent-coral)]/30 p-4 rounded-[16px] flex flex-col items-center justify-center gap-2 text-center transition-all active:scale-95"
        >
          <div className="w-10 h-10 rounded-full bg-[var(--accent-coral)]/10 flex items-center justify-center text-[var(--accent-coral)]">
            <span className="material-symbols-outlined text-[22px]">emergency</span>
          </div>
          <span className="text-xs font-bold text-[var(--accent-coral)]">Distress SOS</span>
        </button>
      </motion.div>

      {/* Vehicle & Field Hardware Telemetry */}
      <motion.div variants={itemVariants} className="bg-[var(--bg-surface)] rounded-[16px] p-5 border border-[var(--border-hairline)]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
          Convoy Unit Telemetry (ECHO-07)
        </h3>

        <div className="grid grid-cols-2 gap-px bg-[var(--border-hairline)] border border-[var(--border-hairline)] rounded-[12px] overflow-hidden">
          <div className="bg-[var(--bg-surface)] p-3 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--text-primary)] text-[20px]">battery_charging_full</span>
              <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold">Aux Battery</span>
            </div>
            <span className="text-sm font-bold font-mono text-[var(--text-primary)] mt-1"><CountUp value={84} suffix="% (24.2V)" /></span>
          </div>

          <div className="bg-[var(--bg-surface)] p-3 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--text-primary)] text-[20px]">local_gas_station</span>
              <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold">Diesel Tank</span>
            </div>
            <span className="text-sm font-bold font-mono text-[var(--text-primary)] mt-1"><CountUp value={68} suffix="% (~380 km)" /></span>
          </div>

          <div className="bg-[var(--bg-surface)] p-3 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--text-primary)] text-[20px]">sensors</span>
              <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold">Tire Pressure</span>
            </div>
            <span className="text-sm font-bold font-mono text-[var(--text-primary)] mt-1"><CountUp value={36} suffix=" PSI" /></span>
          </div>

          <div className="bg-[var(--bg-surface)] p-3 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--text-primary)] text-[20px]">cell_wifi</span>
              <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold">Radio Link</span>
            </div>
            <span className="text-sm font-bold font-mono text-[var(--text-primary)] mt-1">UHF Ch 14</span>
          </div>
        </div>
      </motion.div>

      {/* Recent Field Activity Logs */}
      <motion.div variants={itemVariants} className="bg-[var(--bg-surface)] rounded-[16px] p-5 border border-[var(--border-hairline)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Live Activity Log
          </h3>
          <span className="text-[10px] font-mono text-primary">Unit: ECHO-07</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 text-xs">
            <div className="w-2 h-2 rounded-full bg-secondary mt-1.5 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-on-surface">Checkpoint Bravery Cleared</span>
                <span className="text-on-surface-variant font-mono text-[10px]">14m ago</span>
              </div>
              <p className="text-on-surface-variant text-[11px]">Identity verified and automated check-in logged to offline database.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-xs">
            <div className="w-2 h-2 rounded-full bg-tertiary mt-1.5 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-on-surface">Hazard Alert IR-992 Filed</span>
                <span className="text-on-surface-variant font-mono text-[10px]">25m ago</span>
              </div>
              <p className="text-on-surface-variant text-[11px]">Rockfall obstruction at Sela Ridge Kilometer 42 logged with photos.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-xs">
            <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-on-surface">Convoy Departure: Echo-1 Base</span>
                <span className="text-on-surface-variant font-mono text-[10px]">1h 10m ago</span>
              </div>
              <p className="text-on-surface-variant text-[11px]">En route to Sector 4 Alpha with cold-weather emergency medical cargo.</p>
            </div>
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
};
