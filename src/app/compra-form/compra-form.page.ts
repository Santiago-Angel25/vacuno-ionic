import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
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
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { finalize, of, switchMap } from 'rxjs';

import { FarmService } from '../service/farm.service';
import type { InventoryProduct } from '../service/farm.service';

@Component({
  selector: 'app-compra-form',
  templateUrl: './compra-form.page.html',
  styleUrl: './compra-form.page.scss',
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
    IonTitle,
    IonToolbar,
  ],
})
export class CompraFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly farms = inject(FarmService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly form = this.fb.nonNullable.group({
    proveedor: [''],
    fecha: [this.localDate(), Validators.required],
    observaciones: [''],
    productoId: ['nuevo', Validators.required],
    nombre: [''],
    categoria: ['ALIMENTOS'],
    unidad: ['KG'],
    cantidad: ['', [Validators.required, Validators.min(0.001)]],
    precioUnitario: ['', [Validators.required, Validators.min(0)]],
  });
  farmId: number | null = null;
  products: InventoryProduct[] = [];
  invoicePhoto = '';
  productPhoto = '';
  photoError = '';
  errorMessage = '';
  saving = false;

  constructor() {
    this.farms
      .myFarms()
      .pipe(
        switchMap((farms) => {
          this.farmId = farms[0]?.id ?? null;
          return this.farmId ? this.farms.inventory(this.farmId) : of([] as InventoryProduct[]);
        }),
      )
      .subscribe({
        next: (items) => {
          this.products = items;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'No pudimos cargar los productos existentes.';
          this.cdr.markForCheck();
        },
      });
  }

  private localDate(): string {
    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 10);
  }

  async onPhoto(event: Event, type: 'invoice' | 'product'): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.photoError = '';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.photoError = 'Usa una imagen JPG, PNG o WebP.';
      this.cdr.markForCheck();
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.photoError = 'Cada foto debe pesar máximo 2 MB.';
      this.cdr.markForCheck();
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('No fue posible leer la foto.'));
      reader.readAsDataURL(file);
    }).catch(() => '');
    if (!dataUrl) {
      this.photoError = 'No fue posible leer la foto.';
      return;
    }
    if (type === 'invoice') this.invoicePhoto = dataUrl;
    else this.productPhoto = dataUrl;
    this.cdr.markForCheck();
  }

  submit(): void {
    if (!this.farmId || this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.invoicePhoto || !this.productPhoto) {
      this.photoError = 'Adjunta la foto de la factura y del producto.';
      return;
    }
    const value = this.form.getRawValue();
    const productId = Number(value.productoId);
    if (Number.isNaN(productId) && (!value.nombre.trim() || !value.categoria || !value.unidad)) {
      this.errorMessage = 'Completa nombre, categoría y unidad del producto nuevo.';
      return;
    }
    this.saving = true;
    this.errorMessage = '';
    this.farms
      .createPurchase({
        fincaId: this.farmId,
        proveedor: value.proveedor.trim(),
        fecha: value.fecha,
        observaciones: value.observaciones.trim(),
        facturaFotoUrl: this.invoicePhoto,
        productoFotoUrl: this.productPhoto,
        productos: [
          {
            ...(!Number.isNaN(productId)
              ? { productoId: productId }
              : {
                  nombre: value.nombre.trim(),
                  categoria: value.categoria,
                  unidad: value.unidad,
                }),
            cantidad: Number(value.cantidad),
            precioUnitario: Number(value.precioUnitario),
          },
        ],
      })
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => void this.router.navigateByUrl('/tabs/compras'),
        error: (error: { error?: { detail?: string } }) => {
          this.errorMessage = error.error?.detail ?? 'No fue posible registrar la compra.';
          this.cdr.markForCheck();
        },
      });
  }
}
