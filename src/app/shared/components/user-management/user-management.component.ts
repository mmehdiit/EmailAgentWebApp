import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CreateUserPayload, UserRoleOption } from '../../../core/models/dashboard.models';
import { UserManagementService } from '../../../core/services/user-management.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html'
})
export class UserManagementComponent {
  @Input() isAdmin = false;

  protected email = '';
  protected password = '';
  protected role: 'user' | 'admin' = 'user';
  protected loading = false;
  protected message = '';
  protected errorMessage = '';
  protected readonly roleOptions: UserRoleOption[] = [
    { value: 'user', label: 'User' },
    { value: 'admin', label: 'Admin' }
  ];

  constructor(private readonly userManagementService: UserManagementService) {}

  protected async createUser(): Promise<void> {
    this.message = '';
    this.errorMessage = '';

    const payload: CreateUserPayload = {
      email: this.email.trim(),
      password: this.password,
      role: this.role
    };

    const validationError = this.validate(payload);
    if (validationError) {
      this.errorMessage = validationError;
      return;
    }

    this.loading = true;

    try {
      const response = await this.userManagementService.createUser(payload);
      this.message = response.message;
      this.email = '';
      this.password = '';
      this.role = 'user';
    } catch {
      this.errorMessage = 'Failed to create user.';
    } finally {
      this.loading = false;
    }
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
