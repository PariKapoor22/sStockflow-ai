import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { SyncQueueItem } from '../types';
import { incidentOfflineStore } from '../services/incident-offline-store.service';
import { incidentSyncService, SyncProgressEvent } from '../services/incident-sync.service';
import { IncidentTestRunner } from './IncidentTestRunner';

export const OfflineSyncCenter: React.FC = () => {
  const {
    isOnline,
    isSyncing,
    syncProgress,
    lastSyncedTimestamp,
    forceSync,
    syncQueue,
    removeItemFromQueue,
    retryQueueItem,
    addQueueItem,
    mapPackages,
    startPackageDownload,
    purgeMapPackage,
    totalCachedStorageBytes,
    showToast
  } = useApp();

  const [activeSwipeId, setActiveSwipeId] = useState<string | null>(null);
  const [activeSyncEvent, setActiveSyncEvent] = useState<SyncProgressEvent | null>(null);
  const [showTestRunner, setShowTestRunner] = useState<boolean>(false);

  useEffect(() => {
    const unsub = incidentSyncService.subscribe((event) => {
      setActiveSyncEvent(event);
    });
    return () => unsub();
  }, []);

  // Relative time helper
  const getRelativeTime = (ts: number) => {
    const diffSec = Math.floor((Date.now() - ts) / 1000);
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  };

  const pendingItems = syncQueue.filter((i) => i.status === 'pending' || i.status === 'failed');

  const handleAddSampleTelemetry = () => {
    const telId = `tel_${Date.now()}`;
    addQueueItem({
      report_id: telId,
      idempotency_key: `idemp_${telId}`,
      sync_stage: 'QUEUED',
      type: 'telemetry',
      title: `GPS Breadcrumb Batch #${Math.floor(Math.random() * 80 + 10)}`,
      subtitle: '45 Waypoints Queued',
      sizeBytes: 84000,
      status: 'pending',
      icon: 'timeline',
      color: '#a0caff',
      retryCount: 0,
      payload: { count: 45, interval: '2s', battery: '84%' }
    });
    showToast('Added sensor telemetry batch to offline queue');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.07 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  return (
    <motion.div 
      className="flex flex-col w-full gap-4 max-w-xl mx-auto pb-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      
      {/* Top Syncing Status Indicator */}
      {isSyncing && (
        <motion.div variants={itemVariants} className="flex justify-center -mt-2 mb-1">
          <div className="bg-surface-container/80 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-md border border-primary/30 animate-pulse">
            <span className="material-symbols-outlined text-[16px] animate-spin text-primary">refresh</span>
            <span className="text-[12px] font-medium text-text-primary">
              {activeSyncEvent
                ? `Syncing [${activeSyncEvent.stage}]: ${activeSyncEvent.progressPercent}%`
                : `Uploading queued items (${syncProgress}%)...`}
            </span>
          </div>
        </motion.div>
      )}

      {/* Primary Network Status Card */}
      <motion.div variants={itemVariants} className="card p-4 flex flex-col gap-2 relative overflow-hidden border-hairline">
        <div className="absolute -right-12 -top-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[12px] uppercase tracking-widest text-text-secondary mb-1 font-bold">
              Network Status
            </span>
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-[20px] ${isOnline ? 'text-secondary' : 'text-tertiary'}`}>
                {isOnline ? 'satellite_alt' : 'cloud_off'}
              </span>
              <span className="font-headline-md text-xl font-bold text-text-primary">
                {isOnline ? 'Online Uplink' : 'Offline Mode'}
              </span>
            </div>
          </div>

          <div className="w-12 h-12 rounded-full bg-surface-container/50 flex items-center justify-center shrink-0 shadow-sm relative pulse-sync border border-hairline">
            <span className={`material-symbols-outlined text-[24px] ${isOnline ? 'text-secondary' : 'text-text-secondary'}`}>
              {isOnline ? 'sync' : 'sync_problem'}
            </span>
          </div>
        </div>

        <p className="text-sm text-text-secondary mt-1 leading-relaxed">
          {isOnline
            ? 'Connected via tactical satellite mesh. High-speed synchronized link established.'
            : 'Operating on local IndexedDB storage. Data will sync automatically with exponential retry when connection is restored.'}
        </p>

        {/* Sync Action Strip */}
        <div className="flex items-center justify-between bg-surface-container/30 px-4 py-3 rounded-xl mt-2 border border-hairline">
          <div className="flex flex-col">
            <span className="text-xs text-text-secondary">
              Last synced: <span className="text-text-primary font-semibold">{getRelativeTime(lastSyncedTimestamp)}</span>
            </span>
            <span className="text-[10px] text-text-secondary/70">
              {pendingItems.length} items waiting in local queue
            </span>
          </div>

          <button
            onClick={forceSync}
            disabled={isSyncing}
            id="sync-btn"
            className="bg-primary hover:bg-primary/90 transition-all active:scale-95 text-on-primary font-bold text-sm px-5 py-2.5 rounded-full shadow-[0_0_15px_rgba(251,187,69,0.2)] flex items-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            <span className={`material-symbols-outlined text-[18px] ${isSyncing ? 'animate-spin' : ''}`}>
              {isSyncing ? 'refresh' : 'sync'}
            </span>
            {isSyncing ? 'Syncing...' : 'Force Sync'}
          </button>
        </div>
      </motion.div>

      {/* Pending Uploads Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between mt-2 px-1">
        <h2 className="text-xs font-bold uppercase tracking-widest text-text-secondary">
          Pending Uploads ({pendingItems.length})
        </h2>
        <button
          onClick={handleAddSampleTelemetry}
          className="text-xs text-primary hover:underline flex items-center gap-1 font-bold cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px]">add</span>
          Add Test Queue Item
        </button>
      </motion.div>

      {/* Pending Upload Items List */}
      <motion.div variants={itemVariants} className="flex flex-col gap-2.5">
        {syncQueue.length === 0 ? (
          <div className="bg-surface-container/40 border border-hairline rounded-xl p-6 text-center text-text-secondary">
            <span className="material-symbols-outlined text-[32px] text-secondary mb-2 block">cloud_done</span>
            <p className="text-sm font-semibold text-text-primary">Queue is clear</p>
            <p className="text-xs text-text-secondary mt-0.5">All field reports & telemetry are synced to tactical HQ.</p>
          </div>
        ) : (
          syncQueue.map((item) => {
            const isSwiped = activeSwipeId === item.id;

            return (
              <div key={item.id} className="relative overflow-hidden rounded-xl shadow-sm border border-hairline bg-surface-container/30">
                {/* Swipeable Action Buttons on Right */}
                <div className="absolute inset-y-0 right-0 flex z-0">
                  <button
                    onClick={() => retryQueueItem(item.id)}
                    className="w-16 bg-surface-container flex flex-col items-center justify-center text-text-secondary hover:text-text-primary transition-colors active:bg-surface-container/80"
                  >
                    <span className="material-symbols-outlined text-[20px]">refresh</span>
                    <span className="text-[10px] uppercase font-bold mt-1">Retry</span>
                  </button>
                  <button
                    onClick={() => removeItemFromQueue(item.id)}
                    className="w-16 bg-error text-white flex flex-col items-center justify-center hover:bg-error/90 transition-colors active:opacity-80"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                    <span className="text-[10px] uppercase font-bold mt-1">Cancel</span>
                  </button>
                </div>

                {/* Main Content Card (Swiped or Normal) */}
                <div
                  onClick={() => setActiveSwipeId(isSwiped ? null : item.id)}
                  className={`card !rounded-none p-3.5 flex items-center gap-3 relative overflow-hidden group cursor-pointer transition-transform duration-300 ${
                    isSwiped ? '-translate-x-32 shadow-md' : 'translate-x-0'
                  }`}
                >
                  {/* Left Color Accent Bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ backgroundColor: item.status === 'synced' ? '#4ae183' : item.color }}
                  />

                  {/* Icon Circle */}
                  <div className="w-10 h-10 rounded-full bg-surface-container/50 flex items-center justify-center shrink-0 shadow-inner border border-hairline">
                    <span className="material-symbols-outlined text-[20px]" style={{ color: item.color }}>
                      {item.icon}
                    </span>
                  </div>

                  {/* Text Details */}
                  <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-text-primary truncate">
                        {item.title}
                      </span>
                      {item.retryCount > 0 && (
                        <span className="text-[9px] font-mono bg-surface-container px-1.5 py-0.5 rounded-sm text-tertiary">
                          R{item.retryCount}
                        </span>
                      )}
                    </div>

                    <span className="text-[12px] font-medium text-text-secondary flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      {item.status === 'synced' ? (
                        <span className="text-secondary font-bold">Uploaded & Synced</span>
                      ) : (
                        item.subtitle
                      )}
                      <span className="text-text-secondary/50 text-[10px] font-mono ml-1">
                        ({(item.sizeBytes / 1024).toFixed(0)} KB)
                      </span>
                    </span>
                  </div>

                  {/* Status Indicator / Pulse Icon */}
                  <div className="w-8 h-8 rounded-full bg-surface-container/50 flex items-center justify-center shadow-inner shrink-0 border border-hairline">
                    {item.status === 'synced' ? (
                      <span className="material-symbols-outlined text-secondary text-[18px]">check_circle</span>
                    ) : isSyncing ? (
                      <span className="material-symbols-outlined text-primary text-[16px] animate-spin">refresh</span>
                    ) : (
                      <span className="material-symbols-outlined text-text-secondary text-[16px] animate-pulse">cloud_upload</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </motion.div>

      {/* Offline Map Tiles Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between mt-3 px-1">
        <h2 className="text-xs font-bold uppercase tracking-widest text-text-secondary">
          Offline Map Tiles
        </h2>
        <span className="text-[11px] font-mono text-text-secondary">
          Cached: <span className="text-secondary font-bold">{(totalCachedStorageBytes / (1024 * 1024 * 1024)).toFixed(2)} GB</span>
        </span>
      </motion.div>

      {/* Offline Map Tiles Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {mapPackages.map((pkg) => {
          const isDownloaded = pkg.status === 'downloaded';
          const isDownloading = pkg.status === 'downloading';
          const isUpdateAvailable = pkg.status === 'update_available';

          return (
            <div
              key={pkg.id}
              className="card overflow-hidden flex flex-col justify-between"
            >
              {/* Header with image & region */}
              <div className="h-28 bg-surface-container relative overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay transition-transform duration-500 hover:scale-105"
                  style={{ backgroundImage: `url('${pkg.imageUrl}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-surface via-bg-surface/60 to-transparent" />
                
                <div className="absolute top-2 left-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-black/50 text-text-secondary backdrop-blur-sm border border-hairline">
                    {pkg.region}
                  </span>
                </div>

                <div className="absolute bottom-2 left-3 right-3 flex justify-between items-end">
                  <div>
                    <span className="text-[10px] font-mono text-primary uppercase block font-bold">
                      {pkg.sectorCode}
                    </span>
                    <span className="font-headline-md text-base font-bold text-text-primary">
                      {pkg.name}
                    </span>
                  </div>
                  <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full shadow-sm ${
                    isDownloaded
                      ? 'bg-secondary/20 text-secondary'
                      : isDownloading
                      ? 'bg-tertiary/20 text-tertiary'
                      : 'bg-primary/20 text-primary'
                  }`}>
                    {pkg.sizeFormatted}
                  </span>
                </div>
              </div>

              {/* Progress & Action Details */}
              <div className="p-3.5 flex flex-col gap-2.5 border-t border-hairline">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-primary flex items-center gap-1.5 font-medium">
                    {isDownloaded ? (
                      <>
                        <span className="material-symbols-outlined text-[16px] text-secondary">check_circle</span>
                        Downloaded
                      </>
                    ) : isDownloading ? (
                      <>
                        <span className="material-symbols-outlined text-[16px] text-tertiary animate-spin">sync</span>
                        Downloading... {pkg.downloadProgress}%
                      </>
                    ) : isUpdateAvailable ? (
                      <>
                        <span className="material-symbols-outlined text-[16px] text-tertiary">update</span>
                        Update Available
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px] text-text-secondary/60">cloud_download</span>
                        Available Offline
                      </>
                    )}
                  </span>
                  <span className="text-text-secondary font-mono text-[11px]">{pkg.version}</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-surface-container/50 rounded-full h-1.5 overflow-hidden shadow-inner border border-hairline">
                  {isDownloaded && <div className="bg-secondary h-1.5 rounded-full w-full" />}
                  {isDownloading && (
                    <div
                      className="bg-tertiary h-1.5 rounded-full relative overflow-hidden transition-all duration-300"
                      style={{ width: `${pkg.downloadProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/30 animate-shimmer" />
                    </div>
                  )}
                  {pkg.status === 'available' && <div className="bg-surface-container h-1.5 rounded-full w-0" />}
                  {isUpdateAvailable && <div className="bg-tertiary/50 h-1.5 rounded-full w-full" />}
                </div>

                {/* Tile Action Controls */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-[11px] text-text-secondary font-mono">
                    {pkg.tileCount.toLocaleString()} tiles
                  </span>

                  {isDownloaded ? (
                    <button
                      onClick={() => purgeMapPackage(pkg.id)}
                      className="text-text-secondary hover:text-error text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                      Purge Cache
                    </button>
                  ) : isDownloading ? (
                    <span className="text-tertiary text-[11px] font-bold">Streaming tiles...</span>
                  ) : (
                    <button
                      onClick={() => startPackageDownload(pkg.id)}
                      className="bg-primary/20 hover:bg-primary text-primary hover:text-bg-base text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">download</span>
                      Download Pack
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Storage & Testing Suite Section */}
      <motion.div variants={itemVariants} className="flex items-center justify-between mt-3 px-1">
        <h2 className="text-xs font-bold uppercase tracking-widest text-text-secondary">
          Diagnostics & Architecture Verification
        </h2>
        <button
          onClick={() => setShowTestRunner(!showTestRunner)}
          className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">
            {showTestRunner ? 'expand_less' : 'biotech'}
          </span>
          {showTestRunner ? 'Hide Test Suite' : 'Open Verification Suite'}
        </button>
      </motion.div>

      {/* Interactive Automated Test Runner */}
      {showTestRunner && (
        <motion.div variants={itemVariants}>
          <IncidentTestRunner />
        </motion.div>
      )}

    </motion.div>
  );
};
