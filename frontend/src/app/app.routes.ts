import { Routes } from '@angular/router';

import {
  academyAdminGuard,
  academyAnonymousGuard,
  academyAuthenticatedGuard,
  academyForcedChangeGuard,
  academyParentGuard,
} from './core/academy/academy-guards';
import { LeadsComponent } from './pages/admin/leads.component';
import { HomeComponent } from './pages/home/home.component';
import { PrivacidadComponent } from './pages/privacidad/privacidad.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
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
            children: [
              {
                path: 'nueva',
                loadComponent: () => import('./pages/academy/admin-post-editor.component').then((module) => module.AdminPostEditorComponent),
              },
              {
                path: ':id',
                loadComponent: () => import('./pages/academy/admin-post-editor.component').then((module) => module.AdminPostEditorComponent),
              },
              {
                path: '',
                loadComponent: () => import('./pages/academy/admin-post-list.component').then((module) => module.AdminPostListComponent),
              },
            ],
          },
          {
            path: 'admin/usuarios',
            canActivate: [academyAuthenticatedGuard, academyAdminGuard],
            loadComponent: () => import('./pages/academy/academy-shell.component').then((module) => module.AcademyShellComponent),
            children: [
              {
                path: '',
                loadComponent: () => import('./pages/academy/admin-users.component').then((module) => module.AdminUsersComponent),
              },
            ],
          },
          {
            path: '',
            canActivate: [academyAuthenticatedGuard, academyParentGuard],
            loadComponent: () => import('./pages/academy/academy-shell.component').then((module) => module.AcademyShellComponent),
            children: [
              {
                path: 'publicaciones/:id',
                loadComponent: () => import('./pages/academy/post-detail.component').then((module) => module.PostDetailComponent),
              },
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
