import { Routes } from '@angular/router';

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
];
