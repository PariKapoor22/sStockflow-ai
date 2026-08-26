import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CARBON_API_BASE_URL } from '../config/api.config';

export interface RouteOptimisationInput {
  id: string;
  lane: string;
  stops: string[];
  vehicle: string;
  loadKg: number;
  capacityKg: number;
  baselineKm: number;
  priority: string;
  status: string;
  stopDetails?: RouteStopInput[];
  vehicleAvailable?: boolean;
  coldChainRequired?: boolean;
  coldChainAvailable?: boolean;
  promisedDeliveryMinutes?: number;
  departureMinutes?: number;
  warehouseStockKg?: number;
  floodRisk?: number;
  landslideRisk?: number;
  roadBlockRisk?: number;
  roadClosed?: boolean;
}

export interface RouteStopInput {
  name: string;
  latitude: number;
  longitude: number;
  demandKg: number;
  serviceMinutes: number;
  earliestMinutes: number;
  latestMinutes: number;
  floodRisk?: number;
  landslideRisk?: number;
  roadBlockRisk?: number;
}

export interface OptimisedRoute extends RouteOptimisationInput {
  assignedVehicleId?: string;
  originalVehicle?: string;
  optimizedKm: number;
  duration: string;
  costInr: number;
  co2Kg: number;
  co2SavedKg: number;
  vehicleFamily: string;
  explanation: string[];
  matrixProvider: string;
  solver: string;
  constraintsChecked: string[];
  hazardPenalty: number;
  arrivalMinutes: number;
  arrivalTime: string;
  durationMinutes: number;
}

export interface RouteOptimisationResponse {
  runId: string;
  persisted: boolean;
  tenantId: string;
  objective: string;
  routes: OptimisedRoute[];
  rejected: { id: string; reason: string }[];
  solver: string;
  matrixProviders: string[];
  features: string[];
  limitations: string[];
  hazardSources: string[];
}

@Injectable({ providedIn: 'root' })
export class CarbonApiService {
  constructor(private readonly http: HttpClient) {}

  optimiseRoutes(objective: string, vehicleType: string, routes: RouteOptimisationInput[]): Observable<RouteOptimisationResponse> {
    return this.http.post<RouteOptimisationResponse>(`${CARBON_API_BASE_URL}/api/v1/routes/optimise`, {
      objective,
      vehicleType,
      routes
    }, { headers: this.tenantHeaders() });
  }

  updateRouteStatus(runId: string, routeId: string, status: 'APPROVED' | 'IN_TRANSIT' | 'DELIVERED'): Observable<OptimisedRoute> {
    return this.http.post<OptimisedRoute>(`${CARBON_API_BASE_URL}/api/v1/routes/runs/${runId}/routes/${routeId}/status`, {
      status
    }, { headers: this.tenantHeaders() });
  }

  private tenantHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-Tenant-ID': localStorage.getItem('stockflowTenantId') ?? 'TEN-ACME-PHARMA',
      'X-User-ID': localStorage.getItem('stockflowUserId') ?? 'demo-planner'
    });
  }
}
