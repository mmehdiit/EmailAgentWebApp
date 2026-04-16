import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthSessionService } from '../services/auth-session.service';

/**
 * Protects routes that require the user to be authenticated.
 * If no valid session exists, redirects to /auth.
 */
export const authGuard: CanActivateFn = async () => {
  const authSessionService = inject(AuthSessionService);
  const router = inject(Router);

  const session = await authSessionService.getSession();

  if (session.authenticated) {
    return true;
  }

  return router.createUrlTree(['/auth']);
};
