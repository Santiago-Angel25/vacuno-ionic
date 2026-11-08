import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonAvatar, IonButton, IonContent, IonHeader, IonIcon, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { logOutOutline, personOutline } from 'ionicons/icons';
import { finalize } from 'rxjs';

import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrl: './perfil.page.scss',
  imports: [IonAvatar, IonButton, IonContent, IonHeader, IonIcon, IonToolbar],
})
export class PerfilPage {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);
  loading = false;
  errorMessage = '';

  constructor() {
    addIcons({ logOutOutline, personOutline });
  }

  ionViewWillEnter(): void {
    this.loading = true;
    this.errorMessage = '';
    this.auth.getProfile().pipe(finalize(() => {
      this.loading = false;
      this.changeDetector.markForCheck();
    })).subscribe({
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

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
