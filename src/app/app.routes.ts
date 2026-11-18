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
    loadComponent: () => import('./home/splash/splash.page').then((m) => m.SplashPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./home/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'registro',
    loadComponent: () => import('./home/registro/registro.page').then((m) => m.RegistroPage),
  },
  {
    path: 'activar-trabajador',
    loadComponent: () => import('./home/activar-trabajador/activar-trabajador.page').then((m) => m.ActivarTrabajadorPage),
  },
  {
    path: 'animal/nuevo',
    canActivate: [authGuard],
    loadComponent: () => import('./home/animal-form/animal-form.page').then((m) => m.AnimalFormPage),
  },
  {
    path: 'producto/nuevo',
    canActivate: [authGuard],
    loadComponent: () => import('./home/product-form/product-form.page').then((m) => m.ProductFormPage),
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
    loadComponent: () => import('./home/notificaciones/notificaciones.page').then((m) => m.NotificacionesPage),
  },
  {
    path: 'tabs',
    loadChildren: () => import('./home/tabs/tabs.routes').then((m) => m.routes),
  },
  { path: '**', redirectTo: 'splash' },
];
