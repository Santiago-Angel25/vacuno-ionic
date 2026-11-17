import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonAlert,
  IonAvatar,
  IonButton,
  IonContent,
  IonIcon,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { callOutline, cardOutline, logOutOutline, mailOutline, personOutline } from 'ionicons/icons';
import { finalize } from 'rxjs';

import { AuthService } from '../service/auth.service';
import { VacunoHeaderComponent } from '../shared/vacuno-header.component';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrl: './perfil.page.scss',
  imports: [
    VacunoHeaderComponent,
    IonAlert,
    IonAvatar,
    IonButton,
    IonContent,
    IonIcon,
  ],
})
export class PerfilPage {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);
  loading = false;
  errorMessage = '';

  constructor() {
    addIcons({ callOutline, cardOutline, logOutOutline, mailOutline, personOutline });
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
