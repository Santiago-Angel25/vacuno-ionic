import type { FarmActivity } from '../../service/actividades/actividades.models';
import type { WorkerSummary } from '../../service/trabajadores/trabajadores.models';
import { FincaService } from '../../service/finca/finca.service';
import { TrabajadoresService } from '../../service/trabajadores/trabajadores.service';
import { VacunoHeaderComponent } from '../../shared/vacuno-header/vacuno-header.component';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { finalize, forkJoin, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-trabajador-detalle',
  templateUrl: './trabajador-detalle.page.html',
  styleUrl: './trabajador-detalle.page.scss',
  imports: [VacunoHeaderComponent, IonContent],
})
export class TrabajadorDetallePage {
  private readonly route = inject(ActivatedRoute);
  private readonly fincaService = inject(FincaService);
  private readonly trabajadoresService = inject(TrabajadoresService);
  private readonly cdr = inject(ChangeDetectorRef);
  workerId = Number(this.route.snapshot.paramMap.get('id'));
  worker: WorkerSummary | null = null;
  activities: FarmActivity[] = [];
  loading = true;
  errorMessage = '';

  ionViewWillEnter(): void {
    this.fincaService
      .myFarms()
      .pipe(
        switchMap((farms) => {
          const farmId = farms[0]?.id;
          if (!farmId) return of(null);
          return forkJoin({
            workerList: this.trabajadoresService.workers(farmId),
            activities: this.trabajadoresService.workerActivities(farmId, this.workerId),
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
