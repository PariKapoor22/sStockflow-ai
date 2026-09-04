import React from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { AppTab } from '../types';

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, syncQueue, activeSOS } = useApp();
  const { t } = useLanguage();

  const pendingSyncCount = syncQueue.filter(
    (i) => i.status === 'pending' || i.status === 'failed'
  ).length;

  const tabs: { id: AppTab; labelKey: string; icon: string; isSOS?: boolean }[] = [
    { id: 'driver-home', labelKey: 'nav.dashboard', icon: 'home' },
    { id: 'resilient-navigation', labelKey: 'nav.navigate', icon: 'explore' },
    { id: 'incident-reporting', labelKey: 'nav.report', icon: 'assignment_late' },
    { id: 'emergency-sos', labelKey: 'nav.sos', icon: 'emergency', isSOS: true },
    { id: 'offline-sync-center', labelKey: 'nav.sync', icon: 'cloud_off' }
  ];

  return (
    <nav className="fixed bottom-0 w-full z-40 pb-safe bg-surface-container/95 backdrop-blur-xl border-t border-outline-variant/30">
      <div className="flex justify-between items-center h-20 px-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const label = t(tab.labelKey);

          if (tab.isSOS) {
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setCurrentTab(tab.id)}
                className={`relative flex flex-col items-center justify-center flex-1 gap-1 h-14 rounded-xl transition-all cursor-pointer ${
                  isActive || activeSOS
                    ? 'text-error bg-error/15 scale-105'
                    : 'text-error hover:bg-error/10'
                }`}
              >
                {activeSOS && (
                  <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-error beacon-ping" />
                )}
                <span className="material-symbols-outlined text-[28px] font-bold">
                  {tab.icon}
                </span>
                <span className="text-[12px] font-bold leading-none">{label}</span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => setCurrentTab(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 gap-1 h-14 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-secondary bg-secondary/10 font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab.id === 'offline-sync-center' && pendingSyncCount > 0 && (
                <span className="absolute top-1 right-2 bg-tertiary text-on-tertiary text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow">
                  {pendingSyncCount}
                </span>
              )}
              <span className="material-symbols-outlined text-[28px]">
                {tab.icon}
              </span>
              <span className="text-[12px] font-medium leading-none">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

