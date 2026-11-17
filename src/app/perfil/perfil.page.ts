import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonAlert,
  IonAvatar,
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { callOutline, cardOutline, logOutOutline, mailOutline, pencilOutline, personOutline } from 'ionicons/icons';
import { finalize } from 'rxjs';

import { AuthService } from '../service/auth.service';
import { DetailModalComponent } from '../shared/detail-modal.component';
import { ProfilePhotoComponent } from '../shared/profile-photo.component';
import { VacunoHeaderComponent } from '../shared/vacuno-header.component';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrl: './perfil.page.scss',
  imports: [
    DetailModalComponent,
    ProfilePhotoComponent,
    ReactiveFormsModule,
    VacunoHeaderComponent,
    IonAlert,
    IonAvatar,
    IonButton,
    IonContent,
    IonIcon,
    IonInput,
  ],
})
export class PerfilPage {
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);
  loading = false;
  errorMessage = '';
  editing = false;
  saving = false;
  editError = '';
  photo: string | null = null;
  readonly form = this.fb.nonNullable.group({
    nombres: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    apellidos: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    telefono: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(30)]],
  });

  openEditor(): void {
    const user = this.auth.currentUser;
    if (!user || this.loading || this.saving) return;
    this.form.reset({
      nombres: user.nombres, apellidos: user.apellidos, email: user.email, telefono: user.telefono ?? '',
    });
    this.photo = user.fotoUrl ?? null;
    this.editError = '';
    this.editing = true;
  }

  saveProfile(): void {
    if (this.saving || !this.editing) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.editError = 'Completa los nombres, apellidos, el teléfono y un correo válido.';
      return;
    }
    const { nombres, apellidos, email, telefono } = this.form.getRawValue();
    this.saving = true;
    this.editError = '';
    this.auth.updateProfile({
      nombres: nombres.trim(), apellidos: apellidos.trim(), email: email.trim(), telefono: telefono.trim(),
      fotoUrl: this.photo === (this.auth.currentUser?.fotoUrl ?? null) ? undefined : (this.photo ?? ''),
    }).pipe(finalize(() => {
      this.saving = false;
      this.changeDetector.markForCheck();
    })).subscribe({
      next: () => { this.editing = false; },
      error: (error: { status?: number; error?: { detail?: string } }) => {
        this.editError = error.error?.detail ?? (error.status === 409
          ? 'El correo ya está registrado.' : 'No pudimos guardar el perfil.');
      },
    });
  }

  constructor() {
    addIcons({ callOutline, cardOutline, logOutOutline, mailOutline, pencilOutline, personOutline });
  }

  ionViewWillEnter(): void {
    this.loading = true;
    this.errorMessage = '';
    this.auth
      .getProfile()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.changeDetector.markForCheck();
        }),
      )
      .subscribe({
        error: () => {
          this.errorMessage = 'No fue posible actualizar los datos del perfil.';
          this.changeDetector.markForCheck();
        },
      });
  }

  get initials(): string {
    const user = this.auth.currentUser;
    return `${user?.nombres.charAt(0) ?? ''}${user?.apellidos.charAt(0) ?? ''}`.toUpperCase() || 'V';
  }

  readonly logoutButtons = [
    { text: 'Cancelar', role: 'cancel' },
    { text: 'Cerrar sesión', role: 'confirm' },
  ];

  confirmLogout(role?: string): void {
    if (role !== 'confirm') return;
    this.auth.logout();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
