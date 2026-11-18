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
  templateUrl: './vacuno-header.component.html',
  styleUrl: './vacuno-header.component.scss',
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
