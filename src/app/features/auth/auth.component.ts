import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthSessionService } from '../../core/services/auth-session.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})
export class AuthComponent implements OnInit {
  protected loading = false;
  protected feedback: { type: 'success' | 'error'; title: string; description: string } | null = null;

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]]
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authSessionService: AuthSessionService,
    private readonly router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    const session = await this.authSessionService.getSession();
    if (session?.authenticated) {
      await this.router.navigate(['/dashboard']);
    }
  }

  protected async onSubmit(): Promise<void> {
    this.feedback = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    try {
      const response = await this.authSessionService.signIn(this.form.getRawValue());

      this.feedback = {
        type: 'success',
        title: 'Welcome back!',
        description: response.message ?? "You've successfully logged in."
      };

      await this.router.navigate(['/dashboard']);
    } catch (error: unknown) {
      const message = this.resolveErrorMessage(error);

      this.feedback = {
        type: 'error',
        title: 'Login failed',
        description: message
      };
    } finally {
      this.loading = false;
    }
  }

  protected async fakeLogin(): Promise<void> {
    const email = this.form.controls.email.value || 'frontend@test.local';
    const response = await this.authSessionService.signInFake(email);

    this.feedback = {
      type: 'success',
      title: 'Fake login enabled',
      description: response.message ?? 'Frontend test session created.'
    };

    await this.router.navigate(['/dashboard']);
  }

  protected hasError(controlName: 'email' | 'password', errorName: string): boolean {
    const control = this.form.controls[controlName];
    return control.touched && control.hasError(errorName);
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
