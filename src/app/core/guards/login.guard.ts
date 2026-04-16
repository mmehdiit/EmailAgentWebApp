import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthSessionService } from '../services/auth-session.service';

/**
 * Prevents authenticated users from reaching the login page.
 * Redirects already-authenticated users to /dashboard.
 */
export const loginGuard: CanActivateFn = async () => {
  const authSessionService = inject(AuthSessionService);
  const router = inject(Router);

  const session = await authSessionService.getSession();

  if (!session.authenticated) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
