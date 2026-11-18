import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { FarmActivity, ActivityRequest, FarmTask, TaskRequest } from './actividades.models';

@Injectable({ providedIn: 'root' })
export class ActividadesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  activities(farmId: number): Observable<FarmActivity[]> {
    return this.http.get<FarmActivity[]>(`${this.apiUrl}/actividades`, { params: { fincaId: farmId } });
  }

  createActivity(activity: ActivityRequest): Observable<FarmActivity> {
    return this.http.post<FarmActivity>(`${this.apiUrl}/actividades`, activity);
  }

  myTasks(farmId: number): Observable<FarmTask[]> {
    return this.http.get<FarmTask[]>(`${this.apiUrl}/tareas/mias`, { params: { fincaId: farmId } });
  }

  deleteOverdueTask(farmId: number, taskId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tareas/${taskId}`, { params: { fincaId: farmId } });
  }

  tasks(farmId: number): Observable<FarmTask[]> {
    return this.http.get<FarmTask[]>(`${this.apiUrl}/tareas`, { params: { fincaId: farmId } });
  }

  createTask(task: TaskRequest): Observable<FarmTask> {
    return this.http.post<FarmTask>(`${this.apiUrl}/tareas`, task);
  }

  registerTaskActivity(
    farmId: number,
    taskId: number,
    fotoUrl: string,
    consumption?: Pick<ActivityRequest, 'productoId' | 'cantidadPorDosis' | 'numeroDosis'>,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/tareas/${taskId}/registrar-actividad`,
      { fotoUrl, ...consumption },
      {
        params: { fincaId: farmId },
      },
    );
  }
}
