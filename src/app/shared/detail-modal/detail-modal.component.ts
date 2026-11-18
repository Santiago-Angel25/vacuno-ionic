import { Component, ViewEncapsulation, input, output } from '@angular/core';
import { IonModal } from '@ionic/angular';

@Component({
  selector: 'app-detail-modal',
  imports: [IonModal],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './detail-modal.component.html',
  styleUrl: './detail-modal.component.scss',
})
export class DetailModalComponent {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly category = input.required<string>();
  readonly tone = input<'green' | 'yellow' | 'red' | 'gray'>('green');
  readonly closed = output<void>();
}
