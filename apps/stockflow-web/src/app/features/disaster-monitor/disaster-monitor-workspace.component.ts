import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

interface HazardIncident {
  id: string;
  title: string;
  location: string;
  severity: 'severe' | 'warning' | 'monitoring';
  type: 'flood' | 'landslide' | 'road-block' | 'earthquake' | 'rainfall';
  timestamp: string;
  coordinates: L.LatLngTuple;
  detail: string;
}

interface LayerToggle {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  color: string;
  type: 'raster' | 'vector';
}

@Component({
  selector: 'sf-disaster-monitor-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './disaster-monitor-workspace.component.html',
  styleUrl: './disaster-monitor-workspace.component.css'
})
export class DisasterMonitorWorkspaceComponent implements AfterViewInit, OnDestroy {
  @ViewChild('disasterMap', { static: true }) mapElement!: ElementRef<HTMLDivElement>;

  private map?: L.Map;
  private readonly layerGroups = new Map<string, L.LayerGroup>();

  panelCollapsed = false;
  lastUpdated = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  refreshing = false;

  readonly severityCounts = { severe: 3, warning: 4, monitoring: 5 };

  readonly layers: LayerToggle[] = [
    { id: 'flood', label: 'Flood Inundation Zones', description: 'Active and forecasted flood areas', enabled: true, color: '#ef4444', type: 'raster' },
    { id: 'landslide', label: 'Landslide Risk Areas', description: 'Slope stability and slide history', enabled: true, color: '#f59e0b', type: 'raster' },

    { id: 'earthquake', label: 'Seismic Activity', description: 'Recent tremor epicenters', enabled: false, color: '#a855f7', type: 'vector' },
    { id: 'rainfall', label: 'Rainfall Monitoring', description: 'Heavy precipitation alerts', enabled: true, color: '#3b82f6', type: 'raster' }
  ];

  incidents: HazardIncident[] = [];

  selectedIncident?: HazardIncident;
  severityFilter: 'all' | 'severe' | 'warning' | 'monitoring' = 'all';

  get filteredIncidents(): HazardIncident[] {
    const enabledTypes = new Set(this.layers.filter(l => l.enabled).map(l => l.id));
    return this.incidents.filter(i =>
      enabledTypes.has(i.type) &&
      (this.severityFilter === 'all' || i.severity === this.severityFilter)
    );
  }

  onFilterChange(val: 'all' | 'severe' | 'warning' | 'monitoring'): void {
    this.severityFilter = val;
    this.renderIncidentMarkers();
  }

