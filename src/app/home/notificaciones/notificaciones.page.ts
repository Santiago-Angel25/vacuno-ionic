import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular';
import { finalize, of, switchMap } from 'rxjs';
import { FarmService } from '../../service/farm.service';
import { AuthService } from '../../service/auth.service';
import type { FarmAlert } from '../../service/farm.service';
import { VacunoHeaderComponent } from '../../shared/vacuno-header/vacuno-header.component';

@Component({
  selector: 'app-notificaciones',
  templateUrl: './notificaciones.page.html',
  styleUrl: './notificaciones.page.scss',
  imports: [DatePipe, RouterLink, IonButton, IonContent, VacunoHeaderComponent],
})
export class NotificacionesPage {
  private readonly farms = inject(FarmService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  readonly alerts = signal<FarmAlert[]>([]);
  readonly loading = signal(false);
  readonly failed = signal(false);

  ionViewWillEnter(): void {
    this.loadAlerts();
  }

  loadAlerts(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.failed.set(false);
    this.farms.myFarms().pipe(
      switchMap(([farm]) => farm
        ? this.farms.alertsWithPendingTasks(farm.id, this.auth.currentUser?.rol === 'PROPIETARIO')
        : of([] as FarmAlert[])),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: alerts => this.alerts.set(alerts),
      error: () => this.failed.set(true),
    });
  }
}
