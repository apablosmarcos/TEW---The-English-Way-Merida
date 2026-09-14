import { Routes } from '@angular/router';

import {
  academyAdminGuard,
  academyAnonymousGuard,
  academyAuthenticatedGuard,
  academyForcedChangeGuard,
  academyParentGuard,
} from './core/academy/academy-guards';
import { LeadsComponent } from './pages/admin/leads.component';
import { LoginComponent } from './pages/admin/login.component';
import { HomeComponent } from './pages/home/home.component';
import { PrivacidadComponent } from './pages/privacidad/privacidad.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'admin',
    component: LoginComponent,
  },
  {
    path: 'admin/leads',
    component: LeadsComponent,
  },
  {
    path: 'privacidad',
    component: PrivacidadComponent,
  },
  {
    path: 'academia',
    children: [
      {
        path: 'acceso',
        canActivate: [academyAnonymousGuard],
        loadComponent: () => import('./pages/academy/access.component').then((module) => module.AccessComponent),
      },
      {
        path: 'cambiar-contrasena',
        canActivate: [academyForcedChangeGuard],
        loadComponent: () => import('./pages/academy/password-change.component').then((module) => module.PasswordChangeComponent),
      },
          {
            path: 'admin/publicaciones',
            canActivate: [academyAuthenticatedGuard, academyAdminGuard],
            loadComponent: () => import('./pages/academy/academy-shell.component').then((module) => module.AcademyShellComponent),
          },
          {
            path: '',
            canActivate: [academyAuthenticatedGuard, academyParentGuard],
            loadComponent: () => import('./pages/academy/academy-shell.component').then((module) => module.AcademyShellComponent),
            children: [
              {
                path: '',
                pathMatch: 'full',
                loadComponent: () => import('./pages/academy/parent-post-list.component').then((module) => module.ParentPostListComponent),
              },
            ],
          },
    ],
  },
];
