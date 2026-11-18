import type { DashboardResponse } from '../../interfaces/finca.interfaces';
import type { FarmAlert } from '../../interfaces/alertas.interfaces';
import type { FarmTask } from '../../interfaces/actividades.interfaces';
import { AlertasService } from '../../service/alertas.service';
import { FincaService } from '../../service/finca.service';
import { ActividadesService } from '../../service/actividades.service';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { IonGrid, IonRow, IonCol, IonButton, IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  checkmarkCircleOutline,
  leafOutline,
  notificationsOutline,
  pawOutline,
  timeOutline,
} from 'ionicons/icons';
import { finalize, map, of, switchMap, tap } from 'rxjs';

import { AuthService } from '../../service/auth.service';
import { VacunoHeaderComponent } from '../../shared/vacuno-header/vacuno-header.component';
import { DetailModalComponent } from '../../shared/detail-modal/detail-modal.component';
import { isTaskOverdue, taskOverdueMessage } from '../../shared/utils/task-due-date';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [
    IonGrid,
    IonRow,
    IonCol,
    DatePipe,
    VacunoHeaderComponent,
    DetailModalComponent,
    IonButton,
    IonContent,
    IonIcon,
    RouterLink,
  ],
})
export class Tab1Page {
  readonly isTaskOverdue = isTaskOverdue;
  readonly taskOverdueMessage = taskOverdueMessage;
  private readonly router = inject(Router);
  private readonly alertasService = inject(AlertasService);
  private readonly fincaService = inject(FincaService);
  private readonly actividadesService = inject(ActividadesService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly auth = inject(AuthService);

  farmName = '';
  farmId: number | null = null;
  alerts: FarmAlert[] = [];
  selectedAlert: FarmAlert | null = null;
  selectedTask: FarmTask | null = null;
  registeringTask = false;
  alertsLoading = false;
  alertsError = false;
  dashboard: DashboardResponse | null = null;
  workerTasks: FarmTask[] = [];
  loading = true;
  errorMessage = '';
  hasFarm = true;

  constructor() {
    addIcons({
      alertCircleOutline,
      checkmarkCircleOutline,
      leafOutline,
      notificationsOutline,
      pawOutline,
      timeOutline,
    });
  }

  ionViewWillEnter(): void {
    this.loadDashboard();
  }

  get firstName(): string {
    return this.auth.currentUser?.nombres.split(' ')[0] ?? 'Bienvenido';
  }

  get avatarInitial(): string {
    return this.auth.currentUser?.nombres.charAt(0).toUpperCase() ?? 'V';
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  alertColor(alert: FarmAlert): 'red' | 'yellow' | 'green' | 'gray' {
    return alert.tareaVencida ? 'red' : this.activityColor(alert.titulo);
  }

  openAlert(alert: FarmAlert): void {
    if (alert.destino === 'COMPRAS') {
      const compraId = /^compra-(?:revision-)?(\d+)$/.exec(alert.id)?.[1];
      void this.router.navigate(['/tabs/compras'], { queryParams: { compraId } });
      return;
    }
    this.selectedAlert = alert;
  }

  activityColor(label: string): 'red' | 'yellow' | 'green' | 'gray' {
    const title = label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/_/g, ' ');
    if (/\bmedicamentos?\b/.test(title)) return 'red';
    if (/\b(vacunacion|revision|reproduccion)\b/.test(title)) return 'yellow';
    if (/\b(alimentacion|pesaje|insumos?)\b/.test(title)) return 'green';
    return 'gray';
  }

  get pendingTaskCount(): number {
    return this.workerTasks.filter((task) => task.estado === 'PENDIENTE').length;
  }

  taskStatus(task: FarmTask) {
    if (isTaskOverdue(task)) return { label: 'Vencida', tone: 'red', icon: 'alert-circle-outline' };
    if (['COMPLETADA', 'REALIZADA', 'HECHA'].includes(task.estado)) {
      return { label: 'Realizada', tone: 'green', icon: 'checkmark-circle-outline' };
    }
    return {
      label: task.estado === 'PENDIENTE' ? 'Pendiente' : task.estado,
      tone: 'yellow',
      icon: 'time-outline',
    };
  }

  get selectedAlertTask(): FarmTask | undefined {
    const taskId = this.selectedAlert?.tareaId;
    if (taskId === undefined || this.auth.currentUser?.rol !== 'TRABAJADOR') return undefined;
    return this.workerTasks.find((task) => task.id === taskId);
  }

  closeTaskDetail(): void {
    const task = this.registeringTask ? (this.selectedTask ?? this.selectedAlertTask) : undefined;
    this.selectedTask = null;
    this.selectedAlert = null;
    this.registeringTask = false;
    if (task?.estado === 'PENDIENTE' && !isTaskOverdue(task)) {
      void this.router.navigate(['/tabs/actividad/nueva'], { queryParams: { taskId: task.id } });
    }
  }

  loadAlerts(): void {
    if (this.farmId === null || this.alertsLoading) return;
    this.alertsLoading = true;
    this.alertsError = false;
    this.alertasService
      .alertsWithPendingTasks(this.farmId, this.auth.currentUser?.rol === 'PROPIETARIO')
      .pipe(
        finalize(() => {
          this.alertsLoading = false;
          this.changeDetector.markForCheck();
        }),
      )
      .subscribe({
        next: (alerts) => {
          this.alerts = alerts;
        },
        error: () => {
          this.alertsError = true;
        },
      });
  }

  loadDashboard(): void {
    this.loading = true;
    this.errorMessage = '';
    this.fincaService
      .myFarms()
      .pipe(
        switchMap((farms) => {
          const farm = farms[0];
          if (this.farmId !== (farm?.id ?? null)) this.alerts = [];
          this.farmId = farm?.id ?? null;
          this.loadAlerts();
          if (!farm) {
            this.hasFarm = false;
            this.farmName = '';
            return of(null);
          }
          this.hasFarm = true;
          this.farmName = farm.nombre;
          if (this.auth.currentUser?.rol === 'TRABAJADOR') {
            return this.actividadesService.myTasks(farm.id).pipe(
              tap((tasks) => {
                this.workerTasks = tasks;
              }),
              map(() => null),
            );
          }
          return this.fincaService.dashboard(farm.id);
        }),
        finalize(() => {
          this.loading = false;
          this.changeDetector.markForCheck();
        }),
      )
      .subscribe({
        next: (dashboard) => {
          this.dashboard = dashboard;
          this.changeDetector.markForCheck();
        },
        error: () => {
          this.errorMessage = 'No pudimos cargar el resumen. Intenta de nuevo.';
          this.changeDetector.markForCheck();
        },
      });
  }
}
