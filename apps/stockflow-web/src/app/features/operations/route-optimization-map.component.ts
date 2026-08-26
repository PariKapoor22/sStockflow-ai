import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { firstValueFrom } from 'rxjs';
import { GoogleRoutesService } from '../../core/services/google-routes.service';

export interface OptimizedRouteMapStop {
  name: string;
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'sf-route-optimization-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './route-optimization-map.component.html',
  styleUrl: './route-optimization-map.component.css'
})
export class RouteOptimizationMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) routeId = '';
  @Input() stops: OptimizedRouteMapStop[] = [];
  @ViewChild('routeMap', { static: true }) mapElement!: ElementRef<HTMLDivElement>;

  loading = true;
  error = '';
  routeSource = 'Google Routes API';
  private map?: google.maps.Map;
  private routeLines: google.maps.Polyline[] = [];
  private markers: google.maps.Marker[] = [];
  private renderVersion = 0;

  constructor(private readonly googleRoutes: GoogleRoutesService) {}

  async ngAfterViewInit(): Promise<void> {
    await this.initializeMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['routeId'] || changes['stops']) && this.map) void this.renderRoute();
  }

  ngOnDestroy(): void {
    this.clearOverlays();
  }

  retry(): void {
    void (this.map ? this.renderRoute() : this.initializeMap());
  }

  private async initializeMap(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const key = localStorage.getItem('stockflowGoogleMapsBrowserKey')?.trim() || '';
      if (!key) throw new Error('Google Maps browser key is not configured. Add it from Vehicle Fleet → Map provider.');
      if (!window.google?.maps) {
        setOptions({ key, v: 'weekly', language: 'en', region: 'IN' });
        await importLibrary('maps');
      }
      this.map = new google.maps.Map(this.mapElement.nativeElement, {
        center: { lat: 15.4, lng: 78.5 },
        zoom: 5,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        gestureHandling: 'greedy',
        styles: [{ featureType: 'poi.business', stylers: [{ visibility: 'off' }] }]
      });
      await this.renderRoute();
    } catch (error: any) {
      this.loading = false;
      this.error = error?.message || 'Google Maps could not be loaded.';
    }
  }

  private async renderRoute(): Promise<void> {
    if (!this.map || this.stops.length < 2) return;
    const version = ++this.renderVersion;
    this.loading = true;
    this.error = '';
    this.clearOverlays();
    try {
      const legs = await Promise.all(this.stops.slice(0, -1).map((origin, index) => {
        const destination = this.stops[index + 1];
        return firstValueFrom(this.googleRoutes.computeRoute({
          originLatitude: origin.latitude,
          originLongitude: origin.longitude,
          destinationLatitude: destination.latitude,
          destinationLongitude: destination.longitude
        }));
      }));
      if (version !== this.renderVersion) return;

      const bounds = new google.maps.LatLngBounds();
      legs.forEach((leg, index) => {
        const path = leg.points.map(point => ({ lat: point.latitude, lng: point.longitude }));
        path.forEach(point => bounds.extend(point));
        this.routeLines.push(new google.maps.Polyline({
          map: this.map,
          path,
          strokeColor: '#6650db',
          strokeOpacity: .92,
          strokeWeight: 6,
          zIndex: 20
        }));
      });
      this.stops.forEach((stop, index) => {
        const position = { lat: stop.latitude, lng: stop.longitude };
        bounds.extend(position);
        this.markers.push(new google.maps.Marker({
          map: this.map,
          position,
          title: stop.name,
          label: { text: String(index + 1), color: '#ffffff', fontSize: '12px', fontWeight: '700' },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: index === this.stops.length - 1 ? '#0eaa68' : '#c57237',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 4,
            scale: 15
          }
        }));
      });
      this.fitRoute(bounds, version);
      this.routeSource = `Google Routes API · ${legs.length} road leg${legs.length === 1 ? '' : 's'}`;
    } catch (error: any) {
      if (version !== this.renderVersion) return;
      this.renderFallbackLine();
      this.routeSource = 'Straight-line preview';
      this.error = error?.error?.message || error?.message || 'The Google road route could not be loaded from the backend.';
    } finally {
      if (version === this.renderVersion) this.loading = false;
    }
  }

  private renderFallbackLine(): void {
    if (!this.map || this.stops.length < 2) return;
    const path = this.stops.map(stop => ({ lat: stop.latitude, lng: stop.longitude }));
    const bounds = new google.maps.LatLngBounds();
    path.forEach(point => bounds.extend(point));
    this.routeLines.push(new google.maps.Polyline({
      map: this.map,
      path,
      strokeColor: '#c57237',
      strokeOpacity: .8,
      strokeWeight: 4,
      icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 }, offset: '0', repeat: '16px' }]
    }));
    this.stops.forEach((stop, index) => this.markers.push(new google.maps.Marker({
      map: this.map,
      position: { lat: stop.latitude, lng: stop.longitude },
      title: stop.name,
      label: { text: String(index + 1), color: '#ffffff', fontSize: '12px', fontWeight: '700' },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: index === this.stops.length - 1 ? '#0eaa68' : '#c57237',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 4,
        scale: 15
      }
    })));
    this.fitRoute(bounds, this.renderVersion);
  }

  private fitRoute(bounds: google.maps.LatLngBounds, version: number): void {
    if (!this.map) return;
    const apply = () => {
      if (!this.map || version !== this.renderVersion) return;
      google.maps.event.trigger(this.map, 'resize');
      this.map.fitBounds(bounds, { top: 62, right: 72, bottom: 54, left: 72 });
    };
    apply();
    window.setTimeout(apply, 180);
    window.setTimeout(apply, 650);
  }

  private clearOverlays(): void {
    this.routeLines.forEach(line => line.setMap(null));
    this.markers.forEach(marker => marker.setMap(null));
    this.routeLines = [];
    this.markers = [];
  }
}
