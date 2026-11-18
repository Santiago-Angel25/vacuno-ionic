import { AuthService } from '../../service/auth.service';
import { AlertController, ToastController, IonButton } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import type { FarmActivity } from '../../interfaces/actividades.interfaces';
import type { WorkerSummary } from '../../interfaces/trabajadores.interfaces';
import { FincaService } from '../../service/finca.service';
import { TrabajadoresService } from '../../service/trabajadores.service';
import { VacunoHeaderComponent } from '../../shared/vacuno-header/vacuno-header.component';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { finalize, forkJoin, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-trabajador-detalle',
  templateUrl: './trabajador-detalle.page.html',
  styleUrl: './trabajador-detalle.page.scss',
  imports: [VacunoHeaderComponent, IonContent, IonButton],
})
export class TrabajadorDetallePage {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertController);
  private readonly toasts = inject(ToastController);
  deleting = false;
  private readonly fincaService = inject(FincaService);
  private readonly trabajadoresService = inject(TrabajadoresService);
  private readonly cdr = inject(ChangeDetectorRef);
  farmId: number | null = null;
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
          this.farmId = farmId ?? null;
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

  get canDelete(): boolean {
    return this.auth.currentUser?.rol === 'PROPIETARIO' && !!this.farmId && !!this.worker;
  }

  async confirmDelete(): Promise<void> {
    if (!this.canDelete || this.deleting) return;
    this.deleting = true;
    this.errorMessage = '';
    try {
      const alert = await this.alerts.create({
        header: '¿Eliminar trabajador?',
        message: 'Se retirará al trabajador de esta finca y dejará de tener acceso a ella. Su historial se conservará.',
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          { text: 'Eliminar', role: 'confirm', cssClass: 'alert-button-danger' },
        ],
      });
      await alert.present();
      const { role } = await alert.onDidDismiss();
      if (role !== 'confirm' || !this.canDelete) return;
      await firstValueFrom(this.trabajadoresService.deleteWorker(this.farmId!, this.workerId));
      const toast = await this.toasts.create({
        message: 'Trabajador eliminado correctamente.',
        duration: 2000,
        position: 'bottom',
        color: 'success',
      });
      await toast.present();
      await this.router.navigateByUrl('/tabs/trabajadores', { replaceUrl: true });
    } catch (error) {
      const response = error as { error?: { detail?: string } };
      this.errorMessage = response.error?.detail ?? 'No fue posible eliminar el trabajador. Intenta de nuevo.';
    } finally {
      this.deleting = false;
      this.cdr.markForCheck();
    }
  }

  date(value: string): string {
    return new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
  }
}
