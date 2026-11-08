import type { Routes } from '@angular/router';

import { authGuard } from './service/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'splash',
  },
  {
    path: 'splash',
    loadComponent: () => import('./splash/splash.page').then((m) => m.SplashPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'registro',
    loadComponent: () => import('./registro/registro.page').then((m) => m.RegistroPage),
  },
  {
    path: 'animal/nuevo',
    canActivate: [authGuard],
    loadComponent: () => import('./animal-form/animal-form.page').then((m) => m.AnimalFormPage),
  },
  {
    path: 'producto/nuevo',
    canActivate: [authGuard],
    loadComponent: () => import('./product-form/product-form.page').then((m) => m.ProductFormPage),
  },
  {
    path: 'compras/nueva',
    pathMatch: 'full',
    redirectTo: 'tabs/compras/nueva',
  },
  {
    path: 'compras',
    pathMatch: 'full',
    redirectTo: 'tabs/compras',
  },
  {
    path: 'gastos',
    pathMatch: 'full',
    redirectTo: 'tabs/gastos',
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  { path: '**', redirectTo: 'splash' },
];
