import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonSelect, IonSelectOption, IonTitle, IonToolbar } from '@ionic/angular';
import { finalize } from 'rxjs';

import { FarmService } from '../service/farm.service';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.page.html',
  styleUrl: './product-form.page.scss',
  imports: [ReactiveFormsModule, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonSelect, IonSelectOption, IonTitle, IonToolbar],
})
export class ProductFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly farms = inject(FarmService);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    categoria: ['', Validators.required],
    unidad: ['', Validators.required],
    stockMinimo: ['0', [Validators.required, Validators.min(0)]],
  });
  farmId: number | null = null;
  saving = false;
  errorMessage = '';

  constructor() {
    this.form.controls.categoria.valueChanges.subscribe((category) => {
      this.form.controls.unidad.setValue(category === 'ALIMENTOS' ? 'BULTO' : 'UNIDAD');
      this.changeDetector.markForCheck();
    });
    this.farms.myFarms().subscribe({
      next: (farms) => {
        this.farmId = farms[0]?.id ?? null;
        if (!this.farmId) this.errorMessage = 'Tu cuenta todavía no tiene una finca asociada.';
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorMessage = 'No pudimos cargar la finca para asociar el producto.';
        this.changeDetector.markForCheck();
      },
    });
  }

  submit(): void {
    if (!this.farmId || this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    if (value.categoria === 'ALIMENTOS' && !Number.isInteger(Number(value.stockMinimo))) {
      this.errorMessage = 'El stock mínimo debe ser un número entero de bultos.';
      return;
    }
    this.saving = true;
    this.errorMessage = '';
    this.farms.createProduct({
      fincaId: this.farmId,
      nombre: value.nombre.trim(),
      categoria: value.categoria,
      unidad: value.unidad,
      stockMinimo: Number(value.stockMinimo),
    }).pipe(finalize(() => {
      this.saving = false;
      this.changeDetector.markForCheck();
    })).subscribe({
      next: () => void this.router.navigateByUrl('/tabs/inventario'),
      error: (error: { error?: { detail?: string; message?: string } }) => {
        this.errorMessage = error.error?.detail ?? error.error?.message ?? 'No fue posible registrar el producto.';
        this.changeDetector.markForCheck();
      },
    });
  }
}
