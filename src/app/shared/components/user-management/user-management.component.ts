import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Input, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { EMPTY, from } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

import { CreateUserPayload, UserRoleOption } from '../../../core/models/dashboard.models';
import { UserManagementService } from '../../../core/services/user-management.service';
import { ToastService } from '../../../core/services/toast.service';
import { AppSelectDropdownComponent } from '../app-select-dropdown/app-select-dropdown.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, AppSelectDropdownComponent],
  templateUrl: './user-management.component.html'
})
export class UserManagementComponent {
  @Input() isAdmin = false;

  protected email = '';
  protected password = '';
  protected role = 'user';
  protected loading = false;
  protected message = '';
  protected errorMessage = '';
  protected readonly roleOptions: UserRoleOption[] = [
    { value: 'user', label: 'User' },
    { value: 'admin', label: 'Admin' }
  ];

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly userManagementService: UserManagementService,
    private readonly toastService: ToastService
  ) {}

  protected createUser(): void {
    this.message = '';
    this.errorMessage = '';

    const payload: CreateUserPayload = {
      email: this.email.trim(),
      password: this.password,
      role: this.role as 'user' | 'admin'
    };

    const validationError = this.validate(payload);
    if (validationError) {
      this.errorMessage = validationError;
      this.toastService.error(validationError, 'Validation Error');
      return;
    }

    this.loading = true;

    from(this.userManagementService.createUser(payload))
      .pipe(
        tap((response) => {
          this.message = response.message;
          this.toastService.success(
            `Successfully created user ${payload.email} with ${payload.role} role.`,
            'User Created'
          );
          this.email = '';
          this.password = '';
          this.role = 'user';
        }),
        catchError(() => {
          this.errorMessage = 'Failed to create user.';
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private validate(payload: CreateUserPayload): string | null {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(payload.email)) {
      return 'Invalid email address';
    }

    if (payload.password.length < 6) {
      return 'Password must be at least 6 characters';
    }

    return null;
  }
}
