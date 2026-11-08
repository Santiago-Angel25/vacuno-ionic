import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonCheckbox, IonContent, IonInput, IonItem, IonSpinner, ToastController } from '@ionic/angular';
import { finalize } from 'rxjs';

import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrl: './registro.page.scss',
  imports: [ReactiveFormsModule, RouterLink, IonButton, IonCheckbox, IonContent, IonInput, IonItem, IonSpinner],
})
export class RegistroPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly toastController = inject(ToastController);
  readonly form = this.fb.nonNullable.group({
    nombres: ['', [Validators.required, Validators.maxLength(100)]],
    apellidos: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    telefono: [''],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    finca: ['', [Validators.required, Validators.maxLength(150)]],
    direccion: [''],
    aceptaTerminos: [false, Validators.requiredTrue],
  });
  loading = false;
  errorMessage = '';

  submit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }
    const { nombres, apellidos, email, telefono, password, finca, direccion } = this.form.getRawValue();
    this.loading = true;
    this.errorMessage = '';
    this.auth
      .register({
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        email: email.trim(),
        telefono: telefono.trim() || undefined,
        password,
        finca: { nombre: finca.trim(), direccion: direccion.trim() || undefined },
        aceptaTerminos: true,
      })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.changeDetector.markForCheck();
        }),
      )
      .subscribe({
        next: () => void this.finishRegistration(),
        error: (error: { error?: { detail?: string; message?: string } }) => {
          this.errorMessage = error.error?.detail || 'No se pudo crear la cuenta.';
          this.changeDetector.markForCheck();
        },
      });
  }

  private async finishRegistration(): Promise<void> {
    const toast = await this.toastController.create({
      message: 'Cuenta creada exitosamente',
      duration: 1800,
      position: 'top',
      color: 'success',
    });
    await toast.present();
    await this.router.navigateByUrl('/tabs/inicio', { replaceUrl: true });
  }
}
