import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

export const EmergencySOS: React.FC = () => {
  const { currentGPS, activeSOS, triggerSOS, triggerReport, cancelSOS, showToast } = useApp();

  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [medicalNeeded, setMedicalNeeded] = useState<boolean>(false);
  const [vehicleDisabled, setVehicleDisabled] = useState<boolean>(false);
  const [threatPresent, setThreatPresent] = useState<boolean>(false);
  const [satelliteTransmissionPulse, setSatelliteTransmissionPulse] = useState<number>(1);

  const holdIntervalRef = useRef<any>(null);

  // Hold-to-activate countdown logic (3000ms)
  useEffect(() => {
    if (isHolding && !activeSOS) {
      holdIntervalRef.current = setInterval(() => {
        setHoldProgress((prev) => {
          if (prev >= 100) {
            clearInterval(holdIntervalRef.current);
            triggerSOS({
              medical: medicalNeeded,
              disabled: vehicleDisabled,
              threat: threatPresent
            });
            return 0;
          }
          return prev + 5; // reaches 100 in ~20 steps * 100ms = 2s
        });
      }, 100);
    } else {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
      setHoldProgress(0);
    }

    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, [isHolding, activeSOS, medicalNeeded, vehicleDisabled, threatPresent, triggerSOS]);

  // Satellite pulse animation increment
  useEffect(() => {
    if (!activeSOS) return;
    const interval = setInterval(() => {
      setSatelliteTransmissionPulse((p) => p + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeSOS]);

  return (
    <div className="flex flex-col w-full gap-4 max-w-xl mx-auto pb-6">
      
      {activeSOS ? (
        /* Active Distress Beacon View */
        <div className="bg-surface-container rounded-2xl p-5 border-2 border-error shadow-2xl flex flex-col gap-4 relative overflow-hidden animate-pulse-slow">
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-error/15 rounded-full blur-3xl pointer-events-none" />
          
          {/* Top Pulsing Beacon */}
          <div className="flex flex-col items-center text-center gap-2 pt-2">
            <div className="relative flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-error/20 beacon-ping absolute" />
              <div className="w-16 h-16 rounded-full bg-error flex items-center justify-center text-on-error shadow-[0_0_25px_rgba(255,180,171,0.8)]">
                <span className="material-symbols-outlined text-[36px] font-bold">emergency</span>
              </div>
            </div>

            <span className="text-xs font-mono font-bold uppercase tracking-widest text-error mt-2">
              🚨 SATELLITE DISTRESS BEACON ACTIVE
            </span>
            <h2 className="font-headline-md text-2xl font-black text-on-surface">
              Broadcasting SOS Coordinates
            </h2>
            <p className="text-xs text-on-surface-variant max-w-sm">
              Emergency transponder is transmitting priority location telemetry over military satellite constellation.
            </p>
          </div>

          {/* Broadcast Telemetry Card */}
          <div className="bg-surface-container-high p-4 rounded-xl border border-error/40 text-xs font-mono space-y-2">
            <div className="flex justify-between items-center text-on-surface-variant border-b border-outline-variant/30 pb-2">
              <span>BEACON ID:</span>
              <span className="text-error font-bold">{activeSOS.id}</span>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>VEHICLE / UNIT:</span>
              <span className="text-on-surface font-bold">UNIT-ECHO-07 (Sgt. J. Vance)</span>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>EXACT COORDINATES:</span>
              <span className="text-primary font-bold">
                {currentGPS.latitude.toFixed(5)}°N, {currentGPS.longitude.toFixed(5)}°E
              </span>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>ELEVATION / ALTITUDE:</span>
              <span className="text-on-surface font-bold">{currentGPS.altitude || 3048}m ASL</span>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>SAT BURST TRANSMISSIONS:</span>
              <span className="text-secondary font-bold">Pulse #{satelliteTransmissionPulse} Transmitted OK</span>
            </div>
          </div>

          {/* Emergency Radio Channels */}
          <div className="bg-surface-container-high p-3.5 rounded-xl border border-outline-variant/30 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1.5">
              Emergency Radio Guard Channels
            </span>
            <div className="grid grid-cols-2 gap-2 text-center font-mono">
              <div className="bg-surface-container p-2 rounded-lg">
                <span className="text-[10px] text-on-surface-variant block">Tactical Mesh</span>
                <span className="text-xs font-bold text-primary">UHF CH 14</span>
              </div>
              <div className="bg-surface-container p-2 rounded-lg">
                <span className="text-[10px] text-on-surface-variant block">Military Guard</span>
                <span className="text-xs font-bold text-secondary">243.0 MHz</span>
              </div>
            </div>
          </div>

          {/* Cancel SOS Action */}
          <button
            onClick={cancelSOS}
            className="w-full bg-surface-container-high hover:bg-surface-container-highest border border-error/50 text-error hover:text-on-surface py-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 mt-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">cancel</span>
            Cancel Distress Beacon (False Alarm)
          </button>
        </div>
      ) : (
        /* Standby / Armed SOS View */
        <div className="flex flex-col gap-4">
          
          {/* Top Warning Card */}
          <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/30 shadow-md">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="material-symbols-outlined text-error text-[24px]">warning</span>
              <h3 className="font-bold text-base text-on-surface">Emergency Distress Transponder</h3>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Use only in critical situations requiring immediate tactical extraction, severe trauma, or armed threat.
            </p>
          </div>

          {/* Emergency Condition Toggles */}
          <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/30 shadow-md flex flex-col gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Select Distress Condition(s)
            </span>

            <button
              type="button"
              onClick={() => setMedicalNeeded(!medicalNeeded)}
              className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                medicalNeeded
                  ? 'bg-error/20 border-error text-on-surface font-bold'
                  : 'bg-surface-container-high border-outline-variant/30 text-on-surface-variant'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-error text-[22px]">medical_services</span>
                <div>
                  <span className="text-xs font-bold block">Medical Evac Required</span>
                  <span className="text-[11px] opacity-75">Severe injury or trauma in convoy</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[20px]">
                {medicalNeeded ? 'check_box' : 'check_box_outline_blank'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setVehicleDisabled(!vehicleDisabled)}
              className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                vehicleDisabled
                  ? 'bg-tertiary/20 border-tertiary text-on-surface font-bold'
                  : 'bg-surface-container-high border-outline-variant/30 text-on-surface-variant'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-tertiary text-[22px]">car_crash</span>
                <div>
                  <span className="text-xs font-bold block">Vehicle Immobile / Stranded</span>
                  <span className="text-[11px] opacity-75">Mechanical breakdown, rolled over or blocked</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[20px]">
                {vehicleDisabled ? 'check_box' : 'check_box_outline_blank'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setThreatPresent(!threatPresent)}
              className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                threatPresent
                  ? 'bg-error/20 border-error text-on-surface font-bold'
                  : 'bg-surface-container-high border-outline-variant/30 text-on-surface-variant'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-error text-[22px]">gavel</span>
                <div>
                  <span className="text-xs font-bold block">Hostile Contact / Security Hazard</span>
                  <span className="text-[11px] opacity-75">Armed threat or ambush situation</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[20px]">
                {threatPresent ? 'check_box' : 'check_box_outline_blank'}
              </span>
            </button>
          </div>

          {/* Hold to Activate Button */}
          <div className="bg-surface-container rounded-xl p-6 border border-error/30 shadow-xl flex flex-col items-center justify-center text-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-error">
              Hold Button For 2 Seconds to Trigger
            </span>

            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* Circular Progress Ring */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  stroke="#272a2f"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  stroke="#ffb4ab"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={390}
                  strokeDashoffset={390 - (390 * holdProgress) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-100"
                />
              </svg>

              {/* Center Trigger Button */}
              <button
                onMouseDown={() => setIsHolding(true)}
                onMouseUp={() => setIsHolding(false)}
                onMouseLeave={() => setIsHolding(false)}
                onTouchStart={() => setIsHolding(true)}
                onTouchEnd={() => setIsHolding(false)}
                className={`absolute w-24 h-24 rounded-full flex flex-col items-center justify-center transition-transform active:scale-95 shadow-xl select-none cursor-pointer ${
                  isHolding
                    ? 'bg-error text-on-error scale-105 shadow-[0_0_20px_rgba(255,180,171,0.6)]'
                    : 'bg-error/20 hover:bg-error/30 text-error border-2 border-error'
                }`}
              >
                <span className="material-symbols-outlined text-[36px] font-bold">emergency</span>
                <span className="text-[11px] font-black tracking-wider uppercase mt-0.5">
                  {isHolding ? `${Math.round(holdProgress)}%` : 'HOLD SOS'}
                </span>
              </button>
            </div>

            <p className="text-[11px] text-on-surface-variant max-w-xs">
              Current coordinates ({currentGPS.latitude.toFixed(4)}°N, {currentGPS.longitude.toFixed(4)}°E) will be packaged and broadcast over satellite burst.
            </p>
          </div>

          {/* Report Button */}
          <button
            type="button"
            onClick={() => triggerReport()}
            className="bg-surface-container rounded-xl p-4 border border-outline-variant/30 shadow-md flex items-center justify-center gap-3 cursor-pointer hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-secondary text-[24px]">campaign</span>
            <span className="font-bold text-base text-on-surface">Broadcast General Report</span>
          </button>

        </div>
      )}

    </div>
  );
};
