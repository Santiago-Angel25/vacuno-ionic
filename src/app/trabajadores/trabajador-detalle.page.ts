import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { finalize, forkJoin, of, switchMap } from 'rxjs';

import { FarmService } from '../service/farm.service';
import type { FarmActivity, WorkerSummary } from '../service/farm.service';

@Component({
  selector: 'app-trabajador-detalle',
  templateUrl: './trabajador-detalle.page.html',
  styleUrl: './trabajador-detalle.page.scss',
  imports: [IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar],
})
export class TrabajadorDetallePage {
  private readonly route = inject(ActivatedRoute);
  private readonly farms = inject(FarmService);
  private readonly cdr = inject(ChangeDetectorRef);
  workerId = Number(this.route.snapshot.paramMap.get('id'));
  worker: WorkerSummary | null = null;
  activities: FarmActivity[] = [];
  loading = true;
  errorMessage = '';

  ionViewWillEnter(): void {
    this.farms
      .myFarms()
      .pipe(
        switchMap((farms) => {
          const farmId = farms[0]?.id;
          if (!farmId) return of(null);
          return forkJoin({
            workerList: this.farms.workers(farmId),
            activities: this.farms.workerActivities(farmId, this.workerId),
          });
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (data) => {
          if (!data) return;
          this.worker = data.workerList.find((item) => item.id === this.workerId) ?? null;
          this.activities = data.activities;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'No fue posible cargar la actividad del trabajador.';
          this.cdr.markForCheck();
        },
      });
  }

  date(value: string): string {
    return new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
  }
}
