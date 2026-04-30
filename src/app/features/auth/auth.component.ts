import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EMPTY, from } from 'rxjs';
import { catchError, finalize, switchMap, tap } from 'rxjs/operators';

import { AuthSessionService } from '../../core/services/auth-session.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
})
export class AuthComponent {
  protected loading = false;
  protected showPassword = false;
  protected feedback: {
    type: 'success' | 'error';
    title: string;
    description: string;
  } | null = null;

  protected readonly form = this.formBuilder.nonNullable.group({
    email: [
      '',
      [Validators.required, Validators.email, Validators.maxLength(255)],
    ],
    password: [
      '',
      [Validators.required, Validators.minLength(6), Validators.maxLength(100)],
    ],
  });

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authSessionService: AuthSessionService,
    private readonly router: Router,
    private readonly toastService: ToastService
  ) {}

  protected onSubmit(): void {
    this.feedback = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    from(this.authSessionService.signIn(this.form.getRawValue()))
      .pipe(
        tap((response) => {
          this.feedback = {
            type: 'success',
            title: 'Welcome back!',
            description: response.message ?? "You've successfully logged in.",
          };
          this.toastService.success(
            response.message ?? "You've successfully logged in.",
            'Welcome Back'
          );
        }),
        switchMap(() => from(this.router.navigate(['/dashboard']))),
        catchError((error: unknown) => {
          const message = this.resolveErrorMessage(error);

          this.feedback = {
            type: 'error',
            title: 'Login failed',
            description: message,
          };
          this.toastService.error(message, 'Login Failed');

          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  protected hasError(
    controlName: 'email' | 'password',
    errorName: string
  ): boolean {
    const control = this.form.controls[controlName];
    return control.touched && control.hasError(errorName);
  }

  protected togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private resolveErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error && 'error' in error) {
      const apiError = error as {
        error?: {
          message?: string;
          errors?: string[];
        };
      };

      if (apiError.error?.message) {
        return apiError.error.message;
      }

      if (apiError.error?.errors?.length) {
        return apiError.error.errors[0];
      }
    }

    return 'An unexpected error occurred. Please try again.';
  }
}
