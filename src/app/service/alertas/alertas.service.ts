import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { catchError, forkJoin, map, of } from 'rxjs';
import { isTaskOverdue } from '../../shared/utils/task-due-date';
import { ActividadesService } from '../actividades/actividades.service';
import { environment } from '../../../environments/environment';
import type { FarmAlert } from './alertas.models';
import type { FarmTask } from '../actividades/actividades.models';

@Injectable({ providedIn: 'root' })
export class AlertasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly actividadesService = inject(ActividadesService);

  alerts(farmId: number): Observable<FarmAlert[]> {
    return this.http.get<FarmAlert[]>(`${this.apiUrl}/alertas`, { params: { fincaId: farmId } });
  }

  alertsWithPendingTasks(farmId: number, owner: boolean): Observable<FarmAlert[]> {
    const tasks = owner ? this.actividadesService.tasks(farmId) : this.actividadesService.myTasks(farmId);
    return forkJoin({
      alerts: this.alerts(farmId),
      tasks: tasks.pipe(catchError(() => of([] as FarmTask[]))),
    }).pipe(
      map(({ alerts, tasks }) => {
        const key = (title: string, detail: string | null) =>
          JSON.stringify([title.trim().toLowerCase(), (detail ?? '').trim()]);
        const timestamp = (date: string | null) => Date.parse(date ?? '') || -Infinity;
        const ordered = [...alerts].sort((a, b) => timestamp(b.fecha) - timestamp(a.fecha));
        const matched = new Map<string, number[]>();
        for (const [index, alert] of ordered.entries()) {
          if (alert.destino !== 'ACTIVIDAD') continue;
          const match = key(alert.titulo, alert.detalle);
          const indices = matched.get(match) ?? [];
          indices.push(index);
          matched.set(match, indices);
        }
        const missing: FarmAlert[] = [];
        for (const task of [...tasks].sort((a, b) => b.id - a.id)) {
          const titulo = 'Tarea asignada: ' + task.titulo;
          const match = key(titulo, task.descripcion);
          const index = matched.get(match)?.shift();
          const tareaVencida = isTaskOverdue(task);
          if (index !== undefined) {
            ordered[index] = { ...ordered[index], tareaId: task.id, tareaVencida, fechaLimite: task.fechaLimite };
            continue;
          }
          if (task.estado === 'PENDIENTE') {
            missing.push({
              id: 'pending-task-' + task.id,
              titulo,
              detalle: task.descripcion,
              fecha: null,
              destino: 'ACTIVIDAD',
              tareaId: task.id,
              tareaVencida,
              fechaLimite: task.fechaLimite,
            });
          }
        }
        return [...missing, ...ordered];
      }),
    );
  }
}
