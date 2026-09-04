import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DistrictFeatureCollection } from '../models/ner-district.models';
import { API_BASE_URL } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class NerContractAdapterService {
  private readonly districtsApiUrl = `${API_BASE_URL}/api/v1/districts`;
  private readonly districtsFallbackUrl = 'assets/data/districts.json';

  constructor(private readonly http: HttpClient) {}

  /**
   * Fetches the canonical district GeoJSON from StockFlow. The bundled copy is
   * retained only for offline/demo continuity when the core API is unavailable.
   */
  getDistrictForecasts(): Observable<DistrictFeatureCollection> {
    return this.http.get<DistrictFeatureCollection>(this.districtsApiUrl, {
      headers: { 'X-Tenant-ID': localStorage.getItem('stockflowTenantId') ?? 'TEN-ACME-PHARMA' }
    }).pipe(
      catchError(() => this.http.get<DistrictFeatureCollection>(this.districtsFallbackUrl))
    );
  }
}
