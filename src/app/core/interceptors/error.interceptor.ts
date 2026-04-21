import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message = resolveErrorMessage(error);

      if (message) {
        toastService.error(message);
      }

      return throwError(() => error);
    })
  );
};

function resolveErrorMessage(error: HttpErrorResponse): string {
  if (typeof error.error === 'string' && error.error.trim()) {
    return error.error;
  }

  if (error.error && typeof error.error === 'object') {
    if (typeof error.error.error === 'string' && error.error.error.trim()) {
      return error.error.error;
    }

    if (typeof error.error.message === 'string' && error.error.message.trim()) {
      return error.error.message;
    }
  }

  if (error.status === 0) {
    return 'Unable to reach the server.';
  }

  if (typeof error.message === 'string' && error.message.trim()) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}
