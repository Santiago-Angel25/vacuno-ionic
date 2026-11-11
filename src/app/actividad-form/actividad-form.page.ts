import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
import { finalize, forkJoin, map, of, switchMap } from 'rxjs';

import { AuthService } from '../service/auth.service';
import { FarmService } from '../service/farm.service';
import { CameraPickerComponent } from '../shared/camera-picker.component';
import type { Animal, FarmTask, InventoryProduct, WorkerSummary } from '../service/farm.service';

@Component({
  selector: 'app-actividad-form',
  templateUrl: './actividad-form.page.html',
  styleUrl: './actividad-form.page.scss',
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
export class ActividadFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly farms = inject(FarmService);
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly form = this.fb.nonNullable.group({
    tipo: ['VACUNACION', Validators.required],
    animalId: [''],
    productoId: [''],
    cantidadPorDosis: ['', [Validators.min(0.001)]],
    numeroDosis: ['1', [Validators.min(1)]],
    descripcion: ['', [Validators.required, Validators.maxLength(1000)]],
    asignadaA: [''],
    fechaLimite: [''],
  });
  farmId: number | null = null;
  animals: Animal[] = [];
  products: InventoryProduct[] = [];
  workers: WorkerSummary[] = [];
  taskId: number | null = null;
  task: FarmTask | null = null;
  photoUrl: string | null = null;
  photoError = '';
  invalidIntegerInput = false;
  saving = false;
  errorMessage = '';

  get ownerMode(): boolean {
    return this.auth.currentUser?.rol === 'PROPIETARIO';
  }

  get taskMode(): boolean {
    return this.taskId !== null;
  }

  get activityTitle(): string {
    return ({
      VACUNACION: 'Vacunación',
      ALIMENTACION: 'Alimentación',
      MEDICAMENTO: 'Medicamento',
      PESAJE: 'Pesaje',
      REVISION: 'Revisión',
      REPRODUCCION: 'Reproducción',
      INSUMO: 'Insumo',
      OTRO: 'Otra actividad',
    } as Record<string, string>)[this.form.controls.tipo.value] ?? 'Actividad';
  }

  constructor() {
    const taskId = Number(this.route.snapshot.queryParamMap.get('taskId'));
    this.taskId = Number.isInteger(taskId) && taskId > 0 ? taskId : null;
    this.form.controls.tipo.valueChanges.subscribe(() => {
      this.form.controls.productoId.setValue('');
      this.form.controls.cantidadPorDosis.setValue('');
      this.form.controls.numeroDosis.setValue('1');
      this.form.controls.animalId.updateValueAndValidity({ emitEvent: false });
      this.cdr.markForCheck();
    });
    this.form.controls.animalId.valueChanges.subscribe(() => this.cdr.markForCheck());
    this.form.controls.productoId.valueChanges.subscribe(() => {
      this.errorMessage = '';
      this.cdr.markForCheck();
    });
    this.form.controls.cantidadPorDosis.valueChanges.subscribe(() => {
      this.errorMessage = '';
      this.cdr.markForCheck();
    });
    this.form.controls.numeroDosis.valueChanges.subscribe(() => {
      this.errorMessage = '';
      this.cdr.markForCheck();
    });
    this.farms
      .myFarms()
      .pipe(
        switchMap((farms) => {
          this.farmId = farms[0]?.id ?? null;
          if (!this.farmId) return of({ animals: [], products: [], workers: [], task: null } as {
            animals: Animal[]; products: InventoryProduct[]; workers: WorkerSummary[]; task: FarmTask | null;
          });
          if (this.taskMode && !this.ownerMode) {
            return this.farms.myTasks(this.farmId).pipe(map((tasks) => ({
              animals: [] as Animal[], products: [] as InventoryProduct[], workers: [] as WorkerSummary[],
              task: tasks.find((item) => item.id === this.taskId) ?? null,
            })));
          }
          return this.ownerMode
            ? this.farms.workers(this.farmId).pipe(switchMap((workers) =>
                of({ animals: [] as Animal[], products: [] as InventoryProduct[], workers, task: null })))
            : forkJoin({ animals: this.farms.animals(this.farmId), products: this.farms.inventory(this.farmId) })
                .pipe(switchMap((data) => of({ ...data, workers: [] as WorkerSummary[], task: null })));
        }),
      )
      .subscribe({
        next: (items) => {
          this.animals = items.animals;
          this.products = items.products;
          this.workers = items.workers;
          this.task = items.task;
          if (this.task) {
            this.form.patchValue({ tipo: this.activityType(this.task.titulo), descripcion: this.task.descripcion ?? '' });
          } else if (this.taskMode) {
            this.errorMessage = 'Esta tarea ya no está pendiente o no está asignada a tu usuario.';
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'No fue posible cargar los animales.';
          this.cdr.markForCheck();
        },
      });
  }

  get consumesInventory(): boolean {
    return ['VACUNACION', 'ALIMENTACION', 'MEDICAMENTO', 'INSUMO'].includes(this.form.controls.tipo.value);
  }

  get requiresAnimal(): boolean {
    return this.form.controls.tipo.value === 'VACUNACION';
  }

  get filteredProducts(): InventoryProduct[] {
    const category = this.productCategory;
    return this.products.filter((product) => product.categoria.toUpperCase() === category);
  }

  get productCategory(): string {
    return this.form.controls.tipo.value === 'ALIMENTACION'
      ? 'ALIMENTOS'
      : this.form.controls.tipo.value === 'INSUMO'
        ? 'INSUMOS'
        : 'MEDICAMENTOS';
  }

  get selectedProduct(): InventoryProduct | undefined {
    return this.filteredProducts.find((product) => String(product.id) === this.form.controls.productoId.value);
  }

  get wholeUnitsAvailable(): number {
    return Math.floor(this.selectedProduct?.stockActual ?? 0);
  }

  displayStock(product: InventoryProduct): number {
    return product.categoria.toUpperCase() === 'ALIMENTOS'
      ? Math.floor(product.stockActual)
      : product.stockActual;
  }

  get showDoseCount(): boolean {
    return this.form.controls.tipo.value === 'MEDICAMENTO' && !this.form.controls.animalId.value;
  }

  get quantityLabel(): string {
    const type = this.form.controls.tipo.value;
    const unit = this.selectedProduct?.unidad;
    if (type === 'ALIMENTACION') {
      return 'Número de bultos';
    }
    if (type === 'INSUMO') return `Cantidad de insumo${unit ? ` (${unit})` : ''}`;
    if (type === 'VACUNACION') return `Cantidad aplicada${unit ? ` (${unit})` : ''}`;
    return `Cantidad por dosis${unit ? ` (${unit})` : ''}`;
  }

  onIntegerInput(event: CustomEvent<{ value?: string | null }>): void {
    const raw = event.detail.value ?? '';
    const integerPart = raw.replace(/[.,].*$/, '').replace(/\D/g, '');
    if (raw !== integerPart) {
      this.invalidIntegerInput = true;
      this.form.controls.cantidadPorDosis.setValue(integerPart, { emitEvent: false });
      this.errorMessage = 'Usa solo números enteros en la cantidad.';
      this.cdr.markForCheck();
    } else {
      this.invalidIntegerInput = false;
      if (this.errorMessage === 'Usa solo números enteros en la cantidad.') this.errorMessage = '';
    }
  }

  private animalIsValid(): boolean {
    return !this.requiresAnimal || !!this.form.controls.animalId.value;
  }

  private activityType(title: string): string {
    const normalized = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
    return ({
      VACUNACION: 'VACUNACION',
      ALIMENTACION: 'ALIMENTACION',
      MEDICAMENTO: 'MEDICAMENTO',
      PESAJE: 'PESAJE',
      REVISION: 'REVISION',
      REPRODUCCION: 'REPRODUCCION',
      INSUMO: 'INSUMO',
      'OTRA ACTIVIDAD': 'OTRO',
      OTRO: 'OTRO',
    } as Record<string, string>)[normalized] ?? 'OTRO';
  }

  async onPhoto(file?: File): Promise<void> {
    if (!file) return;
    this.photoError = '';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.photoError = 'Usa una foto JPG, PNG o WebP.';
      this.cdr.markForCheck();
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.photoError = 'La foto debe pesar máximo 2 MB.';
      this.cdr.markForCheck();
      return;
    }
    this.photoUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('No fue posible leer la foto.'));
      reader.readAsDataURL(file);
    }).catch(() => null);
    if (!this.photoUrl) this.photoError = 'No fue posible leer la foto.';
    this.cdr.markForCheck();
  }

  submit(): void {
    if (!this.farmId || this.saving) return;
    if (this.ownerMode) {
      this.submitTask();
      return;
    }
    if (this.taskMode) {
      this.submitTaskActivity();
      return;
    }
    if (!this.photoUrl) {
      this.photoError = 'Adjunta una foto para registrar la actividad.';
      this.form.markAllAsTouched();
      return;
    }
    if (this.form.invalid || !this.animalIsValid()) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.invalidIntegerInput) return;
    const value = this.form.getRawValue();
    if (this.consumesInventory && (!value.productoId || !Number.isInteger(Number(value.cantidadPorDosis))
        || Number(value.cantidadPorDosis) <= 0
        || (this.showDoseCount && (!Number.isInteger(Number(value.numeroDosis)) || Number(value.numeroDosis) < 1)))) {
      this.errorMessage = 'Selecciona el producto e indica la cantidad utilizada con números enteros.';
      return;
    }
    if (this.consumesInventory && this.selectedProduct
        && Number(value.cantidadPorDosis) * (this.showDoseCount ? Number(value.numeroDosis) : 1)
          > this.selectedProduct.stockActual) {
      this.errorMessage = `Stock insuficiente: hay ${this.selectedProduct.stockActual} ${this.selectedProduct.unidad}; puedes registrar máximo ${this.wholeUnitsAvailable} unidades enteras.`;
      return;
    }
    const animalId = Number(value.animalId);
    this.saving = true;
    this.errorMessage = '';
    this.farms
      .createActivity({
        fincaId: this.farmId,
        ...(animalId > 0 ? { animalId } : {}),
        ...(this.consumesInventory
          ? {
              productoId: Number(value.productoId),
              cantidadPorDosis: Number(value.cantidadPorDosis),
              numeroDosis: this.showDoseCount ? Number(value.numeroDosis) : 1,
            }
          : {}),
        tipo: value.tipo,
        descripcion: value.descripcion.trim(),
        fotoUrl: this.photoUrl,
      })
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => void this.router.navigateByUrl('/tabs/actividad'),
        error: (error: { error?: { detail?: string; message?: string; title?: string } }) => {
          this.errorMessage = error.error?.detail ?? error.error?.message ?? error.error?.title
            ?? 'No fue posible registrar la actividad.';
          this.cdr.markForCheck();
        },
      });
  }

  private submitTask(): void {
    if (this.form.invalid || !this.form.controls.asignadaA.value) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Selecciona un trabajador y describe la tarea pendiente.';
      return;
    }
    const value = this.form.getRawValue();
    this.saving = true;
    this.errorMessage = '';
    this.farms.createTask({
      fincaId: this.farmId!,
      titulo: this.activityTitle,
      descripcion: value.descripcion.trim(),
      asignadaA: Number(value.asignadaA),
      ...(value.fechaLimite ? { fechaLimite: value.fechaLimite } : {}),
      prioridad: 'MEDIA',
    }).pipe(finalize(() => {
      this.saving = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => void this.router.navigateByUrl('/tabs/actividad'),
      error: (error: { error?: { detail?: string; message?: string } }) => {
        this.errorMessage = error.error?.detail ?? error.error?.message ?? 'No fue posible crear la tarea.';
        this.cdr.markForCheck();
      },
    });
  }

  private submitTaskActivity(): void {
    if (!this.task || !this.farmId) {
      this.errorMessage = 'No encontramos la tarea pendiente.';
      return;
    }
    if (!this.photoUrl) {
      this.photoError = 'Adjunta una foto para registrar la actividad.';
      return;
    }
    this.saving = true;
    this.errorMessage = '';
    this.farms.registerTaskActivity(this.farmId, this.task.id, this.photoUrl)
      .pipe(finalize(() => {
        this.saving = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => void this.router.navigateByUrl('/tabs/actividad'),
        error: (error: { error?: { detail?: string; message?: string } }) => {
          this.errorMessage = error.error?.detail ?? error.error?.message ?? 'No fue posible registrar la actividad.';
          this.cdr.markForCheck();
        },
      });
  }
}
