import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonAvatar, IonButton, IonContent, IonHeader, IonIcon, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { logOutOutline, personOutline } from 'ionicons/icons';
import { finalize, of, switchMap } from 'rxjs';

import { AuthService } from '../service/auth.service';
import { FarmService } from '../service/farm.service';
import type { FarmActivity } from '../service/farm.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrl: './perfil.page.scss',
  imports: [IonAvatar, IonButton, IonContent, IonHeader, IonIcon, IonToolbar],
})
export class PerfilPage {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly farms = inject(FarmService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  loading = false;
  errorMessage = '';
  activities: FarmActivity[] = [];

  constructor() {
    addIcons({ logOutOutline, personOutline });
  }

  ionViewWillEnter(): void {
    this.loading = true;
    this.errorMessage = '';
    this.auth
      .getProfile()
      .pipe(
        switchMap((profile) => {
          if (profile.rol !== 'TRABAJADOR') return of([] as FarmActivity[]);
          return this.farms
            .myFarms()
            .pipe(switchMap((farms) => (farms[0] ? this.farms.activities(farms[0].id) : of([] as FarmActivity[]))));
        }),
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

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  activityDate(value: string): string {
    return new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
  }
}
