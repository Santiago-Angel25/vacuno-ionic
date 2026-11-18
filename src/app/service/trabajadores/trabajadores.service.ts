import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { WorkerRequest, WorkerInvite, WorkerSummary } from './trabajadores.models';
import type { FarmActivity } from '../actividades/actividades.models';

@Injectable({ providedIn: 'root' })
export class TrabajadoresService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  workers(farmId: number): Observable<WorkerSummary[]> {
    return this.http.get<WorkerSummary[]>(`${this.apiUrl}/trabajadores`, { params: { fincaId: farmId } });
  }

  inviteWorker(worker: WorkerRequest): Observable<WorkerInvite> {
    return this.http.post<WorkerInvite>(`${this.apiUrl}/trabajadores`, worker);
  }

  workerActivities(farmId: number, workerId: number): Observable<FarmActivity[]> {
    return this.http.get<FarmActivity[]>(`${this.apiUrl}/trabajadores/${workerId}/actividades`, {
      params: { fincaId: farmId },
    });
  }
}
