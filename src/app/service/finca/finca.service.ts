import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { FarmSummary, DashboardResponse } from './finca.models';

@Injectable({ providedIn: 'root' })
export class FincaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  myFarms(): Observable<FarmSummary[]> {
    return this.http.get<FarmSummary[]>(`${this.apiUrl}/fincas`);
  }

  dashboard(farmId: number): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${this.apiUrl}/reportes/dashboard`, {
      params: { fincaId: farmId },
    });
  }
}
