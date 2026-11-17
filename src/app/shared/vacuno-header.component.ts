import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonAvatar, IonBackButton, IonButton, IonButtons, IonHeader, IonIcon, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, notificationsOutline } from 'ionicons/icons';

/** Shared visual header for VACUNO's main modules. */
@Component({
  selector: 'app-vacuno-header',
  standalone: true,
  imports: [RouterLink, IonAvatar, IonBackButton, IonButton, IonButtons, IonHeader, IonIcon, IonToolbar],
  template: `
    <ion-header class="vacuno-hero-header">
      <svg class="header-mountain" viewBox="0 0 390 76" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d="M0 48 C34 35 55 16 91 24 C121 31 138 51 164 48 C197 44 210 16 244 19 C277 21 292 50 323 45 C348 40 365 24 390 17 V76 H0Z" />
        <path class="mountain-front" d="M0 59 C45 50 71 39 111 46 C156 54 175 69 219 59 C259 50 279 37 317 42 C349 47 369 58 390 54 V76 H0Z" />
      </svg>
      <ion-toolbar>
        <div class="header-row">
          @if (showBack() && backHref()) {
            <ion-buttons><ion-back-button [defaultHref]="backHref()" text=""></ion-back-button></ion-buttons>
          } @else if (showBack()) {
            <ion-buttons><ion-button routerLink="/tabs/inicio" aria-label="Volver"><ion-icon name="arrow-back-outline"></ion-icon></ion-button></ion-buttons>
          }
          @if (brand()) {
            <div class="brand"><img src="/assets/vacuno-cow-mark.png" alt="" /><span>VACUNO</span></div>
          } @else {
            <div class="header-title">{{ title() }}</div>
          }
          <ng-content></ng-content>
          @if (actions()) {
            <ion-buttons class="header-actions">
              <ion-button class="notification-button" aria-label="Notificaciones" routerLink="/notificaciones"><ion-icon slot="icon-only" name="notifications-outline"></ion-icon><span class="notification-dot" aria-hidden="true"></span></ion-button>
              <ion-avatar routerLink="/tabs/perfil" aria-label="Abrir perfil">
                @if (photoUrl(); as photo) {
                  <img [src]="photo" alt="" />
                } @else {
                  {{ initial() }}
                }
              </ion-avatar>
            </ion-buttons>
          }
        </div>
      </ion-toolbar>
    </ion-header>
  `,
  styles: [`
    .vacuno-hero-header { overflow: hidden; box-shadow: none; position: relative; z-index: 3; min-height: calc(76px + env(safe-area-inset-top)); background: var(--vacuno-green-900); }
    .header-mountain { position: absolute; z-index: 0; right: 0; bottom: 0; left: 0; width: 100%; height: 58px; pointer-events: none; }
    .header-mountain path { fill: #07512c; opacity: .82; }.header-mountain .mountain-front { fill: #043d22; opacity: .76; }
    ion-toolbar { position: relative; z-index: 1; --background: transparent; --color: #fff; --border-width: 0; --min-height: calc(76px + env(safe-area-inset-top)); padding: 0; }
    ion-toolbar::before { content: none; }
    .header-row { display: flex; position: relative; z-index: 1; align-items: center; min-height: calc(76px + env(safe-area-inset-top)); padding: env(safe-area-inset-top) 10px 0; box-sizing: border-box; }
    .header-title { flex: 1; color: #fff; font-size: 22px; font-weight: 800; letter-spacing: -.3px; }
    ion-button { --color: #fff; --padding-start: 7px; --padding-end: 7px; }
    ion-icon { font-size: 22px; }
    .brand { display: flex; align-items: center; gap: 8px; margin-left: 3px; color: #fff; font-size: 18px; font-weight: 800; letter-spacing: .7px; }
    .brand img { width: 35px; height: 35px; object-fit: contain; filter: brightness(0) invert(1); }
    .header-actions { display: flex; align-items: center; gap: 5px; margin-left: auto; }
    .notification-button { position: relative; --overflow: visible; }
    .notification-dot { position: absolute; z-index: 2; top: 3px; right: 4px; width: 8px; height: 8px; border: 1.5px solid var(--vacuno-green-900); border-radius: 50%; background: #ef4e3c; box-sizing: border-box; }
    ion-avatar { display: grid; width: 30px; height: 30px; place-items: center; margin-right: 3px; border: 2px solid rgb(255 255 255 / 45%); background: #e3f7df; color: var(--vacuno-green-900); font-size: 12px; font-weight: 900; }
  `],
})
export class VacunoHeaderComponent {
  readonly title = input('');
  readonly brand = input(false);
  readonly backHref = input('');
  readonly showBack = input(false);
  readonly actions = input(false);
  readonly initial = input('A');
  readonly photoUrl = input<string | null | undefined>();

  constructor() { addIcons({ arrowBackOutline, notificationsOutline }); }
}
