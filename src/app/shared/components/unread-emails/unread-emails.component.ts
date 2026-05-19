import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { EMPTY, from } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

import {
  ActiveForwardingRule,
  UnprocessedEmail
} from '../../../core/models/dashboard.models';
import { UnreadEmailDataService } from '../../../core/services/unread-email-data.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  AppSelectDropdownComponent,
  SelectDropdownOption,
} from '../app-select-dropdown/app-select-dropdown.component';

@Component({
  selector: 'app-unread-emails',
  standalone: true,
  imports: [CommonModule, FormsModule, AppSelectDropdownComponent],
  templateUrl: './unread-emails.component.html'
})
export class UnreadEmailsComponent implements OnInit {
  protected emails: UnprocessedEmail[] = [];
  protected rules: ActiveForwardingRule[] = [];
  protected loading = true;
  protected refreshing = false;
  protected errorMessage = '';
  protected selectedRules: Record<string, string> = {};
  protected markingReadId: string | null = null;
  protected assigningEmailId: string | null = null;

  private readonly destroyRef = inject(DestroyRef);
  private loadSequence = 0;

  constructor(
    private readonly unreadEmailDataService: UnreadEmailDataService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadUnreadEmails();
  }

  protected loadUnreadEmails(): void {
    const loadId = ++this.loadSequence;
    this.loading = true;
    this.errorMessage = '';

    this.unreadEmailDataService.getUnreadEmailsOverview()
      .pipe(
        tap((data) => {
          if (loadId !== this.loadSequence) {
            return;
          }

          this.emails = data.emails;
          this.rules = data.rules.filter((rule) => rule.active);
        }),
        catchError(() => {
          if (loadId !== this.loadSequence) {
            return EMPTY;
          }

          this.emails = [];
          this.rules = [];
          this.errorMessage = 'Failed to load unread emails. Please try again.';
          return EMPTY;
        }),
        finalize(() => {
          if (loadId === this.loadSequence) {
            this.loading = false;
            this.refreshing = false;
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  protected refresh(): void {
    this.refreshing = true;
    this.loadUnreadEmails();
  }

  protected markAsRead(emailId: string): void {
    this.markingReadId = emailId;

    from(this.unreadEmailDataService.markAsRead(emailId))
      .pipe(
        tap(() => {
          this.emails = this.emails.filter((email) => email.id !== emailId);
          this.toastService.success(
            'Email has been marked as read and removed from the list.',
            'Marked as Read'
          );
        }),
        catchError(() => EMPTY),
        finalize(() => {
          this.markingReadId = null;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  protected assignEmail(emailId: string): void {
    if (!this.selectedRules[emailId]) {
      this.toastService.error(
        'Please select a rule to assign this email to.',
        'Select a Rule'
      );
      return;
    }

    this.assigningEmailId = emailId;
    const selectedRuleId = this.selectedRules[emailId];
    const ruleName =
      this.rules.find((rule) => rule.id === selectedRuleId)?.name ??
      'selected rule';

    from(this.unreadEmailDataService.assignEmail(emailId, selectedRuleId))
      .pipe(
        tap(() => {
          this.emails = this.emails.filter((email) => email.id !== emailId);
          delete this.selectedRules[emailId];
          this.toastService.success(
            `Forwarded via "${ruleName}".`,
            'Email Assigned'
          );
        }),
        catchError(() => EMPTY),
        finalize(() => {
          this.assigningEmailId = null;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  protected ruleOptions(): SelectDropdownOption[] {
    return this.rules.map((rule) => ({ value: rule.id, label: rule.name }));
  }

  protected formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }

    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }

    if (diffDays === 1) {
      return 'Yesterday';
    }

    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }

    return date.toLocaleDateString();
  }
}
