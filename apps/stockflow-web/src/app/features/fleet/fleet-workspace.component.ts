import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, forkJoin, of, Subscription, timer } from 'rxjs';
import { FleetbaseAuditSummary, FleetbaseIntegrationStatus, FleetbaseOrganization, FleetbaseVehicle } from '../../core/models/fleetbase.models';
import { FleetbaseService } from '../../core/services/fleetbase.service';
import { FleetGisMapComponent } from './fleet-gis-map.component';

type FleetFilter = 'all' | 'online' | 'offline' | 'available';

@Component({
  selector: 'sf-fleet-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, FleetGisMapComponent],
  templateUrl: './fleet-workspace.component.html',
  styleUrl: './fleet-workspace.component.css'
})
export class FleetWorkspaceComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) tenantLabel = '';
  @Input({ required: true }) tenantId = '';

  integration?: FleetbaseIntegrationStatus;
  organization?: FleetbaseOrganization;
  audit?: FleetbaseAuditSummary;
  vehicles: FleetbaseVehicle[] = [];
  selectedVehicle?: FleetbaseVehicle;
  search = '';
  filter: FleetFilter = 'all';
  loading = false;
  error = '';
  lastUpdated?: Date;
  private liveSync?: Subscription;
  private positionSyncing = false;

  constructor(private readonly fleetbase: FleetbaseService) {}

  ngOnInit(): void {
    this.refresh();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['tenantId']?.firstChange && changes['tenantId']) {
      this.refresh();
    }
  }

  ngOnDestroy(): void {
    this.liveSync?.unsubscribe();
  }

  get filteredVehicles(): FleetbaseVehicle[] {
    const needle = this.search.trim().toLowerCase();
    return this.vehicles.filter(vehicle => {
      const matchesFilter = this.filter === 'all'
        || (this.filter === 'online' && vehicle.online === true)
        || (this.filter === 'offline' && vehicle.online !== true)
        || (this.filter === 'available' && vehicle.status?.toLowerCase() === 'available');
      const searchable = [vehicle.name, vehicle.internalId, vehicle.plateNumber, vehicle.make, vehicle.model]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return matchesFilter && (!needle || searchable.includes(needle));
    });
  }

  get onlineCount(): number {
    return this.vehicles.filter(vehicle => vehicle.online === true).length;
  }

  get availableCount(): number {
    return this.vehicles.filter(vehicle => vehicle.status?.toLowerCase() === 'available').length;
  }

  refresh(): void {
    if (this.loading) return;
    this.loading = true;
    this.error = '';
    forkJoin({
      integration: this.fleetbase.status(),
      fleet: this.fleetbase.vehicles(),
      organization: this.fleetbase.organization().pipe(catchError(() => of(undefined))),
      audit: this.fleetbase.audit().pipe(catchError(() => of(undefined)))
    }).pipe(finalize(() => this.loading = false)).subscribe({
      next: result => {
        this.integration = result.integration;
        this.organization = result.organization;
        this.audit = result.audit;
        this.vehicles = result.fleet.vehicles;
        this.lastUpdated = new Date();
        if (this.selectedVehicle) {
          this.selectedVehicle = this.vehicles.find(vehicle => vehicle.id === this.selectedVehicle?.id);
        }
        if (result.integration.enabled && result.integration.configured && !this.liveSync) {
          this.liveSync = timer(15000, 15000).subscribe(() => this.syncVehiclePositions());
        }
      },
      error: (error: HttpErrorResponse) => {
        this.error = this.errorMessage(error);
      }
    });
  }

  private syncVehiclePositions(): void {
    if (this.positionSyncing) return;
    this.positionSyncing = true;
    this.fleetbase.vehicles().pipe(finalize(() => this.positionSyncing = false)).subscribe({
      next: fleet => {
        this.vehicles = fleet.vehicles;
        this.lastUpdated = new Date();
        if (this.selectedVehicle) {
          this.selectedVehicle = this.vehicles.find(vehicle => vehicle.id === this.selectedVehicle?.id);
        }
      }
    });
  }

  selectVehicle(vehicle: FleetbaseVehicle): void {
    this.selectedVehicle = vehicle;
  }

  closeDetails(): void {
    this.selectedVehicle = undefined;
  }

  vehicleTitle(vehicle: FleetbaseVehicle): string {
    return vehicle.name || vehicle.plateNumber || vehicle.internalId || 'Unnamed vehicle';
  }

  vehicleSpecification(vehicle: FleetbaseVehicle): string {
    const specification = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ');
    return specification || vehicle.type || 'Vehicle specification not provided';
  }

  private errorMessage(error: HttpErrorResponse): string {
    const upstream = error.error as { message?: string } | null;
    if (upstream?.message) return upstream.message;
    if (error.status === 0) return 'StockFlow could not reach the local backend. Confirm that the API is running on port 8080.';
    return `Fleet data could not be loaded (HTTP ${error.status}).`;
  }
}
