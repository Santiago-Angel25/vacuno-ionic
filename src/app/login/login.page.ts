import type { HttpErrorResponse } from '@angular/common/http';
import type { OnInit } from '@angular/core';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonSpinner,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { eyeOffOutline, eyeOutline, lockClosedOutline, mailOutline } from 'ionicons/icons';
import { finalize } from 'rxjs';

import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
  imports: [ReactiveFormsModule, RouterLink, IonButton, IonContent, IonIcon, IonInput, IonItem, IonSpinner],
})
export class LoginPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  loading = false;
  passwordVisible = false;
  errorMessage = '';

  constructor() {
    addIcons({ mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline });
  }

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) void this.router.navigateByUrl('/tabs/inicio', { replaceUrl: true });
  }

  submit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.loading = true;
    const { email, password } = this.form.getRawValue();

    this.auth
      .login(email, password)
      .pipe(finalize(() => {
        this.loading = false;
        this.changeDetector.markForCheck();
      }))
      .subscribe({
        next: () => void this.router.navigateByUrl('/tabs/inicio', { replaceUrl: true }),
        error: (error: HttpErrorResponse) => {
          if (error.status === 0 || error.status >= 500) {
            this.errorMessage = 'No se pudo conectar con el servidor. Intenta de nuevo en unos minutos.';
          } else {
            this.errorMessage = error.error?.detail ?? 'Correo o contraseña incorrectos.';
          }
          this.changeDetector.markForCheck();
        },
      });
  }
}
