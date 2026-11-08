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
import { finalize, of, switchMap } from 'rxjs';

import { AuthService } from '../service/auth.service';
import { FarmService } from '../service/farm.service';
import type { FarmActivity } from '../service/farm.service';

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
          return this.farmId ? this.farms.activities(this.farmId) : of([] as FarmActivity[]);
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (items) => {
          this.activities = items;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'No fue posible cargar las actividades.';
          this.cdr.markForCheck();
        },
      });
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
