import type { WorkerInvite, WorkerSummary } from '../../service/trabajadores/trabajadores.models';
import { FincaService } from '../../service/finca/finca.service';
import { TrabajadoresService } from '../../service/trabajadores/trabajadores.service';
import { localDate } from '../../shared/utils/task-due-date';
import { phoneDigits, phonePattern, birthDateValidator } from '../../shared/utils/account-validation';
import { VacunoHeaderComponent } from '../../shared/vacuno-header/vacuno-header.component';
import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonGrid, IonRow, IonCol, IonButton, IonContent, IonIcon, IonInput, IonItem, IonSpinner } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { personAddOutline } from 'ionicons/icons';
import { finalize, of, switchMap } from 'rxjs';

import { AuthService } from '../../service/auth/auth.service';
import { CameraPickerComponent } from '../../shared/camera-picker/camera-picker.component';
@Component({
  selector: 'app-trabajadores',
  templateUrl: './trabajadores.page.html',
  styleUrl: './trabajadores.page.scss',
  imports: [
    IonGrid,
    IonRow,
    IonCol,
    VacunoHeaderComponent,
    CameraPickerComponent,
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    IonButton,
    IonContent,
    IonIcon,
    IonInput,
    IonItem,
    IonSpinner,
  ],
})
export class TrabajadoresPage {
  private readonly fb = inject(FormBuilder);
  private readonly fincaService = inject(FincaService);
  private readonly trabajadoresService = inject(TrabajadoresService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly auth = inject(AuthService);
  readonly form = this.fb.nonNullable.group({
    nombres: ['', Validators.required],
    apellidos: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.pattern(phonePattern)]],
    fechaNacimiento: ['', birthDateValidator],
  });
  get maxBirthDate(): string {
    return localDate();
  }
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
    this.fincaService
      .myFarms()
      .pipe(
        switchMap((farms) => {
          this.farmId = farms[0]?.id ?? null;
          return this.farmId ? this.trabajadoresService.workers(this.farmId) : of([] as WorkerSummary[]);
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

  onPhoneInput(event: CustomEvent<{ value?: string | null }>): void {
    const value = phoneDigits(event.detail.value);
    this.form.controls.telefono.setValue(value);
    if (event.target) (event.target as HTMLInputElement).value = value;
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
    this.trabajadoresService
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
        error: (error: { status?: number; error?: { detail?: string } }) => {
          if (error.status === 409) {
            this.form.controls.email.setErrors({ ...this.form.controls.email.errors, exists: true });
            this.form.controls.email.markAsTouched();
          }
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
