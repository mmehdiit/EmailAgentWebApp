import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

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

  constructor(
    private readonly unreadEmailDataService: UnreadEmailDataService,
    private readonly toastService: ToastService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadUnreadEmails();
  }

  protected async loadUnreadEmails(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      const data = await this.unreadEmailDataService.getUnreadEmails();
      this.emails = data.emails;
      this.rules = data.rules.filter((rule) => rule.active);
    } catch {
      this.emails = [];
      this.rules = [];
      this.errorMessage = 'Failed to load unread emails. Please try again.';
    } finally {
      this.loading = false;
      this.refreshing = false;
    }
  }

  protected async refresh(): Promise<void> {
    this.refreshing = true;
    await this.loadUnreadEmails();
  }

  protected async markAsRead(emailId: string): Promise<void> {
    this.markingReadId = emailId;
    try {
      await this.unreadEmailDataService.markAsRead(emailId);
      this.emails = this.emails.filter((email) => email.id !== emailId);
      this.toastService.success(
        'Email has been marked as read and removed from the list.',
        'Marked as Read'
      );
    } finally {
      this.markingReadId = null;
    }
  }

  protected async assignEmail(emailId: string): Promise<void> {
    if (!this.selectedRules[emailId]) {
      this.toastService.error(
        'Please select a rule to assign this email to.',
        'Select a Rule'
      );
      return;
    }

    this.assigningEmailId = emailId;
    try {
      const ruleName =
        this.rules.find((rule) => rule.id === this.selectedRules[emailId])?.name ??
        'selected rule';
      await this.unreadEmailDataService.assignEmail(emailId, this.selectedRules[emailId]);
      this.emails = this.emails.filter((email) => email.id !== emailId);
      delete this.selectedRules[emailId];
      this.toastService.success(
        `Forwarded via "${ruleName}".`,
        'Email Assigned'
      );
    } finally {
      this.assigningEmailId = null;
    }
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
