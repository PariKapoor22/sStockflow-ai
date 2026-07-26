import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { DashboardOverview } from '../models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  constructor(private readonly http: HttpClient) {}

  loadOverview(): Observable<DashboardOverview> {
    return this.http.get<DashboardOverview>('/api/v1/dashboard/overview').pipe(
      catchError(() => this.http.get<DashboardOverview>('/assets/mock/dashboard-overview.json'))
    );
  }
}
