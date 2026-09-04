import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { OfflineSyncCenter } from './components/OfflineSyncCenter';
import { ResilientNavigation } from './components/ResilientNavigation';
import { DriverHome } from './components/DriverHome';
import { IncidentReporting } from './components/IncidentReporting';
import { EmergencySOS } from './components/EmergencySOS';
import { ActiveDrivingHUD } from './components/ActiveDrivingHUD';

const MainContent: React.FC = () => {
  const { currentTab, toastMessage, isDrivingJourney } = useApp();

  return (
    <div className="flex flex-col min-h-screen bg-[#101418] text-[#e1e2e9] font-sans">
      {/* Fixed Tactical Header */}
      <Header currentTab={currentTab} />

      {/* Main Content Area */}
      <main className="flex-1 pt-20 pb-24 px-3 sm:px-4 max-w-xl mx-auto w-full overflow-y-auto">
        {currentTab === 'driver-home' && <DriverHome />}
        {currentTab === 'resilient-navigation' && <ResilientNavigation />}
        {currentTab === 'incident-reporting' && <IncidentReporting />}
        {currentTab === 'emergency-sos' && <EmergencySOS />}
        {currentTab === 'offline-sync-center' && <OfflineSyncCenter />}
      </main>

      {/* Fixed Tactical Bottom Nav */}
      <BottomNav />

      {/* Fullscreen Google Maps Navigation HUD */}
      {isDrivingJourney && <ActiveDrivingHUD />}

      {/* Toast Notification HUD */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2.5 bg-surface-container-high/95 backdrop-blur-md border border-primary/40 text-on-surface rounded-xl shadow-2xl flex items-center gap-2 text-xs font-medium max-w-[90vw] animate-fadeIn">
          <span className="material-symbols-outlined text-primary text-[18px] shrink-0">info</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </LanguageProvider>
  );
}

