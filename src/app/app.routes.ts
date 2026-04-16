import { Routes } from '@angular/router';

import { AuthComponent } from './features/auth/auth.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { HomeComponent } from './features/home/home.component';
import { MarkRepliedComponent } from './features/mark-replied/mark-replied.component';
import { NotFoundComponent } from './features/not-found/not-found.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'auth',
    component: AuthComponent,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  {
    path: 'mark-replied',
    component: MarkRepliedComponent,
  },
  {
    path: '**',
    component: NotFoundComponent,
  },
];
