import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { loginGuard } from './core/guards/login.guard';
import { HomeComponent } from './features/home/home.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./features/auth/auth.component').then((m) => m.AuthComponent),
    canActivate: [loginGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'mark-replied',
    loadComponent: () =>
      import('./features/mark-replied/mark-replied.component').then(
        (m) => m.MarkRepliedComponent
      ),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(
        (m) => m.NotFoundComponent
      ),
  },
];
