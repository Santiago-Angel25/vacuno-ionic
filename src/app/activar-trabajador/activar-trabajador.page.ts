import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { finalize } from 'rxjs';

import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-activar-trabajador',
  templateUrl: './activar-trabajador.page.html',
  styleUrl: './activar-trabajador.page.scss',
  imports: [ReactiveFormsModule, RouterLink, IonButton, IonContent, IonHeader, IonInput, IonItem, IonTitle, IonToolbar],
})
export class ActivarTrabajadorPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toastController = inject(ToastController);
  readonly form = this.fb.nonNullable.group({
    codigo: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    confirmar: ['', Validators.required],
  });
  saving = false;
  errorMessage = '';

  submit(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    if (value.password !== value.confirmar) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }
    this.saving = true;
    this.errorMessage = '';
    this.auth
      .activateWorker(value.codigo.trim(), value.password)
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => void this.finishActivation(),
        error: (error: { error?: { detail?: string } }) => {
          this.errorMessage = error.error?.detail ?? 'El código no es válido o ya venció.';
          this.cdr.markForCheck();
        },
      });
  }

  private async finishActivation(): Promise<void> {
    const toast = await this.toastController.create({
      message: 'Cuenta activada con éxito',
      duration: 1800,
      position: 'top',
      color: 'success',
    });
    await toast.present();
    await this.router.navigateByUrl('/tabs/inicio', { replaceUrl: true });
  }
}
