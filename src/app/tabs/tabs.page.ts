import { Component, inject } from '@angular/core';
import { IonAvatar, IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { calendarOutline, cubeOutline, homeOutline, pawOutline, personOutline } from 'ionicons/icons';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonAvatar],
})
export class TabsPage {
  readonly auth = inject(AuthService);

  constructor() {
    addIcons({ homeOutline, pawOutline, cubeOutline, calendarOutline, personOutline });
  }

  get avatarInitial(): string {
    return this.auth.currentUser?.nombres.charAt(0).toUpperCase() ?? 'V';
  }
}