  async loadLiveFeeds(): Promise<void> {
    try {
      const [floodRes, landslideRes, eqRes] = await Promise.all([
        fetch('/api/proxy/flood').then(r => r.json()).catch(() => []),
        fetch('/api/proxy/landslide').then(r => r.json()).catch(() => []),
        fetch('/api/proxy/earthquake').then(r => r.json()).catch(() => [])
      ]);

      const newIncidents: HazardIncident[] = [];
      let idCounter = 1;

      // Process Floods
      if (Array.isArray(floodRes)) {
        floodRes.forEach(f => {
          if (!f.latitude || !f.longitude) return;
          newIncidents.push({
            id: `FLD-${String(idCounter++).padStart(3, '0')}`,
            title: `Flood at ${f.station || f.district}`,
            location: `${f.district}, ${f.state}`,
            severity: f.severity === 'severe' ? 'severe' : (f.level === 'above_danger' ? 'warning' : 'monitoring'),
            type: 'flood',
            timestamp: f.date || 'Recent',
            coordinates: [f.latitude, f.longitude],
            detail: this.formatFloodPopup(f)
          });
        });
      }

      // Process Landslides
      if (Array.isArray(landslideRes)) {
        landslideRes.forEach(l => {
          if (!l.lat || !l.lon) return;
          newIncidents.push({
            id: `LND-${String(idCounter++).padStart(3, '0')}`,
            title: `Landslide at ${l.location || l.district}`,
            location: `${l.district}, ${l.state}`,
            severity: 'severe',
            type: 'landslide',
            timestamp: `${l.month_} ${l.date_?.split('/')[2] || ''}`,
            coordinates: [l.lat, l.lon],
            detail: this.formatLandslidePopup(l)
          });
        });
      }

      // Process Earthquakes
      if (Array.isArray(eqRes)) {
        eqRes.forEach(e => {
          if (!e.latitude || !e.longitude) return;
          newIncidents.push({
            id: `EQ-${String(idCounter++).padStart(3, '0')}`,
            title: `Earthquake M${e.mag}`,
            location: e.place || e.region,
            severity: e.mag >= 5 ? 'severe' : (e.mag >= 3.5 ? 'warning' : 'monitoring'),
            type: 'earthquake',
            timestamp: e.occurenceTime?.split('T')[0] || 'Recent',
            coordinates: [e.latitude, e.longitude],
            detail: this.formatEarthquakePopup(e)
          });
        });
      }


      // Mock Rainfall Data
      newIncidents.push({
        id: `RNF-${String(idCounter++).padStart(3, '0')}`,
        title: `Heavy Rainfall Alert`,
        location: `Cherrapunji, Meghalaya`,
        severity: 'warning',
        type: 'rainfall',
        timestamp: 'Just now',
        coordinates: [25.27, 91.73],
        detail: `<div class="real-disaster-popup">Rainfall Event<br>Location: Cherrapunji<br>Precipitation: 145mm/hr<br>Status: Warning</div>`
      });
      newIncidents.push({
        id: `RNF-${String(idCounter++).padStart(3, '0')}`,
        title: `Severe Downpour`,
        location: `Pasighat, Arunachal Pradesh`,
        severity: 'severe',
        type: 'rainfall',
        timestamp: '1 hour ago',
        coordinates: [28.06, 95.32],
        detail: `<div class="real-disaster-popup">Rainfall Event<br>Location: Pasighat<br>Precipitation: 210mm/hr<br>Status: Critical</div>`
      });

      this.incidents = newIncidents;
      this.renderIncidentMarkers();
    } catch (e) {
      console.error('Error loading live feeds', e);
    }
  }

  private formatEarthquakePopup(e: any): string {
    const dateStr = e.occurenceTime ? e.occurenceTime.split('T')[0] : 'N/A';
    const timeStr = e.occurenceTime ? e.occurenceTime.split('T')[1]?.replace('+00:00', '') : 'N/A';
    return `<div class="real-disaster-popup">
Earthquake<br>
Place:${e.place || e.region}<br>
Latitude:${e.latitude}<br>
Longitude:${e.longitude}<br>
Magnitude:${e.mag}<br>
Date:${dateStr}<br>
Time:${timeStr}<br>
Source: ${e.locSrc || 'ncs'}<br>
<a href="${e.eventUrl}" target="_blank">More Details</a>
</div>`;
  }

  private formatFloodPopup(f: any): string {
    return `<div class="real-disaster-popup">
Flood Event<br>
Station:${f.station}<br>
District:${f.district}, ${f.state}<br>
Latitude:${f.latitude}<br>
Longitude:${f.longitude}<br>
Water Level:${f.water_level}m<br>
Danger Level:${f.danger_level}m<br>
Status:${f.level}<br>
Date:${f.date}
</div>`;
  }

