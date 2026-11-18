import { AuthService } from '../../service/auth.service';
import { AlertController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import type { Animal, AnimalHistoryItem } from '../../interfaces/animales.interfaces';
import { FincaService } from '../../service/finca.service';
import { AnimalesService } from '../../service/animales.service';
import { VacunoHeaderComponent } from '../../shared/vacuno-header/vacuno-header.component';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
} from '@ionic/angular';
import { finalize, forkJoin, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-animal-detail',
  templateUrl: './animal-detail.page.html',
  styleUrl: './animal-detail.page.scss',
  imports: [
    IonGrid,
    IonRow,
    IonCol,
    VacunoHeaderComponent,
    ReactiveFormsModule,
    IonButton,
    IonContent,
    IonInput,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonTextarea,
  ],
})
export class AnimalDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertController);
  private readonly toasts = inject(ToastController);
  deleting = false;
  private readonly fincaService = inject(FincaService);
  private readonly animalesService = inject(AnimalesService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly form = this.fb.nonNullable.group({
    pesoActual: ['', [Validators.required, Validators.min(0.01)]],
    estado: ['SALUDABLE', Validators.required],
    motivoEstado: [''],
  });
  farmId: number | null = null;
  animalId = Number(this.route.snapshot.paramMap.get('id'));
  animal: Animal | null = null;
  history: AnimalHistoryItem[] = [];
  loading = true;
  saving = false;
  errorMessage = '';

  ionViewWillEnter(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.fincaService
      .myFarms()
      .pipe(
        switchMap((farms) => {
          this.farmId = farms[0]?.id ?? null;
          return this.farmId
            ? forkJoin({
                animal: this.animalesService.animal(this.farmId, this.animalId),
                history: this.animalesService.animalHistory(this.farmId, this.animalId),
              })
            : of(null);
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (result) => {
          if (!result) return;
          this.animal = result.animal;
          this.history = result.history;
          this.form.patchValue({
            pesoActual: String(result.animal.pesoActual ?? result.animal.pesoInicial ?? ''),
            estado: result.animal.estado || 'SALUDABLE',
          });
          this.cdr.markForCheck();
        },
        error: (error: { error?: { detail?: string } }) => {
          this.errorMessage = error.error?.detail ?? 'No fue posible cargar la ficha del animal.';
          this.cdr.markForCheck();
        },
      });
  }

  saveFollowUp(): void {
    if (!this.farmId || this.form.invalid || this.saving || this.deleting) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    if (this.enteringAttention && !value.motivoEstado.trim()) {
      this.errorMessage = 'Explica por qué el animal pasa a estado de atención.';
      return;
    }
    this.saving = true;
    this.animalesService
      .updateAnimalFollowUp(
        this.farmId,
        this.animalId,
        Number(value.pesoActual),
        value.estado,
        value.motivoEstado.trim(),
      )
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (animal) => {
          this.animal = animal;
          this.load();
          this.cdr.markForCheck();
        },
        error: (error: { error?: { detail?: string } }) => {
          this.errorMessage = error.error?.detail ?? 'No fue posible guardar el seguimiento.';
          this.cdr.markForCheck();
        },
      });
  }

  get canDelete(): boolean {
    return this.auth.currentUser?.rol === 'PROPIETARIO' && !!this.farmId && !!this.animal;
  }

  async confirmDelete(): Promise<void> {
    if (!this.canDelete || this.deleting || this.saving) return;
    this.deleting = true;
    this.errorMessage = '';
    try {
      const alert = await this.alerts.create({
        header: '¿Eliminar animal?',
        message: 'Se eliminará el animal del listado. Su historial se conservará.',
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          { text: 'Eliminar', role: 'confirm', cssClass: 'alert-button-danger' },
        ],
      });
      await alert.present();
      const { role } = await alert.onDidDismiss();
      if (role !== 'confirm' || !this.canDelete) return;
      await firstValueFrom(this.animalesService.deleteAnimal(this.farmId!, this.animalId));
      const toast = await this.toasts.create({
        message: 'Animal eliminado correctamente.',
        duration: 2000,
        position: 'bottom',
        color: 'success',
      });
      await toast.present();
      await this.router.navigateByUrl('/tabs/ganado', { replaceUrl: true });
    } catch (error) {
      const response = error as { error?: { detail?: string } };
      this.errorMessage = response.error?.detail ?? 'No fue posible eliminar el animal. Intenta de nuevo.';
    } finally {
      this.deleting = false;
      this.cdr.markForCheck();
    }
  }

  date(value: string): string {
    return new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
  }
  idLabel(): string {
    return this.animal?.identificador || `AN-${String(this.animalId).padStart(4, '0')}`;
  }

  get canUpdateFollowUp(): boolean {
    return !!this.animal && !['VENDIDO', 'FALLECIDO', 'INACTIVO'].includes(this.animal.estado);
  }

  get enteringAttention(): boolean {
    return this.form.controls.estado.value === 'EN_ATENCION' && this.animal?.estado !== 'EN_ATENCION';
  }
}
