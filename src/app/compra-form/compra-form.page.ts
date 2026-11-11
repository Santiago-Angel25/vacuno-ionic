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
import { finalize, forkJoin, of, switchMap } from 'rxjs';

import { FarmService } from '../service/farm.service';
import { CameraPickerComponent } from '../shared/camera-picker.component';
import type { InventoryProduct, Purchase } from '../service/farm.service';

@Component({
  selector: 'app-compra-form',
  templateUrl: './compra-form.page.html',
  styleUrl: './compra-form.page.scss',
  imports: [
    CameraPickerComponent,
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
    unidad: ['BULTO'],
    cantidad: ['', [Validators.required, Validators.min(0.001)]],
    precioUnitario: ['', [Validators.required, Validators.min(0)]],
  });
  farmId: number | null = null;
  products: InventoryProduct[] = [];
  previousPurchases: Purchase[] = [];
  invoicePhoto = '';
  productPhoto = '';
  photoError = '';
  errorMessage = '';
  invalidIntegerQuantity = false;
  saving = false;

  constructor() {
    this.form.controls.categoria.valueChanges.subscribe((category) => {
      this.form.controls.unidad.setValue(category === 'ALIMENTOS' ? 'BULTO' : 'UNIDAD');
      this.cdr.markForCheck();
    });
    this.form.controls.cantidad.valueChanges.subscribe(() => {
      this.invalidIntegerQuantity = false;
      this.errorMessage = '';
    });
    this.form.controls.productoId.valueChanges.subscribe((productId) => {
      this.applyProductDefaults(productId);
    });
    this.farms
      .myFarms()
      .pipe(
        switchMap((farms) => {
          this.farmId = farms[0]?.id ?? null;
          return this.farmId
            ? forkJoin({
                products: this.farms.inventory(this.farmId),
                purchases: this.farms.purchases(this.farmId),
              })
            : of({ products: [] as InventoryProduct[], purchases: [] as Purchase[] });
        }),
      )
      .subscribe({
        next: ({ products, purchases }) => {
          this.products = products;
          this.previousPurchases = purchases;
          if (this.form.controls.productoId.value !== 'nuevo')
            this.applyProductDefaults(this.form.controls.productoId.value);
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'No pudimos cargar los productos existentes.';
          this.cdr.markForCheck();
        },
      });
  }

  get alimentacion(): boolean {
    if (this.form.controls.productoId.value === 'nuevo')
      return this.form.controls.categoria.value === 'ALIMENTOS';
    return this.products.find((product) => String(product.id) === this.form.controls.productoId.value)
      ?.categoria.toUpperCase() === 'ALIMENTOS';
  }

  get selectedProduct(): InventoryProduct | undefined {
    return this.products.find((product) => String(product.id) === this.form.controls.productoId.value);
  }

  get requiresProductPhoto(): boolean {
    return !this.selectedProduct?.fotoUrl;
  }

  private applyProductDefaults(productId: string): void {
    const product = this.products.find((item) => String(item.id) === productId);
    if (!product) {
      this.form.patchValue({
        nombre: '',
        categoria: 'ALIMENTOS',
        unidad: 'BULTO',
        proveedor: '',
        cantidad: '',
        precioUnitario: '',
        observaciones: '',
      });
      this.productPhoto = '';
      this.cdr.markForCheck();
      return;
    }

    const containsProduct = (purchase: Purchase) =>
      purchase.productos.some((item) => item.productoId === product.id);
    const previous = this.previousPurchases
      .filter(containsProduct)
      .sort((first, second) => second.fecha.localeCompare(first.fecha) || second.id - first.id)[0];
    const previousLine = previous?.productos.find((item) => item.productoId === product.id);
    this.form.patchValue({
      nombre: product.nombre,
      categoria: product.categoria,
      unidad: product.unidad,
      proveedor: previous?.proveedor ?? '',
      cantidad: previousLine ? String(previousLine.cantidad) : '',
      precioUnitario: previousLine ? String(previousLine.precioUnitario) : '',
      observaciones: previous?.observaciones ?? '',
    });
    this.productPhoto = product.fotoUrl ?? '';
    this.cdr.markForCheck();
  }

  onQuantityInput(event: CustomEvent<{ value?: string | null }>): void {
    if (!this.alimentacion) return;
    const raw = event.detail.value ?? '';
    const integerPart = raw.replace(/[.,].*$/, '').replace(/\D/g, '');
    if (raw !== integerPart) {
      this.invalidIntegerQuantity = true;
      this.form.controls.cantidad.setValue(integerPart, { emitEvent: false });
      this.errorMessage = 'La cantidad de alimento solo permite bultos enteros.';
      this.cdr.markForCheck();
    } else {
      this.invalidIntegerQuantity = false;
      if (this.errorMessage === 'La cantidad de alimento solo permite bultos enteros.')
        this.errorMessage = '';
    }
  }

  private localDate(): string {
    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 10);
  }

  async onPhoto(file: File | undefined, type: 'invoice' | 'product'): Promise<void> {
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
      this.cdr.markForCheck();
      return;
    }
    if (type === 'invoice') this.invoicePhoto = dataUrl;
    else this.productPhoto = dataUrl;
    this.cdr.markForCheck();
  }

  submit(): void {
    if (this.invalidIntegerQuantity) return;
    if (!this.farmId || this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.invoicePhoto || (this.requiresProductPhoto && !this.productPhoto)) {
      this.photoError = this.requiresProductPhoto
        ? 'Adjunta la foto de la factura y del producto.'
        : 'Adjunta la foto de la factura.';
      return;
    }
    const value = this.form.getRawValue();
    if (this.alimentacion && !Number.isInteger(Number(value.cantidad))) {
      this.errorMessage = 'La cantidad de alimento debe ser un número entero de bultos.';
      return;
    }
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
