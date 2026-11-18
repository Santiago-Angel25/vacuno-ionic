import { Component, inject, input, model, signal } from '@angular/core';
import { ActionSheetController, IonButton } from '@ionic/angular';

import { CameraPickerComponent } from '../camera-picker/camera-picker.component';

@Component({
  selector: 'app-profile-photo',
  imports: [CameraPickerComponent, IonButton],
  templateUrl: './profile-photo.component.html',
  styleUrl: './profile-photo.component.scss',
})
export class ProfilePhotoComponent {
  private readonly actionSheets = inject(ActionSheetController);
  readonly photo = model<string | null>(null);
  readonly disabled = input(false);
  readonly reading = signal(false);
  readonly error = signal('');

  async chooseSource(camera: CameraPickerComponent): Promise<void> {
    const sheet = await this.actionSheets.create({
      header: 'Foto de perfil',
      buttons: [
        { text: 'Tomar foto', role: 'camera' },
        { text: 'Elegir de la galería', role: 'gallery' },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
    const { role } = await sheet.onDidDismiss();
    if (this.disabled()) return;
    if (role === 'camera') await camera.takePhoto();
    if (role === 'gallery') await camera.choosePhoto();
  }

  remove(): void {
    this.photo.set(null);
    this.error.set('');
  }

  read(file?: File): void {
    if (!file || this.disabled() || this.reading()) return;
    this.error.set('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      this.error.set('Elige una foto JPG, PNG o WebP de máximo 2 MB.');
      return;
    }
    this.reading.set(true);
    const reader = new FileReader();
    reader.onload = () => this.photo.set(String(reader.result));
    reader.onerror = () => this.error.set('No pudimos leer la foto.');
    reader.onloadend = () => this.reading.set(false);
    reader.readAsDataURL(file);
  }
}
