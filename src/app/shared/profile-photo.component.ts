import { Component, inject, input, model, signal } from '@angular/core';
import { ActionSheetController, IonButton } from '@ionic/angular';

import { CameraPickerComponent } from './camera-picker.component';

@Component({
  selector: 'app-profile-photo',
  imports: [CameraPickerComponent, IonButton],
  template: `
    <p>Foto de perfil (opcional)</p>
    <app-camera-picker #camera subject="perfil" [showActions]="false" (selected)="read($event)" />
    <input #file hidden type="file" accept="image/jpeg,image/png,image/webp"
      (change)="read(file.files?.[0]); file.value = ''" />
    <button class="photo-picker" type="button" [disabled]="disabled() || reading() || camera.busy()"
      (click)="camera.native ? chooseSource(camera) : file.click()">
      @if (photo()) {
        <img [src]="photo()" alt="Vista previa de la foto de perfil" />
      } @else {
        <span class="camera-icon" aria-hidden="true">📷</span>
      }
      <strong>{{ photo() ? 'Cambiar fotografía' : 'Agregar fotografía' }}</strong>
    </button>
    @if (photo()) {
      <ion-button type="button" fill="clear" size="small" [disabled]="disabled() || reading()" (click)="remove()">
        Quitar foto
      </ion-button>
    }
    @if (error()) { <p role="alert">{{ error() }}</p> }
  `,
  styles: [`
    :host { display: block; margin-block: 12px; }
    img { display: block; width: 72px; height: 72px; object-fit: cover; border-radius: 50%; }
    .photo-picker {
      display: flex;
      width: 100%;
      min-height: 110px;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      border: 1px dashed #b5c8af;
      border-radius: 15px;
      background: #eef5ea;
      color: #347647;
      font-size: 12px;
      cursor: pointer;
    }
    .camera-icon { font-size: 24px; }
    .photo-picker:disabled { opacity: .6; cursor: default; }
    p { margin-block: 8px; }
    [role="alert"] { color: #a52c24; }
  `],
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
