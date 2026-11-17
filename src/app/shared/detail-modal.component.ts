import { Component, ViewEncapsulation, input, output } from '@angular/core';
import { IonModal } from '@ionic/angular';

@Component({
  selector: 'app-detail-modal',
  imports: [IonModal],
  encapsulation: ViewEncapsulation.None,
  template: `
    <ion-modal #modal class="vacuno-detail-modal" [isOpen]="open()" [attr.aria-label]="title()"
      (didDismiss)="closed.emit()">
      <ng-template>
        <section class="vacuno-detail-body" [attr.data-tone]="tone()">
          <button class="vacuno-detail-close" type="button" aria-label="Cerrar detalle" (click)="modal.dismiss()">×</button>
          <header class="vacuno-detail-heading">
            <span>{{ category() }}</span>
            <h2>{{ title() }}</h2>
          </header>
          <ng-content></ng-content>
        </section>
      </ng-template>
    </ion-modal>
  `,
  styles: [`
    .vacuno-detail-modal {
      --width: min(calc(100% - 32px), 420px);
      --height: auto;
      --border-radius: 24px;
      --background: #fff;
      --box-shadow: 0 18px 48px rgb(0 0 0 / 24%);
      --backdrop-opacity: .38;
      backdrop-filter: blur(5px);
    }
    .vacuno-detail-body {
      --detail-accent: #176c36;
      --detail-tint: #e3f4e1;
      position: relative;
      max-height: calc(100dvh - 48px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
      overflow: auto;
      overscroll-behavior: contain;
      padding: 24px 20px 20px;
      color: #20372a;
      overflow-wrap: anywhere;
    }
    .vacuno-detail-body[data-tone="yellow"] { --detail-accent: #865900; --detail-tint: #fff5df; }
    .vacuno-detail-body[data-tone="red"] { --detail-accent: #a52c24; --detail-tint: #ffe7e4; }
    .vacuno-detail-body[data-tone="gray"] { --detail-accent: #555e58; --detail-tint: #eef0ee; }
    .vacuno-detail-close {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #eef1ee;
      color: #425149;
      font-size: 26px;
      cursor: pointer;
    }
    .vacuno-detail-heading { padding-inline: 34px; text-align: center; }
    .vacuno-detail-heading > span {
      display: inline-block;
      padding: 5px 10px;
      border-radius: 999px;
      background: var(--detail-tint);
      color: var(--detail-accent);
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .vacuno-detail-heading h2 { margin: 8px 0 14px; font-size: 22px; font-weight: 800; }
    .vacuno-detail-body dl { margin: 0; }
    .vacuno-detail-body dl > div { padding: 10px 0; border-top: 1px solid #e5ebe5; }
    .vacuno-detail-body dt { color: #526456; font-size: 13px; font-weight: 700; }
    .vacuno-detail-body dd { margin: 4px 0 0; }
    .vacuno-detail-photo { display: block; max-height: 240px; margin: 12px auto 0; border-radius: 12px; object-fit: contain; }
    .vacuno-detail-target { position: relative; }
    .vacuno-detail-hit {
      position: absolute;
      inset: 0;
      z-index: 1;
      border: 0;
      border-radius: inherit;
      background: transparent;
      cursor: pointer;
    }
    .vacuno-detail-hit:focus-visible { outline: 2px solid #26743b; outline-offset: 2px; }
  `],
})
export class DetailModalComponent {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly category = input.required<string>();
  readonly tone = input<'green' | 'yellow' | 'red' | 'gray'>('green');
  readonly closed = output<void>();
}
