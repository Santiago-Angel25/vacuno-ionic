import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { personAddOutline } from 'ionicons/icons';
import { finalize, of, switchMap } from 'rxjs';

import { AuthService } from '../service/auth.service';
import { FarmService } from '../service/farm.service';
import { CameraPickerComponent } from '../shared/camera-picker.component';
import type { WorkerInvite, WorkerSummary } from '../service/farm.service';

@Component({
  selector: 'app-trabajadores',
  templateUrl: './trabajadores.page.html',
  styleUrl: './trabajadores.page.scss',
  imports: [
    CameraPickerComponent,
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
})
export class TrabajadoresPage {
  private readonly fb = inject(FormBuilder);
  private readonly farms = inject(FarmService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly auth = inject(AuthService);
  readonly form = this.fb.nonNullable.group({
    nombres: ['', Validators.required],
    apellidos: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telefono: [''],
    fechaNacimiento: [''],
  });
  farmId: number | null = null;
  workers: WorkerSummary[] = [];
  invite: WorkerInvite | null = null;
  loading = true;
  saving = false;
  errorMessage = '';
  photoUrl = '';
  photoError = '';

  constructor() {
    addIcons({ personAddOutline });
  }

  ionViewWillEnter(): void {
    if (this.auth.currentUser?.rol !== 'PROPIETARIO') {
      this.loading = false;
      return;
    }
    this.loadWorkers();
  }

  loadWorkers(): void {
    this.farms
      .myFarms()
      .pipe(
        switchMap((farms) => {
          this.farmId = farms[0]?.id ?? null;
          return this.farmId ? this.farms.workers(this.farmId) : of([] as WorkerSummary[]);
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (items) => {
          this.workers = items;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'No fue posible cargar los trabajadores.';
          this.cdr.markForCheck();
        },
      });
  }

  async onPhoto(file?: File): Promise<void> {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.photoError = 'La foto debe ser JPG, PNG o WebP.';
      this.cdr.markForCheck();
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.photoError = 'La foto debe pesar máximo 2 MB.';
      this.cdr.markForCheck();
      return;
    }
    this.photoError = '';
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
    this.photoUrl = dataUrl;
    this.cdr.markForCheck();
  }

  submit(): void {
    if (!this.farmId || this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving = true;
    this.errorMessage = '';
    this.invite = null;
    this.farms
      .inviteWorker({
        fincaId: this.farmId,
        nombres: value.nombres.trim(),
        apellidos: value.apellidos.trim(),
        email: value.email.trim(),
        telefono: value.telefono.trim(),
        fechaNacimiento: value.fechaNacimiento || undefined,
        fotoUrl: this.photoUrl || undefined,
      })
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (invite) => {
          this.invite = invite;
          this.form.reset({ nombres: '', apellidos: '', email: '', telefono: '', fechaNacimiento: '' });
          this.photoUrl = '';
          this.loadWorkers();
          this.cdr.markForCheck();
        },
        error: (error: { error?: { detail?: string } }) => {
          this.errorMessage = error.error?.detail ?? 'No fue posible crear el trabajador.';
          this.cdr.markForCheck();
        },
      });
  }

  async copyCode(): Promise<void> {
    if (!this.invite) return;
    await navigator.clipboard?.writeText(this.invite.codigo);
  }
}
