import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { EMPTY, from } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

import {
  CreateUserPayload,
  DepartmentResponse,
  UserRoleOption,
} from '@core/models/dashboard.models';
import { ToastService } from '@core/services/toast.service';
import { UserManagementService } from '@core/services/user-management.service';
import { AppSelectDropdownComponent } from '@shared/components/app-select-dropdown/app-select-dropdown.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, AppSelectDropdownComponent],
  templateUrl: './user-management.component.html',
})
export class UserManagementComponent implements OnChanges {
  @Input() isAdmin = false;
  @Input() refreshToken = 0;
  protected activeTab: 'create-user' | 'department' = 'create-user';
  protected departmentId = '';
  protected departmentOptions: { value: string; label: string }[] = [];
  protected departments: DepartmentResponse[] = [];
  protected departmentName = '';
  protected email = '';
  protected role = 'user';
  protected loading = false;
  protected departmentLoading = false;
  protected creatingDepartment = false;
  protected message = '';
  protected errorMessage = '';
  protected readonly roleOptions: UserRoleOption[] = [
    { value: 'user', label: 'User' },
    { value: 'admin', label: 'Admin' },
  ];

  private readonly destroyRef = inject(DestroyRef);
  private readonly userManagementService = inject(UserManagementService);
  private readonly toastService = inject(ToastService);

  ngOnInit(): void {
    this.loadDepartments();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['refreshToken'] && !changes['refreshToken'].firstChange) {
      this.loadDepartments();
    }
  }

  protected setActiveTab(tab: 'create-user' | 'department'): void {
    this.activeTab = tab;
  }

  private async loadDepartments(): Promise<void> {
    this.departmentLoading = true;
    try {
      const departments = await this.userManagementService.getDepartments();
      this.departments = departments;
      this.departmentOptions = departments.map((dept) => ({
        value: dept.id,
        label: dept.name,
      }));
    } catch {
      this.toastService.error('Failed to load departments');
    } finally {
      this.departmentLoading = false;
    }
  }

  protected createUser(): void {
    this.message = '';
    this.errorMessage = '';

    const payload: CreateUserPayload = {
      email: this.email.trim(),
      role: this.role as 'user' | 'admin',
      departmentId: this.departmentId || undefined,
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
            `Successfully provisioned ${payload.email} with ${payload.role} role.`,
            'User Created',
          );
          this.email = '';
          this.role = 'user';
          this.departmentId = '';
        }),
        catchError(() => {
          this.errorMessage = 'Failed to create user.';
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private validate(payload: CreateUserPayload): string | null {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(payload.email)) {
      return 'Invalid email address';
    }

    if (!payload.departmentId) {
      return 'Department is required';
    }

    return null;
  }

  protected createDepartment(): void {
    const name = this.departmentName.trim();
    if (!name) {
      this.toastService.error('Department name is required', 'Validation Error');
      return;
    }

    this.creatingDepartment = true;

    from(this.userManagementService.createDepartment({ name }))
      .pipe(
        tap((department) => {
          this.departments = [...this.departments, department];
          this.departmentOptions = [
            ...this.departmentOptions,
            { value: department.id, label: department.name },
          ];
          this.departmentName = '';
          this.toastService.success(
            `${department.name} has been created.`,
            'Department Created',
          );
        }),
        catchError(() => {
          this.toastService.error('Failed to create department');
          return EMPTY;
        }),
        finalize(() => {
          this.creatingDepartment = false;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
