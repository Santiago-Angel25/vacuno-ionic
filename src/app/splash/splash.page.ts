import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrl: './splash.page.scss',
  imports: [IonContent],
})
export class SplashPage implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private timer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.timer = setTimeout(() => {
      const destination = this.auth.isAuthenticated() ? '/tabs/inicio' : '/login';
      void this.router.navigateByUrl(destination, { replaceUrl: true });
    }, 2200);
  }

  ngOnDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }
}
