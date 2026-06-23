import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { EMPTY, from } from 'rxjs';
import { catchError, finalize, switchMap, tap } from 'rxjs/operators';

import { AuthSessionService } from '../../core/services/auth-session.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
})
export class AuthComponent {
  protected loading = false;
  protected errorMessage: string | null = null;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly authSessionService: AuthSessionService,
    private readonly router: Router,
    private readonly toastService: ToastService,
  ) {}

  protected signInWithMicrosoft(): void {
    this.errorMessage = null;
    this.loading = true;

    from(this.authSessionService.signInWithMicrosoft())
      .pipe(
        tap(() => {
          this.toastService.success(
            "You've successfully logged in.",
            'Welcome Back',
          );
        }),
        switchMap(() => from(this.router.navigate(['/dashboard']))),
        catchError((error: unknown) => {
          const message = this.resolveErrorMessage(error);
          if (message) {
            this.errorMessage = message;
            this.toastService.error(message, 'Sign-in Failed');
          }
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private resolveErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'errorCode' in error) {
      const code = (error as { errorCode?: string }).errorCode;
      if (code === 'user_cancelled') {
        return '';
      }
    }

    if (typeof error === 'object' && error !== null && 'error' in error) {
      const apiError = error as { error?: { message?: string } };
      if (apiError.error?.message) {
        return apiError.error.message;
      }
    }

    return 'Authentication failed. Please try again.';
  }
}