  private formatLandslidePopup(l: any): string {
    return `<div class="real-disaster-popup">
Landslide Event<br>
Location:${l.location}<br>
District:${l.district}, ${l.state}<br>
Latitude:${l.lat}<br>
Longitude:${l.lon}<br>
Type:${l.slide_type}<br>
Trigger:${l.trigg_mech}<br>
Impact:${l.impact}<br>
Date:${l.date_}
</div>`;
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.loadLiveFeeds();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  toggleLayer(layer: LayerToggle): void {
    layer.enabled = !layer.enabled;
    const group = this.layerGroups.get(layer.id);
    if (group && this.map) {
      if (layer.enabled) {
        group.addTo(this.map);
      } else {
        group.remove();
      }
    }
    this.renderIncidentMarkers();
  }

  togglePanel(): void {
    this.panelCollapsed = !this.panelCollapsed;
  }

  selectIncident(incident: HazardIncident): void {
    this.selectedIncident = incident;
    this.map?.setView(incident.coordinates, 9, { animate: true });
    const group = this.layerGroups.get('incidents');
    if (group) {
      group.eachLayer((layer: any) => {
        if (layer.getLatLng && layer.getPopup) {
          const pos = layer.getLatLng();
          if (Math.abs(pos.lat - incident.coordinates[0]) < 0.01 && Math.abs(pos.lng - incident.coordinates[1]) < 0.01) {
            layer.openPopup();
          }
        }
      });
    }
  }

  async refreshData(): Promise<void> {
    this.refreshing = true;
    try {
      await this.loadLiveFeeds();
      this.lastUpdated = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    } finally {
      this.refreshing = false;
    }
  }

  severityIcon(type: string): string {
    switch (type) {
      case 'flood': return '🌊';
      case 'landslide': return '⛰️';
      case 'road-block': return '🚧';
      case 'earthquake': return '📳';
      case 'rainfall': return '🌧️';
      default: return '⚠️';
    }
  }

  severityClass(severity: string): string {
    return `severity-${severity}`;
  }

  private initMap(): void {
    this.map = L.map(this.mapElement.nativeElement, {
      center: [26.2006, 92.9376],
      zoom: 7,
      minZoom: 5,
      maxZoom: 18,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // OpenStreetMap base tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.addHazardLayers();
    setTimeout(() => this.map?.invalidateSize(), 0);
  }

  private addHazardLayers(): void {
    if (!this.map) return;

    // Flood inundation zones (raster-style circles)
    const floodGroup = L.layerGroup();
    const floodZones = [
      { name: 'Brahmaputra Basin flood zone', center: [26.95, 94.17] as L.LatLngTuple, radius: 45000, severity: 'Active flooding' },
      { name: 'Barak Valley flood watch', center: [24.83, 92.80] as L.LatLngTuple, radius: 28000, severity: 'Water logging' },
      { name: 'Teesta Basin flood risk', center: [26.86, 88.73] as L.LatLngTuple, radius: 32000, severity: 'Bank erosion' },
      { name: 'Umiam catchment overflow', center: [25.65, 91.88] as L.LatLngTuple, radius: 18000, severity: 'Dam at capacity' },
    ];
    floodZones.forEach(zone => {
      L.circle(zone.center, {
        radius: zone.radius, color: '#ef4444', weight: 2,
        fillColor: '#ef4444', fillOpacity: 0.15, dashArray: '6 4'
      }).bindPopup(this.hazardPopup(zone.name, 'Flood', zone.severity)).addTo(floodGroup);
    });
    this.layerGroups.set('flood', floodGroup);
    floodGroup.addTo(this.map);

    // Landslide risk areas
    const landslideGroup = L.layerGroup();
    const landslideZones = [
      { name: 'NH-44 corridor slide zone', center: [25.22, 93.15] as L.LatLngTuple, radius: 15000, severity: 'Road blocked' },
      { name: 'East Sikkim slope risk', center: [27.33, 88.61] as L.LatLngTuple, radius: 22000, severity: 'Under inspection' },
      { name: 'Jaintia Hills risk area', center: [25.40, 92.20] as L.LatLngTuple, radius: 20000, severity: 'Monitoring' },
    ];
    landslideZones.forEach(zone => {
      L.circle(zone.center, {
        radius: zone.radius, color: '#f59e0b', weight: 2,
        fillColor: '#f59e0b', fillOpacity: 0.12, dashArray: '4 6'
      }).bindPopup(this.hazardPopup(zone.name, 'Landslide', zone.severity)).addTo(landslideGroup);
    });
    this.layerGroups.set('landslide', landslideGroup);
    landslideGroup.addTo(this.map);




    // Seismic activity (off by default)
    const seismicGroup = L.layerGroup();
    const tremors = [
      { name: 'Manipur–Myanmar border tremor', point: [25.05, 94.45] as L.LatLngTuple, magnitude: 'M3.2', depth: '12 km' },
      { name: 'Nagaland minor tremor', point: [26.15, 94.56] as L.LatLngTuple, magnitude: 'M2.8', depth: '15 km' },
    ];
    tremors.forEach(tremor => {
      L.circleMarker(tremor.point, {
        radius: 10, color: '#a855f7', weight: 2,
        fillColor: '#a855f7', fillOpacity: 0.25
      }).bindPopup(`<div class="disaster-popup"><strong>${tremor.name}</strong><br>Magnitude: ${tremor.magnitude}<br>Depth: ${tremor.depth}</div>`).addTo(seismicGroup);
    });
    this.layerGroups.set('earthquake', seismicGroup);

    // Rainfall Monitoring
    const rainfallGroup = L.layerGroup();
    const rainfallZones = [
      { name: 'Meghalaya Plateau Heavy Rain', center: [25.27, 91.73] as L.LatLngTuple, radius: 35000, status: 'Warning - 145mm/hr' },
      { name: 'Siang Valley Downpour', center: [28.06, 95.32] as L.LatLngTuple, radius: 40000, status: 'Severe - 210mm/hr' },
    ];
    rainfallZones.forEach(zone => {
      L.circle(zone.center, {
        radius: zone.radius, color: '#3b82f6', weight: 2,
        fillColor: '#3b82f6', fillOpacity: 0.2, dashArray: '5 5'
      }).bindPopup(this.hazardPopup(zone.name, 'Rainfall', zone.status)).addTo(rainfallGroup);
    });
    this.layerGroups.set('rainfall', rainfallGroup);
    rainfallGroup.addTo(this.map);

    // Not added to map by default

    // NER state boundaries (lightweight outline)
    const boundaryGroup = L.layerGroup();
    const nerStates: Array<{ name: string; center: L.LatLngTuple; radius: number }> = [
      { name: 'Assam', center: [26.20, 92.94], radius: 140000 },
      { name: 'Meghalaya', center: [25.47, 91.37], radius: 65000 },
      { name: 'Manipur', center: [24.82, 93.91], radius: 60000 },
      { name: 'Nagaland', center: [26.16, 94.56], radius: 55000 },
      { name: 'Mizoram', center: [23.16, 92.94], radius: 60000 },
      { name: 'Tripura', center: [23.94, 91.99], radius: 50000 },
      { name: 'Sikkim', center: [27.53, 88.51], radius: 40000 },
      { name: 'Arunachal Pradesh', center: [28.22, 94.73], radius: 120000 },
    ];
    nerStates.forEach(state => {
      L.circle(state.center, {
        radius: state.radius, color: 'rgba(148,163,184,0.25)', weight: 1,
        fillColor: 'transparent', fillOpacity: 0, dashArray: '3 6'
      }).bindTooltip(state.name, { permanent: false, direction: 'center', className: 'state-label' }).addTo(boundaryGroup);
    });
    boundaryGroup.addTo(this.map);
  }


  private renderIncidentMarkers(): void {
    if (!this.map) return;

    // Clear old incidents layer if it exists
    if (this.layerGroups.has('incidents')) {
      this.layerGroups.get('incidents')?.clearLayers();
      this.layerGroups.get('incidents')?.remove();
    }

    const incidentGroup = L.layerGroup();
    this.filteredIncidents.forEach(incident => {
      const pulseClass = incident.severity === 'severe' ? 'incident-marker severe' : incident.severity === 'warning' ? 'incident-marker warning' : 'incident-marker monitoring';

      // Use the pre-formatted detail directly as the popup content for the exact look
      L.marker(incident.coordinates, {
        icon: L.divIcon({
          className: '',
          html: `<span class="${pulseClass}">${this.severityIcon(incident.type)}</span>`,
          iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -16]
        })
      }).bindPopup(incident.detail).addTo(incidentGroup);
    });
    this.layerGroups.set('incidents', incidentGroup);
    incidentGroup.addTo(this.map);

    // Auto-update stats based on live data
    this.severityCounts.severe = this.incidents.filter(i => i.severity === 'severe').length;
    this.severityCounts.warning = this.incidents.filter(i => i.severity === 'warning').length;
    this.severityCounts.monitoring = this.incidents.filter(i => i.severity === 'monitoring').length;
  }

  private hazardPopup(name: string, type: string, status: string): string {
    return `<div class="disaster-popup"><strong>${name}</strong><br>Type: ${type}<br>Status: ${status}<br><small>NeSDR prototype overlay · Connect live feeds for real-time data.</small></div>`;
  }
}
