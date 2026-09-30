import { Routes } from '@angular/router';

import {
  academyAdminGuard,
  academyAnonymousGuard,
  academyAuthenticatedGuard,
  academyForcedChangeGuard,
  academyParentGuard,
} from './core/academy/academy-guards';
import { HomeComponent } from './pages/home/home.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { PrivacidadComponent } from './pages/privacidad/privacidad.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    title: 'The English Way · Academia de inglés en Mérida',
    data: {
      description: 'Academia de inglés en Mérida con metodología práctica, seguimiento real y matrícula directa.',
      canonical: '/',
    },
  },
  {
    path: 'privacidad',
    component: PrivacidadComponent,
    title: 'Política de privacidad · The English Way',
    data: {
      description: 'Información sobre privacidad y tratamiento de datos de The English Way.',
      canonical: '/privacidad',
    },
  },
  {
    path: 'academia',
    title: 'Academia · The English Way',
    data: {
      description: 'Área privada de familias y administración de The English Way.',
      canonical: '/academia',
    },
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
  {
    path: '**',
    component: NotFoundComponent,
    title: 'Página no encontrada · The English Way',
    data: {
      description: 'La página solicitada no existe o ya no está disponible.',
      canonical: '/',
    },
  },
];
