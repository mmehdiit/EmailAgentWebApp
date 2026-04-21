import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthSessionService } from '../../core/services/auth-session.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
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

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authSessionService: AuthSessionService,
    private readonly router: Router,
    private readonly toastService: ToastService
  ) {}

  protected async onSubmit(): Promise<void> {
    this.feedback = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    try {
      const response = await this.authSessionService.signIn(
        this.form.getRawValue()
      );

      this.feedback = {
        type: 'success',
        title: 'Welcome back!',
        description: response.message ?? "You've successfully logged in.",
      };
      this.toastService.success(
        response.message ?? "You've successfully logged in.",
        'Welcome Back'
      );

      await this.router.navigate(['/home']);
    } catch (error: unknown) {
      const message = this.resolveErrorMessage(error);

      this.feedback = {
        type: 'error',
        title: 'Login failed',
        description: message,
      };
      this.toastService.error(message, 'Login Failed');
    } finally {
      this.loading = false;
    }
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
