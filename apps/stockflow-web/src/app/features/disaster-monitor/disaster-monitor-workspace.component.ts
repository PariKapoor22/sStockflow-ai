import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import * as L from 'leaflet';
import { HazardAlert, HazardAlertLocation } from '../../core/models/google-weather.models';
import { GoogleWeatherService } from '../../core/services/google-weather.service';

type SeverityFilter = 'all' | 'severe' | 'warning' | 'monitoring';
type HazardLayer = 'FLOOD' | 'LANDSLIDE';

interface LayerToggle {
  id: HazardLayer;
  label: string;
  description: string;
  color: string;
  enabled: boolean;
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

  loading = true;
  error = '';
  lastUpdated?: Date;
  severityFilter: SeverityFilter = 'all';
  selectedAlert?: HazardAlert;
  alerts: HazardAlert[] = [];
  monitoredLocations = 0;
  officialAvailable = false;
  modelsAvailable = false;
  readonly layers: LayerToggle[] = [
    { id: 'FLOOD', label: 'Flood zones', description: 'Official alerts and GloFAS outlooks', color: '#2563eb', enabled: true },
    { id: 'LANDSLIDE', label: 'Landslide zones', description: 'Official alerts and NASA LHASA outlooks', color: '#f59e0b', enabled: true }
  ];

  private map?: L.Map;
  private readonly overlayGroups = new Map<HazardLayer, L.LayerGroup>();
  private readonly markerByAlertId = new Map<string, L.Layer>();
  private readonly monitoringPoints: Array<HazardAlertLocation & { label: string }> = [
    { label: 'Guwahati, Assam', latitude: 26.1445, longitude: 91.7362 },
    { label: 'Shillong, Meghalaya', latitude: 25.5788, longitude: 91.8933 },
    { label: 'Gangtok, Sikkim', latitude: 27.3389, longitude: 88.6065 },
    { label: 'Itanagar, Arunachal Pradesh', latitude: 27.0844, longitude: 93.6053 },
    { label: 'Kohima, Nagaland', latitude: 25.6751, longitude: 94.1086 },
    { label: 'Imphal, Manipur', latitude: 24.817, longitude: 93.9368 },
    { label: 'Aizawl, Mizoram', latitude: 23.7271, longitude: 92.7176 },
    { label: 'Agartala, Tripura', latitude: 23.8315, longitude: 91.2868 }
  ];

  constructor(private readonly weather: GoogleWeatherService) {}

  get filteredAlerts(): HazardAlert[] {
    return this.alerts.filter(alert => {
      const layer = this.layers.find(item => item.id === alert.hazardType);
      return layer?.enabled && (this.severityFilter === 'all' || this.severity(alert) === this.severityFilter);
    });
  }

  get activeCount(): number { return this.alerts.filter(alert => alert.phase === 'ACTIVE').length; }
  get forecastCount(): number { return this.alerts.filter(alert => alert.phase === 'FORECAST').length; }
  get severeCount(): number { return this.alerts.filter(alert => this.severity(alert) === 'severe').length; }

  ngAfterViewInit(): void {
    this.initializeMap();
    void this.refreshData();
  }

  ngOnDestroy(): void { this.map?.remove(); }

  async refreshData(): Promise<void> {
    if (this.loading && this.lastUpdated) return;
    this.loading = true;
    this.error = '';
    const locations = this.monitoringPoints.map(({ latitude, longitude }) => ({ latitude, longitude }));
    try {
      const [official, modelled] = await Promise.all([
        firstValueFrom(this.weather.hazardAlerts(locations)).catch(() => null),
        firstValueFrom(this.weather.modelHazards()).catch(() => null)
      ]);
      this.officialAvailable = official !== null;
      this.modelsAvailable = modelled !== null;
      if (!official && !modelled) throw new Error('Official alerts and open-source model outlooks are unavailable.');
      this.alerts = [...(official?.alerts ?? []), ...(modelled?.alerts ?? [])]
        .filter((alert, index, all) => all.findIndex(other => other.id === alert.id) === index);
      this.monitoredLocations = official?.monitoredLocations ?? locations.length;
      this.lastUpdated = new Date();
      this.renderAlerts();
    } catch (error: any) {
      this.alerts = [];
      this.monitoredLocations = locations.length;
      this.error = error?.error?.message || error?.message || 'Hazard feeds could not be loaded.';
      this.renderAlerts();
    } finally {
      this.loading = false;
    }
  }

