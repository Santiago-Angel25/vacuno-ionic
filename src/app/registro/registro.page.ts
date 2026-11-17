import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { IonButton, IonCheckbox, IonContent, IonIcon, IonInput, IonItem, IonSpinner, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { locationOutline, searchOutline } from 'ionicons/icons';
import { finalize } from 'rxjs';

import { AuthService } from '../service/auth.service';
import { ProfilePhotoComponent } from '../shared/profile-photo.component';
import { FincaMapComponent } from './finca-map.component';
import type { FarmPoint } from './finca-map.component';

interface PlaceResult {
  id: number;
  name: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrl: './registro.page.scss',
  imports: [ProfilePhotoComponent, FincaMapComponent, ReactiveFormsModule, RouterLink, IonButton, IonCheckbox, IonContent, IonIcon, IonInput, IonItem, IonSpinner],
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
    telefono: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(30)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    finca: ['', [Validators.required, Validators.maxLength(150)]],
    direccion: [''],
    aceptaTerminos: [false, Validators.requiredTrue],
  });
  loading = false;
  photo: string | null = null;
  errorMessage = '';
  locating = false;
  locationError = '';
  location: FarmPoint | null = null;
  places: PlaceResult[] = [];
  selectedPlaceId: number | null = null;
  searching = false;

  constructor() {
    addIcons({ locationOutline, searchOutline });
  }

  resetPlaces(): void {
    this.places = [];
    this.selectedPlaceId = null;
  }

  async searchFarm(): Promise<void> {
    if (this.searching || this.locating || this.loading) return;
    const query = this.form.controls.direccion.value.trim();
    this.resetPlaces();
    this.locationError = '';
    if (query.length < 3) {
      this.locationError = 'Escribe el nombre del municipio para buscarlo.';
      return;
    }

    this.searching = true;
    try {
      const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
      url.search = new URLSearchParams({ name: query, countryCode: 'CO', language: 'es', count: '5' }).toString();
      const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!response.ok) throw new Error('Falló la búsqueda de municipios');
      const { results = [] } = await response.json() as { results?: PlaceResult[] };
      this.places = results;
      if (results.length === 1) this.selectPlace(results[0]);
      if (!results.length) this.locationError = 'No encontramos ese municipio. Prueba con otro nombre o usa tu ubicación.';
    } catch {
      this.locationError = 'No pudimos buscar el municipio. Revisa tu conexión e inténtalo de nuevo.';
    } finally {
      this.searching = false;
      this.changeDetector.markForCheck();
    }
  }

  selectPlace(place: PlaceResult): void {
    this.location = { latitud: place.latitude, longitud: place.longitude };
    this.selectedPlaceId = place.id;
  }

  async locateFarm(): Promise<void> {
    if (this.locating || this.searching || this.loading) return;
    this.locating = true;
    this.locationError = '';
    this.resetPlaces();
    try {
      let precise = true;
      if (Capacitor.isNativePlatform()) {
        let permissions = await Geolocation.checkPermissions();
        if (permissions.location !== 'granted' && permissions.coarseLocation !== 'granted') {
          permissions = await Geolocation.requestPermissions({ permissions: ['location'] });
        }
        precise = permissions.location === 'granted';
        if (!precise && permissions.coarseLocation !== 'granted') {
          this.locationError = 'Permite el acceso a la ubicación en los ajustes de VACUNO o escribe la dirección.';
          return;
        }
      }

      const { coords } = await Geolocation.getCurrentPosition({
        enableHighAccuracy: precise,
        timeout: 20_000,
        maximumAge: 0,
      });
      const { latitude: latitud, longitude: longitud, accuracy } = coords;
      this.location = { latitud, longitud, precision: Math.round(accuracy) };
    } catch {
      this.locationError = 'No pudimos obtener tu ubicación. Revisa el permiso y que la ubicación esté activada o escribe la dirección.';
    } finally {
      this.locating = false;
      this.changeDetector.markForCheck();
    }
  }

  clearLocation(): void {
    this.location = null;
    this.selectedPlaceId = null;
    this.locationError = '';
  }

  submit(): void {
    if (this.form.invalid || this.loading || this.locating || this.searching) {
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
        telefono: telefono.trim(),
        fotoUrl: this.photo ?? undefined,
        password,
        finca: {
          nombre: finca.trim(),
          direccion: direccion.trim() || undefined,
          latitud: this.location?.latitud,
          longitud: this.location?.longitud,
        },
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
      position: 'bottom',
      color: 'success',
    });
    await toast.present();
    await this.router.navigateByUrl('/tabs/inicio', { replaceUrl: true });
  }
}
