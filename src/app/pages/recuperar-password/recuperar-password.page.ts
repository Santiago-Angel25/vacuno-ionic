import type { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonButton, IonCol, IonContent, IonGrid, IonInput, IonItem, IonRow } from '@ionic/angular';
import { finalize } from 'rxjs';

import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-recuperar-password',
  templateUrl: './recuperar-password.page.html',
  styleUrl: './recuperar-password.page.scss',
  imports: [ReactiveFormsModule, RouterLink, IonButton, IonCol, IonContent, IonGrid, IonInput, IonItem, IonRow],
})
export class RecuperarPasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });
  loading = false;
  sent = false;
  errorMessage = '';

  submit(): void {
    if (this.loading || this.sent) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.auth
      .requestPasswordReset(this.form.getRawValue().email.trim())
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.sent = true;
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage =
            error.status === 0
              ? 'No se pudo conectar con el servidor. Intenta de nuevo.'
              : 'No fue posible enviar el correo de recuperación. Intenta de nuevo más tarde.';
        },
      });
  }
}
