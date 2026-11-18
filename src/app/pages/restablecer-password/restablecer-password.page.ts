import type { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonButton, IonCol, IonContent, IonGrid, IonInput, IonItem, IonRow, ToastController } from '@ionic/angular';
import { finalize } from 'rxjs';

import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-restablecer-password',
  templateUrl: './restablecer-password.page.html',
  styleUrl: './restablecer-password.page.scss',
  imports: [ReactiveFormsModule, RouterLink, IonButton, IonCol, IonContent, IonGrid, IonInput, IonItem, IonRow],
})
export class RestablecerPasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toasts = inject(ToastController);
  readonly form = this.fb.nonNullable.group({
    token: ['', [Validators.required, Validators.pattern(/\S/)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    confirmar: ['', Validators.required],
  });
  loading = false;
  done = false;
  errorMessage = '';

  submit(): void {
    if (this.loading || this.done) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { token, password, confirmar } = this.form.getRawValue();
    if (password !== confirmar) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.auth
      .resetPassword(token.trim(), password)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.done = true;
          this.form.reset();
          void this.showSuccess();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage =
            error.status === 0 || error.status >= 500
              ? 'No se pudo conectar con el servidor. Intenta de nuevo.'
              : (error.error?.detail ?? 'No fue posible cambiar la contraseña. Revisa el código o solicita uno nuevo.');
        },
      });
  }

  private async showSuccess(): Promise<void> {
    const toast = await this.toasts.create({
      message: 'Contraseña actualizada',
      duration: 1800,
      position: 'bottom',
      color: 'success',
    });
    await toast.present();
  }
}
