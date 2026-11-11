import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonSelect, IonSelectOption, IonTitle, IonToolbar } from '@ionic/angular';
import { finalize } from 'rxjs';

import { FarmService } from '../service/farm.service';
import { CameraPickerComponent } from '../shared/camera-picker.component';

@Component({
  selector: 'app-animal-form',
  templateUrl: './animal-form.page.html',
  styleUrl: './animal-form.page.scss',
  imports: [CameraPickerComponent, ReactiveFormsModule, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonSelect, IonSelectOption, IonTitle, IonToolbar],
})
export class AnimalFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly farms = inject(FarmService);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    sexo: ['', Validators.required],
    raza: ['', Validators.required],
    fechaNacimiento: ['', Validators.required],
    pesoInicial: ['', [Validators.required, Validators.min(0.01)]],
    estado: ['', Validators.required],
    observaciones: [''],
  });
  farmId: number | null = null;
  photoUrl = '';
  saving = false;
  errorMessage = '';

  constructor() {
    this.farms.myFarms().subscribe({
      next: (farms) => {
        this.farmId = farms[0]?.id ?? null;
        if (!this.farmId) this.errorMessage = 'Tu cuenta todavía no tiene una finca asociada.';
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorMessage = 'No pudimos cargar la finca para asociar el animal.';
        this.changeDetector.markForCheck();
      },
    });
  }

  selectPhoto(file?: File): void {
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
      this.errorMessage = 'Elige una imagen de máximo 2 MB.';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.photoUrl = typeof reader.result === 'string' ? reader.result : '';
      this.errorMessage = '';
      this.changeDetector.markForCheck();
    };
    reader.onerror = () => {
      this.errorMessage = 'No pudimos leer la fotografía.';
      this.changeDetector.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  submit(): void {
    if (!this.farmId || this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving = true;
    this.errorMessage = '';
    this.farms.createAnimal({
      fincaId: this.farmId,
      nombre: value.nombre.trim(),
      sexo: value.sexo,
      raza: value.raza.trim(),
      fechaNacimiento: value.fechaNacimiento,
      pesoInicial: Number(value.pesoInicial),
      fotoUrl: this.photoUrl,
      observaciones: value.observaciones.trim(),
      estado: value.estado,
    }).pipe(finalize(() => {
      this.saving = false;
      this.changeDetector.markForCheck();
    })).subscribe({
      next: () => void this.router.navigateByUrl('/tabs/ganado'),
      error: (error: { error?: { detail?: string; message?: string } }) => {
        this.errorMessage = error.error?.detail ?? error.error?.message ?? 'No fue posible registrar el animal.';
        this.changeDetector.markForCheck();
      },
    });
  }
}