  toggleLayer(layer: LayerToggle): void {
    layer.enabled = !layer.enabled;
    const group = this.overlayGroups.get(layer.id);
    if (!group || !this.map) return;
    if (layer.enabled) group.addTo(this.map); else group.remove();
  }

  selectAlert(alert: HazardAlert): void {
    this.selectedAlert = alert;
    this.map?.setView([alert.matchedLatitude, alert.matchedLongitude], 9, { animate: true });
    (this.markerByAlertId.get(alert.id) as L.Marker)?.openPopup?.();
  }

  severity(alert: HazardAlert): Exclude<SeverityFilter, 'all'> {
    const value = alert.severity.toUpperCase();
    if (value === 'EXTREME' || value === 'SEVERE') return 'severe';
    if (value === 'MODERATE' || value === 'WARNING' || value === 'HIGH') return 'warning';
    return 'monitoring';
  }

  sourceLabel(alert: HazardAlert): string {
    return alert.dataSourceName || (alert.phase === 'FORECAST' ? 'Open-source model' : 'Official alert feed');
  }

  private initializeMap(): void {
    this.map = L.map(this.mapElement.nativeElement, { center: [26.2, 92.94], zoom: 6, minZoom: 5, maxZoom: 18 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
    this.layers.forEach(layer => {
      const group = L.layerGroup().addTo(this.map!);
      this.overlayGroups.set(layer.id, group);
    });
    this.monitoringPoints.forEach(point => L.circleMarker([point.latitude, point.longitude], {
      radius: 4, color: '#64748b', weight: 1, fillColor: '#fff', fillOpacity: .9
    }).bindTooltip(point.label).addTo(this.map!));
    setTimeout(() => this.map?.invalidateSize(), 0);
  }

  private renderAlerts(): void {
    this.overlayGroups.forEach(group => group.clearLayers());
    this.markerByAlertId.clear();
    this.alerts.forEach(alert => {
      const group = this.overlayGroups.get(alert.hazardType);
      if (!group) return;
      const color = this.color(alert);
      const paths = this.geoJsonPaths(alert.polygonGeoJson);
      let primary: L.Layer | undefined;
      if (paths.length) {
        paths.forEach(path => {
          const polygon = L.polygon(path, { color, weight: alert.phase === 'ACTIVE' ? 3 : 2, fillColor: color, fillOpacity: alert.phase === 'ACTIVE' ? .22 : .11, dashArray: alert.phase === 'FORECAST' ? '7 5' : undefined })
            .bindPopup(this.popup(alert)).addTo(group);
          primary ??= polygon;
        });
      } else {
        primary = L.circleMarker([alert.matchedLatitude, alert.matchedLongitude], {
          radius: 11, color: '#fff', weight: 2, fillColor: color, fillOpacity: .95
        }).bindPopup(this.popup(alert)).addTo(group);
      }
      if (primary) this.markerByAlertId.set(alert.id, primary);
    });
    this.layers.forEach(layer => {
      const group = this.overlayGroups.get(layer.id);
      if (group && this.map) layer.enabled ? group.addTo(this.map) : group.remove();
    });
  }

  private geoJsonPaths(value: string | null): L.LatLngExpression[][] {
    if (!value) return [];
    try {
      const geometry = JSON.parse(value);
      const polygons = geometry?.type === 'Polygon' ? [geometry.coordinates] : geometry?.type === 'MultiPolygon' ? geometry.coordinates : [];
      return polygons.flatMap((polygon: number[][][]) => polygon
        .map((ring: number[][]) => ring.filter(point => point.length >= 2).map(point => [point[1], point[0]] as L.LatLngTuple))
        .filter((ring: L.LatLngTuple[]) => ring.length >= 3));
    } catch { return []; }
  }

  private color(alert: HazardAlert): string {
    if (this.severity(alert) === 'severe') return '#dc2626';
    return alert.hazardType === 'LANDSLIDE' ? '#f59e0b' : '#2563eb';
  }

  private popup(alert: HazardAlert): string {
    const timing = alert.phase === 'ACTIVE' ? 'Active alert' : 'Forecast outlook';
    return `<strong>${this.escape(alert.title)}</strong><br>${this.escape(alert.hazardType)} · ${this.escape(alert.severity)} · ${timing}<br>${this.escape(alert.areaName)}<br><small>Source: ${this.escape(this.sourceLabel(alert))}</small>`;
  }

  private escape(value: string): string {
    return value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]!));
  }
}
