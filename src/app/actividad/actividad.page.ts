import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonFabList,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, createOutline, personAddOutline } from 'ionicons/icons';
import { finalize, forkJoin, of, switchMap } from 'rxjs';

import { AuthService } from '../service/auth.service';
import { FarmService } from '../service/farm.service';
import type { FarmActivity, FarmTask } from '../service/farm.service';

@Component({
  selector: 'app-actividad',
  templateUrl: './actividad.page.html',
  styleUrl: './actividad.page.scss',
  imports: [
    RouterLink,
    IonContent,
    IonFab,
    IonFabButton,
    IonFabList,
    IonHeader,
    IonIcon,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
})
export class ActividadPage {
  private readonly farms = inject(FarmService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly auth = inject(AuthService);
  farmId: number | null = null;
  activities: FarmActivity[] = [];
  tasks: FarmTask[] = [];
  loading = true;
  errorMessage = '';

  constructor() {
    addIcons({ add, createOutline, personAddOutline });
  }

  ionViewWillEnter(): void {
    this.loading = true;
    this.farms
      .myFarms()
      .pipe(
        switchMap((farms) => {
          this.farmId = farms[0]?.id ?? null;
          if (!this.farmId) return of({ activities: [], tasks: [] } as { activities: FarmActivity[]; tasks: FarmTask[] });
          return forkJoin({
            activities: this.farms.activities(this.farmId),
            tasks: this.auth.currentUser?.rol === 'PROPIETARIO'
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

  date(value: string): string {
    return new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
  }

  activityQuantity(activity: FarmActivity): number {
    return activity.tipo === 'ALIMENTACION'
      ? Math.floor(activity.cantidadPorDosis ?? 0)
      : activity.cantidadPorDosis ?? 0;
  }

  activityDescription(activity: FarmActivity): string {
    return activity.tipo === 'ALIMENTACION'
      ? activity.descripcion.replace(/\s·\s[^·]+:\s[\d.,]+\s+\S+\s+usado\(s\)\s+en\s+\d+\s+dosis$/i, '')
      : activity.descripcion;
  }
}
