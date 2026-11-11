import { Component, input, output, signal } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { IonButton } from '@ionic/angular';

@Component({
  selector: 'app-camera-picker',
  imports: [IonButton],
  template: `
    @if (native) {
      <ion-button type="button" size="small" fill="outline" [disabled]="busy()"
        [attr.aria-label]="'Tomar foto de ' + subject()" (click)="takePhoto()">Tomar foto</ion-button>
      <ion-button type="button" size="small" fill="clear" [disabled]="busy()"
        [attr.aria-label]="'Elegir foto de ' + subject() + ' desde la galería'" (click)="choosePhoto()">Galería</ion-button>
      @if (error()) { <p role="alert">{{ error() }}</p> }
    }
  `,
})
export class CameraPickerComponent {
  readonly subject = input.required<string>();
  readonly selected = output<File>();
  readonly native = Capacitor.isNativePlatform();
  readonly busy = signal(false);
  readonly error = signal('');

  takePhoto(): Promise<void> {
    return this.pick(CameraSource.Camera);
  }

  choosePhoto(): Promise<void> {
    return this.pick(CameraSource.Photos);
  }

  private async pick(source: CameraSource): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      if (source === CameraSource.Camera) {
        let { camera } = await Camera.checkPermissions();
        if (camera !== 'granted') {
          ({ camera } = await Camera.requestPermissions({ permissions: ['camera'] }));
        }
        if (camera !== 'granted') {
          this.error.set('Permite el acceso a la cámara en los ajustes de VACUNO o elige una foto de la galería.');
          return;
        }
      }

      const photo = await Camera.getPhoto({
        source,
        resultType: CameraResultType.Uri,
        quality: 82,
        width: 1600,
        height: 1600,
        saveToGallery: false,
      });
      if (!photo.webPath) throw new Error('No se recibió la foto');
      const response = await fetch(photo.webPath);
      if (!response.ok) throw new Error('No se pudo leer la foto');
      const blob = await response.blob();
      const format = photo.format === 'jpg' ? 'jpeg' : photo.format;
      this.selected.emit(new File([blob], `foto.${photo.format}`, { type: `image/${format}` }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/cancel/i.test(message)) this.error.set('No pudimos abrir la cámara o la galería.');
    } finally {
      this.busy.set(false);
    }
  }
}
