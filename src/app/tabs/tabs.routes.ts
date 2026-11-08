import type { Routes } from '@angular/router';

import { authGuard } from '../service/auth.guard';

import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    canActivate: [authGuard],
    children: [
      {
        path: 'ganado/:id',
        loadComponent: () => import('../animal-detail/animal-detail.page').then((m) => m.AnimalDetailPage),
      },
      {
        path: 'inicio',
        loadComponent: () => import('../tab1/tab1.page').then((m) => m.Tab1Page),
      },
      {
        path: 'ganado',
        loadComponent: () => import('../tab2/tab2.page').then((m) => m.Tab2Page),
      },
      {
        path: 'inventario',
        loadComponent: () => import('../tab3/tab3.page').then((m) => m.Tab3Page),
      },
      {
        path: 'actividad/nueva',
        loadComponent: () => import('../actividad-form/actividad-form.page').then((m) => m.ActividadFormPage),
      },
      {
        path: 'actividad',
        loadComponent: () => import('../actividad/actividad.page').then((m) => m.ActividadPage),
      },
      {
        path: 'perfil',
        loadComponent: () => import('../perfil/perfil.page').then((m) => m.PerfilPage),
      },
      {
        path: 'trabajadores/:id',
        loadComponent: () => import('../trabajadores/trabajador-detalle.page').then((m) => m.TrabajadorDetallePage),
      },
      {
        path: 'trabajadores',
        loadComponent: () => import('../trabajadores/trabajadores.page').then((m) => m.TrabajadoresPage),
      },
      {
        path: 'compras/nueva',
        loadComponent: () => import('../compra-form/compra-form.page').then((m) => m.CompraFormPage),
      },
      {
        path: 'compras',
        loadComponent: () => import('../compras/compras.page').then((m) => m.ComprasPage),
      },
      {
        path: 'gastos',
        loadComponent: () => import('../gastos/gastos.page').then((m) => m.GastosPage),
      },
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full',
      },
    ],
  },
];
