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
    loadComponent: () => import('./pages/splash/splash.page').then((m) => m.SplashPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/registro/registro.page').then((m) => m.RegistroPage),
  },
  {
    path: 'recuperar-password',
    loadComponent: () =>
      import('./pages/recuperar-password/recuperar-password.page').then((m) => m.RecuperarPasswordPage),
  },
  {
    path: 'restablecer-password',
    loadComponent: () =>
      import('./pages/restablecer-password/restablecer-password.page').then((m) => m.RestablecerPasswordPage),
  },
  {
    path: 'activar-trabajador',
    loadComponent: () =>
      import('./pages/activar-trabajador/activar-trabajador.page').then((m) => m.ActivarTrabajadorPage),
  },
  {
    path: 'animal/nuevo',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/animal-form/animal-form.page').then((m) => m.AnimalFormPage),
  },
  {
    path: 'producto/nuevo',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/product-form/product-form.page').then((m) => m.ProductFormPage),
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
    path: 'notificaciones',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/notificaciones/notificaciones.page').then((m) => m.NotificacionesPage),
  },
  {
    path: 'tabs',
    loadChildren: () => import('./pages/tabs/tabs.routes').then((m) => m.routes),
  },
  { path: '**', redirectTo: 'splash' },
];
