import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { finalize, forkJoin, of, switchMap } from 'rxjs';

import { FarmService } from '../service/farm.service';
import type { Animal, AnimalHistoryItem } from '../service/farm.service';

@Component({
  selector: 'app-animal-detail',
  templateUrl: './animal-detail.page.html',
  styleUrl: './animal-detail.page.scss',
  imports: [
    ReactiveFormsModule,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
})
export class AnimalDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly farms = inject(FarmService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly form = this.fb.nonNullable.group({
    pesoActual: ['', [Validators.required, Validators.min(0.01)]],
    estado: ['SALUDABLE', Validators.required],
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
    this.farms
      .myFarms()
      .pipe(
        switchMap((farms) => {
          this.farmId = farms[0]?.id ?? null;
          return this.farmId
            ? forkJoin({
                animal: this.farms.animal(this.farmId, this.animalId),
                history: this.farms.animalHistory(this.farmId, this.animalId),
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
    if (!this.farmId || this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving = true;
    this.farms
      .updateAnimalFollowUp(this.farmId, this.animalId, Number(value.pesoActual), value.estado)
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

  date(value: string): string {
    return new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
  }
  idLabel(): string {
    return this.animal?.identificador || `AN-${String(this.animalId).padStart(4, '0')}`;
  }

  get canUpdateFollowUp(): boolean {
    return !!this.animal && !['VENDIDO', 'FALLECIDO', 'INACTIVO'].includes(this.animal.estado);
  }
}
