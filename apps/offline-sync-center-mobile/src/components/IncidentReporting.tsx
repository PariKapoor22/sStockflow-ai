import React, { useState, useEffect } from 'react';
import { motion, type Variants } from 'motion/react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { IncidentCategory, IncidentSeverity, IncidentReport, PhotoAttachment, SyncStatusStage } from '../types';
import { toGeoJSONPoint, toGeoJSONFeature, evaluateGPSQuality, formatCoordinates } from '../services/gps-geojson.service';
import { validatePhotoFile, validatePhotoCount, compressPhoto, createPhotoAttachment } from '../services/photo-compression.service';
import { incidentOfflineStore } from '../services/incident-offline-store.service';
import { incidentSyncService, SyncProgressEvent } from '../services/incident-sync.service';
import { ConflictDialog } from './ConflictDialog';
import { TacticalMap } from './TacticalMap';

const DISTRICT_ROAD_PRESETS = [
  'Tawang-Sela Pass Highway (NH-13 Km 42)',
  'Sector 4B Ridge Pass Corridor',
  'Dirang-Bomdila Forward Route',
  'Zimithang Outpost Supply Line',
  'Bum La Mountain Pass Mile 18'
];

export const IncidentReporting: React.FC = () => {
  const { 
    currentGPS, 
    isOnline, 
    incidents, 
    deleteIncident, 
    setCurrentTab, 
    showToast,
    broadcastIncident
  } = useApp();
  const { t } = useLanguage();

  // Form Fields
  const [category, setCategory] = useState<IncidentCategory>('landslide');
  const [severity, setSeverity] = useState<IncidentSeverity>('high');
  const [districtRoadSegment, setDistrictRoadSegment] = useState(DISTRICT_ROAD_PRESETS[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [observationTime, setObservationTime] = useState<string>(() => new Date().toISOString().slice(0, 16));

  // GPS State & Mode
  const [isManualPinMode, setIsManualPinMode] = useState<boolean>(false);
  const [manualLat, setManualLat] = useState<number>(currentGPS.latitude);
  const [manualLng, setManualLng] = useState<number>(currentGPS.longitude);
  const [manualAlt, setManualAlt] = useState<number>(currentGPS.altitude || 3048);
  const [manualAccuracy, setManualAccuracy] = useState<number>(10.0);

  // Active coordinates
  const activeLat = isManualPinMode ? manualLat : currentGPS.latitude;
  const activeLng = isManualPinMode ? manualLng : currentGPS.longitude;
  const activeAlt = isManualPinMode ? manualAlt : (currentGPS.altitude || 3048);
  const activeAccuracy = isManualPinMode ? manualAccuracy : currentGPS.accuracy;
  const gpsQuality = evaluateGPSQuality(activeAccuracy, isManualPinMode);

  // Photos State
  const [photoAttachments, setPhotoAttachments] = useState<PhotoAttachment[]>([]);
  const [isCompressingPhotos, setIsCompressingPhotos] = useState<boolean>(false);

  // Submission & Sync Pipeline State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeSyncProgress, setActiveSyncProgress] = useState<SyncProgressEvent | null>(null);
  const [viewMode, setViewMode] = useState<'form' | 'history'>('form');

  // Conflict Resolution Modal State
  const [conflictIncident, setConflictIncident] = useState<IncidentReport | null>(null);
  const [showGeoJSONPreview, setShowGeoJSONPreview] = useState<boolean>(false);

  // Subscribe to real-time sync progression events
  useEffect(() => {
    const unsubscribe = incidentSyncService.subscribe((event) => {
      setActiveSyncProgress(event);
      if (event.stage === 'CONFLICT' && event.serverRevision) {
        // Automatically open conflict dialog when conflict occurs
        incidentOfflineStore.getIncident(event.report_id).then((inc) => {
          if (inc) setConflictIncident(inc);
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const categories: { id: IncidentCategory; labelKey: string; icon: string }[] = [
    { id: 'landslide', labelKey: 'incident.landslide', icon: 'landslide' },
    { id: 'roadblock', labelKey: 'incident.roadblock', icon: 'block' },
    { id: 'bridge_damage', labelKey: 'incident.bridge_damage', icon: 'warning' },
    { id: 'vehicle_breakdown', labelKey: 'incident.breakdown', icon: 'car_crash' },
    { id: 'weather_hazard', labelKey: 'incident.weather', icon: 'ac_unit' },
    { id: 'medical_emergency', labelKey: 'incident.medical', icon: 'emergency' }
  ];

  const severities: { id: IncidentSeverity; labelKey: string; color: string }[] = [
    { id: 'low', labelKey: 'incident.low', color: 'bg-outline-variant/30 text-on-surface' },
    { id: 'medium', labelKey: 'incident.medium', color: 'bg-primary/20 text-primary' },
    { id: 'high', labelKey: 'incident.high', color: 'bg-tertiary/20 text-tertiary' },
    { id: 'critical', labelKey: 'incident.critical', color: 'bg-error/20 text-error font-bold' }
  ];

  const handleToggleManualGPS = () => {
    if (!isManualPinMode) {
      setIsManualPinMode(true);
      setManualLat(currentGPS.latitude);
      setManualLng(currentGPS.longitude);
      setManualAlt(currentGPS.altitude || 3048);
      showToast('Manual Pin / Coordinate entry mode activated');
    } else {
      setIsManualPinMode(false);
      showToast(`Live GPS tracking active (±${Math.round(currentGPS.accuracy)}m)`);
    }
  };

  const handleSyncCurrentGPSFix = () => {
    setIsManualPinMode(false);
    setManualLat(currentGPS.latitude);
    setManualLng(currentGPS.longitude);
    setManualAlt(currentGPS.altitude || 3048);
    showToast(`GPS Position Locked: ${currentGPS.latitude.toFixed(5)}°N, ${currentGPS.longitude.toFixed(5)}°E`);
  };

  const handlePhotoFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate photo count
    const countValidation = validatePhotoCount(photoAttachments.length, files.length);
    if (!countValidation.isValid) {
      showToast(`⚠️ ${countValidation.error}`);
      return;
    }

    setIsCompressingPhotos(true);
    const tempReportId = `draft_${Date.now()}`;

    try {
      const newAttachments: PhotoAttachment[] = [];
      for (const file of files) {
        const validation = validatePhotoFile(file);
        if (!validation.isValid) {
          showToast(`⚠️ ${file.name}: ${validation.error}`);
          continue;
        }

        const attachment = await createPhotoAttachment(file, tempReportId);
        newAttachments.push(attachment);
      }

      setPhotoAttachments(prev => [...prev, ...newAttachments]);
      showToast(`📸 ${newAttachments.length} field photo(s) compressed and ready for offline storage`);
    } catch (err: any) {
      console.error(err);
      showToast(`Photo error: ${err.message}`);
    } finally {
      setIsCompressingPhotos(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please provide an incident title');
      return;
    }

    setIsSubmitting(true);
    const report_id = `IR-${Math.floor(100 + Math.random() * 900)}`;
    const idempotency_key = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const tenant_id = 'tactical-unit-07';

    try {
      // 1. Convert active coordinates to GeoJSON Point
      const geo_json = toGeoJSONPoint(activeLat, activeLng, activeAlt);

      // 2. Prepare full incident record
      const newIncident: IncidentReport = {
        id: report_id,
        report_id,
        idempotency_key,
        tenant_id,
        revision: 1,
        title: title.trim(),
        category,
        severity,
        district_road_segment: districtRoadSegment.trim(),
        description: description.trim() || 'Tactical obstruction observed in active sector.',
        observation_time: new Date(observationTime).toISOString(),
        latitude: activeLat,
        longitude: activeLng,
        accuracy_meters: activeAccuracy,
        altitude_meters: activeAlt,
        gps_status: gpsQuality,
        geo_json,
        locationName: districtRoadSegment,
        reportedBy: 'Driver Vance (Unit-07)',
        photos: photoAttachments.map(p => p.dataUrl || ''),
        photo_attachments: photoAttachments.map(p => ({ ...p, report_id })),
        timestamp: Date.now(),
        syncStatus: 'pending',
        sync_stage: 'LOCAL_ONLY',
        retry_count: 0
      };

      // 3. Store raw photo blobs in IndexedDB
      for (const photo of photoAttachments) {
        await incidentOfflineStore.savePhoto({ ...photo, report_id });
      }

      // 4. Store incident in IndexedDB
      await incidentOfflineStore.saveIncident(newIncident);

      // 5. Add to Sync Queue
      await incidentOfflineStore.saveQueueItem({
        id: `queue_${Date.now()}`,
        report_id,
        idempotency_key,
        type: 'incident',
        title: `${category.toUpperCase()}: ${newIncident.title}`,
        subtitle: isOnline ? 'Direct HQ Upload' : 'Pending Upload (Offline Queue)',
        sizeBytes: 24000 + photoAttachments.reduce((sum, p) => sum + p.sizeBytes, 0),
        timestamp: Date.now(),
        status: 'pending',
        sync_stage: 'LOCAL_ONLY',
        icon: 'assignment_late',
        color: severity === 'critical' ? '#ffb4ab' : '#fbbb45',
        retryCount: 0,
        payload: newIncident
      });

      showToast(`📝 Report ${report_id} saved to IndexedDB`);

      // 6. Initiate Sync Pipeline immediately
      if (isOnline) {
        showToast('Initiating HQ Satellite Uplink...');
        await incidentSyncService.syncIncident(newIncident);
      }

      // 7. Broadcast via tactical signals for real-time HQ dashboard
      try {
        broadcastIncident({
          messageId: report_id,
          title: newIncident.title,
          category: newIncident.category,
          severity: newIncident.severity,
          description: newIncident.description,
          photo: photoAttachments.length > 0 ? photoAttachments[0].dataUrl : null
        });
      } catch (err) {
        console.error('Failed to broadcast incident', err);
      }

      // Reset form
      setTitle('');
      setDescription('');
      setPhotoAttachments([]);
      setViewMode('history');
    } catch (err: any) {
      console.error(err);
      showToast(`Failed to record incident: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeGeoJSON = toGeoJSONPoint(activeLat, activeLng, activeAlt);

  const getSyncBadge = (stage: SyncStatusStage) => {
    switch (stage) {
      case 'SYNCED':
        return { label: 'Synced to HQ', color: 'bg-secondary/20 text-secondary border-secondary/30', icon: 'check_circle' };
      case 'UPLOADING_PHOTOS':
        return { label: 'Uploading Photos', color: 'bg-primary/20 text-primary border-primary/30', icon: 'cloud_upload' };
      case 'SUBMITTING':
        return { label: 'Submitting Payload', color: 'bg-primary/20 text-primary border-primary/30', icon: 'sync' };
      case 'QUEUED':
        return { label: 'Queued Offline', color: 'bg-tertiary/20 text-tertiary border-tertiary/30', icon: 'cloud_queue' };
      case 'CONFLICT':
        return { label: 'HTTP 409 Conflict', color: 'bg-error/20 text-error border-error/50 font-bold', icon: 'sync_problem' };
      case 'FAILED':
        return { label: 'Sync Failed (Retrying)', color: 'bg-error/20 text-error border-error/30', icon: 'error' };
      default:
        return { label: 'Local Only', color: 'bg-outline-variant/30 text-on-surface-variant', icon: 'save' };
    }
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
      className="flex flex-col w-full gap-4 max-w-xl mx-auto pb-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      
      {/* Top View Mode Switcher */}
      <motion.div variants={itemVariants} className="flex p-1 rounded-full border border-hairline bg-surface-container/50 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setViewMode('form')}
          className={`flex-1 py-2 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            viewMode === 'form'
              ? 'bg-primary text-bg-base shadow-[0_0_12px_rgba(251,187,69,0.2)]'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">edit_note</span>
          {t('incident.title')}
        </button>

        <button
          type="button"
          onClick={() => setViewMode('history')}
          className={`flex-1 py-2 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            viewMode === 'history'
              ? 'bg-primary text-bg-base shadow-[0_0_12px_rgba(251,187,69,0.2)]'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">history</span>
          {t('incident.history')} ({incidents.length})
        </button>
      </motion.div>

      {viewMode === 'form' ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* GPS Telemetry & Accuracy Card */}
          <motion.div variants={itemVariants} className="card p-3.5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  gpsQuality === 'high_precision'
                    ? 'bg-secondary/20 border border-secondary text-secondary shadow-[0_0_12px_rgba(74,225,131,0.3)]'
                    : isManualPinMode
                    ? 'bg-tertiary/20 border border-tertiary text-tertiary'
                    : 'bg-primary/20 border border-primary text-primary'
                }`}>
                  <span className={`material-symbols-outlined text-[22px] ${!isManualPinMode ? 'animate-pulse' : ''}`}>
                    {isManualPinMode ? 'pin_drop' : 'my_location'}
                  </span>
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant block">
                      GPS Observation Anchor
                    </span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase border ${
                      gpsQuality === 'high_precision'
                        ? 'bg-secondary/20 text-secondary border-secondary/30'
                        : isManualPinMode
                        ? 'bg-tertiary/20 text-tertiary border-tertiary/30'
                        : 'bg-outline-variant/30 text-on-surface-variant'
                    }`}>
                      {isManualPinMode ? 'Manual Pin' : `±${Math.round(activeAccuracy)}m ${gpsQuality.replace('_', ' ')}`}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-on-surface">
                    {formatCoordinates(activeLat, activeLng)}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Altitude</span>
                <span className="text-xs font-mono font-bold text-primary">{Math.round(activeAlt)}m</span>
              </div>
            </div>

            {/* Manual Coordinate Controls (if manual mode) */}
            {isManualPinMode && (
              <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-surface-container-high border border-outline-variant/40 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase font-bold text-tertiary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">pin_drop</span>
                    Tactical Map Pin Placement
                  </span>
                  <span className="text-[10px] text-on-surface-variant font-mono">
                    Sub-meter (6 decimals)
                  </span>
                </div>

                {/* Embedded High-Precision Map with Micro-Nudge & Reticle */}
                <TacticalMap
                  heightClass="h-64"
                  interactive={true}
                  isPinDropMode={true}
                  initialPinnedCoord={{ lat: manualLat, lng: manualLng }}
                  onSelectCoordinate={(lat, lng) => {
                    setManualLat(lat);
                    setManualLng(lng);
                  }}
                  showControls={true}
                />

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">
                      Latitude (°N)
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={manualLat}
                      onChange={(e) => setManualLat(parseFloat(e.target.value) || 0)}
                      className="w-full bg-surface border border-outline-variant/40 rounded-lg px-2.5 py-1.5 font-mono text-xs text-on-surface focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">
                      Longitude (°E)
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={manualLng}
                      onChange={(e) => setManualLng(parseFloat(e.target.value) || 0)}
                      className="w-full bg-surface border border-outline-variant/40 rounded-lg px-2.5 py-1.5 font-mono text-xs text-on-surface focus:border-primary outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Bar & GeoJSON Toggle */}
            <div className="flex items-center gap-2 pt-1 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={handleToggleManualGPS}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                  isManualPinMode
                    ? 'bg-tertiary/20 text-tertiary border-tertiary/40'
                    : 'bg-surface-container-high hover:bg-surface-container-highest border-outline-variant/40 text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isManualPinMode ? 'cancel' : 'edit_location'}
                </span>
                {isManualPinMode ? 'Exit Manual Entry' : 'Manual Coordinates'}
              </button>

              <button
                type="button"
                onClick={handleSyncCurrentGPSFix}
                className="py-2 px-3 rounded-lg text-xs font-bold bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center gap-1 cursor-pointer"
                title="Sync with Live GPS Fix"
              >
                <span className="material-symbols-outlined text-[16px]">sync</span>
                Fix GPS
              </button>

              <button
                type="button"
                onClick={() => setShowGeoJSONPreview(!showGeoJSONPreview)}
                className={`py-2 px-3 rounded-lg text-xs font-mono font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer border ${
                  showGeoJSONPreview
                    ? 'bg-primary/20 text-primary border-primary/40'
                    : 'bg-surface-container-high text-on-surface-variant border-outline-variant/40'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">data_object</span>
                GeoJSON
              </button>
            </div>

            {/* GeoJSON Preview Collapsible */}
            {showGeoJSONPreview && (
              <div className="bg-bg-base p-2.5 rounded-lg border border-hairline text-[11px] font-mono text-secondary overflow-x-auto">
                <span className="text-[9px] uppercase font-bold text-text-secondary block mb-1 tracking-wider">
                  GeoJSON Point Schema
                </span>
                <pre>{JSON.stringify(activeGeoJSON, null, 2)}</pre>
              </div>
            )}
          </motion.div>

          {/* Incident / Hazard Category Selection */}
          <motion.div variants={itemVariants} className="card p-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2.5">
              {t('incident.category')} *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    category === cat.id
                      ? 'bg-primary/10 border-primary text-primary font-medium'
                      : 'bg-transparent border-hairline text-text-secondary hover:text-text-primary hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{cat.icon}</span>
                  <span className="text-[11px] leading-tight">{t(cat.labelKey)}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Severity & Observation Time */}
          <motion.div variants={itemVariants} className="card p-4 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
                {t('incident.severity')} *
              </label>
              <div className="grid grid-cols-4 gap-2">
                {severities.map((sev) => (
                  <button
                    type="button"
                    key={sev.id}
                    onClick={() => setSeverity(sev.id)}
                    className={`py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                      severity === sev.id
                        ? `${sev.color} border-current scale-102`
                        : 'bg-transparent border-hairline text-text-secondary hover:text-text-primary hover:bg-surface-container'
                    }`}
                  >
                    {t(sev.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* District / Road Segment Preset Picker & Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  District / Road Segment *
                </label>
                <span className="text-[10px] text-text-secondary">Tactical Corridor</span>
              </div>
              
              {/* Preset Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
                {DISTRICT_ROAD_PRESETS.map((preset, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setDistrictRoadSegment(preset)}
                    className={`text-[10px] font-medium px-3 py-1.5 rounded-full whitespace-nowrap border transition-colors cursor-pointer ${
                      districtRoadSegment === preset
                        ? 'bg-primary text-bg-base border-primary'
                        : 'bg-transparent text-text-secondary border-hairline hover:text-text-primary hover:bg-surface-container'
                    }`}
                  >
                    {preset.split('(')[0].trim()}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={districtRoadSegment}
                onChange={(e) => setDistrictRoadSegment(e.target.value)}
                placeholder="e.g., Tawang-Sela Pass Highway (NH-13 Km 42)"
                required
                className="w-full bg-surface-container/30 border border-hairline rounded-xl px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-medium placeholder-text-secondary/50"
              />
            </div>

            {/* Observation Time & Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                  Observation Time *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="datetime-local"
                    value={observationTime}
                    onChange={(e) => setObservationTime(e.target.value)}
                    required
                    className="flex-1 bg-surface-container/30 border border-hairline rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setObservationTime(new Date().toISOString().slice(0, 16))}
                    className="px-2.5 py-2 rounded-xl bg-transparent border border-hairline text-[11px] font-bold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                  >
                    Now
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                  {t('incident.title')} *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Massive Rockfall Blocking Southbound Lane"
                  required
                  className="w-full bg-surface-container/30 border border-hairline rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder-text-secondary/50"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                {t('incident.description')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Provide tactical notes, estimated clearance time, required equipment, or detour accessibility..."
                className="w-full bg-surface-container/30 border border-hairline rounded-xl px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none placeholder-text-secondary/50"
              />
            </div>
          </motion.div>

          {/* Photo Attachments & Client-side Compression */}
          <motion.div variants={itemVariants} className="card p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  {t('incident.photos')} ({photoAttachments.length}/5)
                </span>
                {isCompressingPhotos && (
                  <span className="text-[10px] font-mono text-tertiary animate-pulse font-bold">
                    Compressing...
                  </span>
                )}
              </div>
              <span className="text-[10px] text-text-secondary">
                Auto-compressed to IndexedDB
              </span>
            </div>

            {/* Photo Cards Grid */}
            {photoAttachments.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {photoAttachments.map((photo, idx) => (
                  <div key={photo.id} className="relative h-24 rounded-xl overflow-hidden border border-hairline group">
                    <img src={photo.dataUrl} alt={photo.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-bg-base/80 p-1 text-[9px] font-mono text-text-primary flex justify-between">
                      <span>{(photo.sizeBytes / 1024).toFixed(0)} KB</span>
                      <span className="text-secondary">-{photo.compressionRatio}%</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-bg-base/80 text-error flex items-center justify-center cursor-pointer hover:bg-error hover:text-bg-base transition-colors border border-hairline"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Photo Picker Buttons (Camera & File upload) */}
            <div className="flex items-center gap-2">
              <label className="flex-1 bg-transparent hover:bg-surface-container border border-hairline rounded-full py-2.5 px-3 flex items-center justify-center gap-2 cursor-pointer transition-colors text-xs font-medium text-text-primary">
                <span className="material-symbols-outlined text-[18px] text-primary">photo_camera</span>
                Capture / Select Photos
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handlePhotoFilesSelected}
                  className="hidden"
                  disabled={photoAttachments.length >= 5 || isCompressingPhotos}
                />
              </label>
            </div>
          </motion.div>

          {/* Submit Action Button */}
          <motion.button
            variants={itemVariants}
            type="submit"
            disabled={isSubmitting || isCompressingPhotos}
            className="w-full bg-primary hover:bg-primary/90 text-bg-base py-3.5 rounded-full font-bold text-sm shadow-[0_0_20px_rgba(251,187,69,0.3)] flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-50 disabled:shadow-none mt-2"
          >
            <span className="material-symbols-outlined text-[20px]">
              {isOnline ? 'send' : 'save'}
            </span>
            {isSubmitting
              ? 'Submitting to Tactical Queue...'
              : isOnline
              ? t('incident.submit')
              : `${t('incident.submit')} (Store Offline)`}
          </motion.button>
        </form>
      ) : (
        /* Incident History & Sync Status Stepper View */
        <motion.div 
          className="flex flex-col gap-3"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {incidents.length === 0 ? (
            <motion.div variants={itemVariants} className="card p-8 text-center text-text-secondary border-dashed">
              <span className="material-symbols-outlined text-[36px] opacity-50 mb-2 block">assignment</span>
              <p className="font-medium text-text-primary text-sm">No incidents recorded</p>
              <p className="text-xs text-text-secondary mt-1">All tactical sectors reported clear.</p>
            </motion.div>
          ) : (
            incidents.map((inc) => {
              const badge = getSyncBadge(inc.sync_stage || (inc.syncStatus === 'synced' ? 'SYNCED' : 'QUEUED'));
              const isConflict = inc.sync_stage === 'CONFLICT' || !!inc.server_version;

              return (
                <motion.div
                  variants={itemVariants}
                  key={inc.report_id || inc.id}
                  className="card p-4 flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/30">
                        {inc.id}
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        inc.severity === 'critical' || inc.severity === 'high'
                          ? 'bg-error/20 text-error'
                          : 'bg-tertiary/20 text-tertiary'
                      }`}>
                        {inc.severity}
                      </span>
                    </div>

                    {/* Sync Lifecycle Stage Badge */}
                    <span className={`text-[11px] font-bold flex items-center gap-1 px-2 py-0.5 rounded border ${badge.color}`}>
                      <span className="material-symbols-outlined text-[14px]">
                        {badge.icon}
                      </span>
                      {badge.label}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-on-surface">{inc.title}</h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{inc.description}</p>
                  </div>

                  {/* Conflict Notice & Resolution Trigger */}
                  {isConflict && inc.server_version && (
                    <div className="p-3 bg-error/15 border border-error/40 rounded-xl flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-error text-[20px]">warning</span>
                        <span className="text-xs font-bold text-error">
                          HQ Revision Collision (v{inc.server_version.revision})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConflictIncident(inc)}
                        className="px-3 py-1 bg-error text-on-error text-xs font-bold rounded-lg shadow cursor-pointer hover:bg-error/90"
                      >
                        Resolve Conflict
                      </button>
                    </div>
                  )}

                  {/* Photos Preview */}
                  {inc.photos && inc.photos.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto py-1">
                      {inc.photos.map((p, idx) => (
                        <img
                          key={idx}
                          src={p}
                          alt="Field evidence"
                          className="h-16 w-24 object-cover rounded-lg border border-outline-variant/30 shrink-0"
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-text-secondary font-mono border-t border-hairline pt-2 mt-1">
                    <span>{inc.district_road_segment || inc.locationName}</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCurrentTab('resilient-navigation')}
                        className="text-primary hover:underline font-medium cursor-pointer"
                      >
                        View on Map
                      </button>
                      <button
                        onClick={() => deleteIncident(inc.id)}
                        className="text-error hover:underline cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      )}

      {/* Conflict Resolution Dialog Modal */}
      {conflictIncident && conflictIncident.server_version && (
        <ConflictDialog
          isOpen={!!conflictIncident}
          incident={conflictIncident}
          serverVersion={conflictIncident.server_version}
          onClose={() => setConflictIncident(null)}
          onResolve={async (choice, mergedText) => {
            await incidentSyncService.resolveConflict(conflictIncident.report_id, choice, mergedText);
            showToast(`Conflict resolved using strategy: ${choice.replace('_', ' ')}`);
          }}
        />
      )}
    </motion.div>
  );
};
