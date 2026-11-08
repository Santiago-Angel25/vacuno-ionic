import type { OnInit } from '@angular/core';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonAvatar, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { alertCircleOutline, leafOutline, notificationsOutline, pawOutline, timeOutline } from 'ionicons/icons';
import { finalize, map, of, switchMap, tap } from 'rxjs';

import { AuthService } from '../service/auth.service';
import type { DashboardResponse, FarmTask } from '../service/farm.service';
import { FarmService } from '../service/farm.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [IonAvatar, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonToolbar, RouterLink],
})
export class Tab1Page implements OnInit {
  private readonly farms = inject(FarmService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly auth = inject(AuthService);

  farmName = '';
  dashboard: DashboardResponse | null = null;
  workerTasks: FarmTask[] = [];
  loading = true;
  errorMessage = '';
  hasFarm = true;

  constructor() {
    addIcons({ alertCircleOutline, leafOutline, notificationsOutline, pawOutline, timeOutline });
  }

  ngOnInit(): void {
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

  loadDashboard(): void {
    this.loading = true;
    this.errorMessage = '';
    this.farms
      .myFarms()
      .pipe(
        switchMap((farms) => {
          const farm = farms[0];
          if (!farm) {
            this.hasFarm = false;
            this.farmName = '';
            return of(null);
          }
          this.hasFarm = true;
          this.farmName = farm.nombre;
          if (this.auth.currentUser?.rol === 'TRABAJADOR') {
            return this.farms.myTasks(farm.id).pipe(
              tap((tasks) => {
                this.workerTasks = tasks;
              }),
              map(() => null),
            );
          }
          return this.farms.dashboard(farm.id);
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
