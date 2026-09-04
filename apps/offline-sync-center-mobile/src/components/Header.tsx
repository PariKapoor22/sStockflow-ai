import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage, SupportedLanguage } from '../context/LanguageContext';
import { AppTab } from '../types';
import { AmbientGlow } from './AmbientGlow';
import { motion } from 'motion/react';

interface HeaderProps {
  currentTab: AppTab;
}

export const Header: React.FC<HeaderProps> = ({ currentTab }) => {
  const { 
    isOnline, 
    networkSimulationMode, 
    setNetworkSimulationMode, 
    gpsSource, 
    setGpsSource,
    isSimulatingMovement,
    setIsSimulatingMovement,
    activeSOS,
    syncQueue,
    showToast
  } = useApp();

  const { language, setLanguage, t, languages } = useLanguage();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const pendingCount = syncQueue.filter(i => i.status === 'pending' || i.status === 'failed').length;

  // Close language dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    if (isLangMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLangMenuOpen]);

  const getTabTitle = () => {
    switch (currentTab) {
      case 'driver-home':
        return t('header.dashboard');
      case 'resilient-navigation':
        return t('header.navigate');
      case 'incident-reporting':
        return t('header.report');
      case 'emergency-sos':
        return t('header.sos');
      case 'offline-sync-center':
        return t('header.sync');
      default:
        return 'Tactical Ops';
    }
  };

  const handleLanguageChange = (code: SupportedLanguage) => {
    setLanguage(code);
    setIsLangMenuOpen(false);
    const selectedLang = languages.find(l => l.code === code);
    showToast(`Language switched to ${selectedLang?.name || code}`);
  };

  const currentLangObj = languages.find(l => l.code === language) || languages[0];

  return (
    <>
      <AmbientGlow />
      <header className="fixed top-0 w-full z-40 bg-[var(--bg-base)]/80 backdrop-blur-xl pt-safe border-b border-[var(--border-hairline)]">
        <div className="h-16 px-3 sm:px-4 flex items-center justify-between gap-2 max-w-xl mx-auto">
          
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div 
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container rounded-full ring-1 ring-outline-variant/30 cursor-pointer hover:ring-primary/50 transition-all"
              title="Mesh Status & Diagnostics"
            >
              <div className="relative flex items-center justify-center">
                {/* Concentric animated ring */}
                <motion.div 
                  className={`absolute w-2.5 h-2.5 rounded-full ${activeSOS ? 'bg-error' : isOnline ? 'bg-status-green' : 'bg-tertiary'}`}
                  animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                />
                <div 
                  className={`relative w-2.5 h-2.5 rounded-full ${
                    activeSOS 
                      ? 'bg-error' 
                      : isOnline 
                      ? 'bg-[var(--status-green,#4ae183)]' 
                      : 'bg-tertiary'
                  }`} 
                />
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                {activeSOS ? 'SOS' : isOnline ? t('header.online_mode') : t('header.offline_mode')}
              </span>
            </div>

            {pendingCount > 0 && (
              <div className="hidden xs:flex items-center gap-1 px-1.5 py-0.5 bg-tertiary/20 text-tertiary rounded-full text-[10px] font-bold font-mono">
                <span>{pendingCount}</span>
              </div>
            )}
          </div>

          {/* Screen Title */}
          <h1 className="font-headline-md text-sm md:text-base font-medium tracking-wide text-primary truncate text-center flex-1">
            {getTabTitle()}
          </h1>

          {/* Right Action Icons: Language Toggle Dropdown & Settings */}
          <div className="flex items-center gap-1.5 shrink-0">
            
            {/* Language Switcher Dropdown Button */}
            <div className="relative" ref={langMenuRef}>
              <button
                id="language-selector-button"
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-transparent border border-[var(--border-hairline)] text-[var(--text-primary)] text-xs font-medium transition-all hover:border-opacity-100 cursor-pointer"
                title={t('header.change_language')}
                aria-label="Change Language"
                aria-haspopup="true"
                aria-expanded={isLangMenuOpen}
              >
                <span className="text-[14px] leading-none">{currentLangObj.flag}</span>
                <span className="font-mono uppercase text-[11px]">{currentLangObj.code}</span>
                <span className="material-symbols-outlined text-[14px] text-[var(--text-secondary)]">
                  {isLangMenuOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {/* Language Selection Menu */}
              {isLangMenuOpen && (
                <div 
                  id="language-dropdown-menu"
                  className="absolute right-0 mt-2 w-44 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-1 animate-fadeIn backdrop-blur-lg"
                >
                  <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider border-b border-[var(--border-hairline)] flex items-center justify-between mb-1">
                    <span>{t('header.select_language')}</span>
                    <span className="material-symbols-outlined text-[14px]">translate</span>
                  </div>

                  {languages.map((item) => {
                    const isSelected = language === item.code;
                    return (
                      <button
                        key={item.code}
                        id={`language-option-${item.code}`}
                        onClick={() => handleLanguageChange(item.code)}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary/20 text-primary font-bold shadow-md'
                            : 'hover:bg-[var(--bg-base)] text-[var(--text-primary)]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base leading-none">{item.flag}</span>
                          <div className="flex flex-col text-left">
                            <span className="font-bold leading-tight">{item.nativeName}</span>
                            <span className={`text-[10px] ${isSelected ? 'text-primary/80' : 'text-[var(--text-secondary)]'}`}>
                              {item.name}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="material-symbols-outlined text-[16px]">check</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Diagnostics / Settings Button */}
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="w-8 h-8 rounded-full bg-transparent border border-[var(--border-hairline)] transition-all flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-opacity-100 cursor-pointer"
              title="Tactical System Diagnostics & Simulation Controls"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
            </button>
          </div>
        </div>
      </header>

      {/* System Diagnostics & Simulation Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-surface-container border border-outline-variant/50 rounded-2xl p-5 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">tune</span>
                <h3 className="font-bold text-lg text-on-surface">Tactical Field Diagnostics</h3>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Operator Card */}
            <div className="bg-surface-container-high p-3 rounded-xl mb-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary flex items-center justify-center text-primary font-bold text-lg">
                07
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-on-surface text-sm">Sgt. J. Vance</h4>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <span>Unit: ECHO-07 (Tawang Patrol)</span>
                  <span>•</span>
                  <span className="text-secondary font-semibold">Active Duty</span>
                </div>
              </div>
            </div>

            {/* Language Selector inside diagnostics as well */}
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                {t('header.change_language')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLanguage(l.code)}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      language === l.code
                        ? 'bg-primary text-on-primary border-primary font-bold shadow-md'
                        : 'bg-surface-container-high border-outline-variant/30 text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="text-base block mb-0.5">{l.flag}</span>
                    <span className="text-xs block font-bold truncate">{l.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Network Mode Simulation */}
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                {t('header.mesh_link')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setNetworkSimulationMode('offline')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    networkSimulationMode === 'offline'
                      ? 'bg-tertiary/20 border-tertiary text-tertiary font-bold shadow-md'
                      : 'bg-surface-container-high border-outline-variant/30 text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px] block mb-1">cloud_off</span>
                  <span className="text-xs">{t('header.offline_mode')}</span>
                </button>

                <button
                  onClick={() => setNetworkSimulationMode('spotty')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    networkSimulationMode === 'spotty'
                      ? 'bg-primary/20 border-primary text-primary font-bold shadow-md'
                      : 'bg-surface-container-high border-outline-variant/30 text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px] block mb-1">cell_wifi</span>
                  <span className="text-xs">{t('header.spotty_mode')}</span>
                </button>

                <button
                  onClick={() => setNetworkSimulationMode('online')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    networkSimulationMode === 'online'
                      ? 'bg-secondary/20 border-secondary text-secondary font-bold shadow-md'
                      : 'bg-surface-container-high border-outline-variant/30 text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px] block mb-1">satellite_alt</span>
                  <span className="text-xs">{t('header.online_mode')}</span>
                </button>
              </div>
            </div>

            {/* GPS Tracking Source */}
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Location Tracking Source
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  onClick={() => setGpsSource('simulation')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    gpsSource === 'simulation'
                      ? 'bg-primary/20 border-primary text-primary font-bold'
                      : 'bg-surface-container-high border-outline-variant/30 text-on-surface-variant'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="material-symbols-outlined text-[18px]">route</span>
                    <span className="text-xs font-bold">Mountain Patrol</span>
                  </div>
                  <p className="text-[11px] opacity-80">Simulated convoy movement</p>
                </button>

                <button
                  onClick={() => setGpsSource('device')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    gpsSource === 'device'
                      ? 'bg-primary/20 border-primary text-primary font-bold'
                      : 'bg-surface-container-high border-outline-variant/30 text-on-surface-variant'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="material-symbols-outlined text-[18px]">my_location</span>
                    <span className="text-xs font-bold">Real Device GPS</span>
                  </div>
                  <p className="text-[11px] opacity-80">Browser Geolocation API</p>
                </button>
              </div>

              {gpsSource === 'simulation' && (
                <div className="flex items-center justify-between p-2.5 bg-surface-container-high rounded-xl text-xs">
                  <span className="text-on-surface">Simulate Vehicle Driving:</span>
                  <button
                    onClick={() => setIsSimulatingMovement(!isSimulatingMovement)}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      isSimulatingMovement ? 'bg-secondary text-on-secondary' : 'bg-surface-variant text-on-surface-variant'
                    }`}
                  >
                    {isSimulatingMovement ? 'Active' : 'Paused'}
                  </button>
                </div>
              )}
            </div>

            {/* Vehicle & Telemetry Status */}
            <div className="bg-surface-container-high p-3 rounded-xl mb-4 text-xs space-y-2">
              <div className="flex justify-between items-center text-on-surface-variant">
                <span>Vehicle Battery:</span>
                <span className="font-mono text-secondary font-bold">84% (24.2V)</span>
              </div>
              <div className="flex justify-between items-center text-on-surface-variant">
                <span>Diesel Reserve:</span>
                <span className="font-mono text-on-surface font-bold">68% (~380 km)</span>
              </div>
              <div className="flex justify-between items-center text-on-surface-variant">
                <span>Radio Mesh Frequency:</span>
                <span className="font-mono text-primary font-bold">UHF CH 14 (446.1 MHz)</span>
              </div>
            </div>

            <button
              onClick={() => setIsSettingsOpen(false)}
              className="w-full bg-[var(--text-primary)] text-[var(--bg-base)] py-2.5 rounded-full font-medium text-sm transition-all duration-150 ease-out hover:brightness-105 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};

