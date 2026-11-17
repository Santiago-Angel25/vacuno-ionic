import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  AlertController,
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonFabList,
  IonIcon,
  IonModal,
  IonSpinner,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, calendarOutline, checkmarkOutline, createOutline, documentTextOutline, medkitOutline, nutritionOutline, pawOutline, personAddOutline, personOutline, timeOutline } from 'ionicons/icons';
import { finalize, forkJoin, of, switchMap } from 'rxjs';

import { AuthService } from '../service/auth.service';
import { FarmService } from '../service/farm.service';
import type { FarmActivity, FarmTask } from '../service/farm.service';
import { VacunoHeaderComponent } from '../shared/vacuno-header.component';
import { isTaskOverdue, taskOverdueMessage } from '../shared/task-due-date';

@Component({
  selector: 'app-actividad',
  templateUrl: './actividad.page.html',
  styleUrl: './actividad.page.scss',
  imports: [
    VacunoHeaderComponent,
    RouterLink,
    IonButton,
    IonContent,
    IonFab,
    IonFabButton,
    IonFabList,
    IonIcon,
    IonModal,
    IonSpinner,
  ],
})
export class ActividadPage {
  private readonly alertController = inject(AlertController);
  private readonly router = inject(Router);
  readonly taskOverdueMessage = taskOverdueMessage;
  readonly isTaskOverdue = isTaskOverdue;
  private readonly farms = inject(FarmService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly auth = inject(AuthService);
  farmId: number | null = null;
  activities: FarmActivity[] = [];
  tasks: FarmTask[] = [];
  selected: { kind: 'task'; data: FarmTask } | { kind: 'activity'; data: FarmActivity } | null = null;
  loading = true;
  errorMessage = '';
  deletingTask = false;
  deleteError = '';

  constructor() {
    addIcons({ add, calendarOutline, checkmarkOutline, createOutline, documentTextOutline, medkitOutline, nutritionOutline, pawOutline, personAddOutline, personOutline, timeOutline });
  }

  ionViewWillEnter(): void {
    this.loading = true;
    this.farms
      .myFarms()
      .pipe(
        switchMap((farms) => {
          this.farmId = farms[0]?.id ?? null;
          if (!this.farmId)
            return of({ activities: [], tasks: [] } as { activities: FarmActivity[]; tasks: FarmTask[] });
          return forkJoin({
            activities: this.farms.activities(this.farmId),
            tasks:
              this.auth.currentUser?.rol === 'PROPIETARIO'
                ? this.farms.tasks(this.farmId)
                : this.farms.myTasks(this.farmId),
          });
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: ({ activities, tasks }) => {
          this.activities = activities;
          this.tasks = tasks.filter((task) => task.estado === 'PENDIENTE');
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'No fue posible cargar las actividades.';
          this.cdr.markForCheck();
        },
      });
  }

  get hasContent(): boolean {
    return this.activities.length > 0 || this.tasks.length > 0;
  }

  async registerTaskFromDetail(modal: IonModal, task: FarmTask): Promise<void> {
    if (this.auth.currentUser?.rol !== 'TRABAJADOR' || task.estado !== 'PENDIENTE' || isTaskOverdue(task)) return;
    if (await modal.dismiss()) {
      await this.router.navigate(['/tabs/actividad/nueva'], { queryParams: { taskId: task.id } });
    }
  }

  async deleteOverdueTask(modal: IonModal, task: FarmTask): Promise<void> {
    const farmId = this.farmId;
    if (!farmId || this.deletingTask || this.auth.currentUser?.rol !== 'PROPIETARIO' || !isTaskOverdue(task)) return;
    this.deletingTask = true;
    this.deleteError = '';
    try {
      const confirmation = await this.alertController.create({
        header: 'Eliminar actividad vencida',
        message: 'La tarea se eliminará de forma permanente.',
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          { text: 'Eliminar', role: 'destructive' },
        ],
      });
      await confirmation.present();
      if ((await confirmation.onDidDismiss()).role !== 'destructive') {
        this.deletingTask = false;
        this.cdr.markForCheck();
        return;
      }
      this.farms.deleteOverdueTask(farmId, task.id).pipe(
        finalize(() => {
          this.deletingTask = false;
          this.cdr.markForCheck();
        }),
      ).subscribe({
        next: () => {
          this.tasks = this.tasks.filter((item) => item.id !== task.id);
          if (this.selected?.kind === 'task' && this.selected.data.id === task.id) void modal.dismiss();
        },
        error: (error: { error?: { detail?: string } }) => {
          this.deleteError = error.error?.detail ?? 'No fue posible eliminar la actividad vencida.';
        },
      });
    } catch {
      this.deletingTask = false;
      this.deleteError = 'No fue posible confirmar la eliminación.';
      this.cdr.markForCheck();
    }
  }

  date(value: string): string {
    return new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
  }

  activityQuantity(activity: FarmActivity): number {
    return activity.tipo === 'ALIMENTACION'
      ? Math.floor(activity.cantidadPorDosis ?? 0)
      : (activity.cantidadPorDosis ?? 0);
  }

  activityDescription(activity: FarmActivity): string {
    return activity.tipo === 'ALIMENTACION'
      ? activity.descripcion.replace(/\s·\s[^·]+:\s[\d.,]+\s+\S+\s+usado\(s\)\s+en\s+\d+\s+dosis$/i, '')
      : activity.descripcion;
  }

  activityIcon(type: string): string {
    const category = type.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
    if (category === 'ALIMENTACION') return 'nutrition-outline';
    if (category === 'VACUNACION') return 'medkit-outline';
    return 'paw-outline';
  }
}
