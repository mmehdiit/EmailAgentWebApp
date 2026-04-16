import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  ActiveForwardingRule,
  UnprocessedEmail
} from '../../../core/models/dashboard.models';
import { UnreadEmailDataService } from '../../../core/services/unread-email-data.service';

@Component({
  selector: 'app-unread-emails',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './unread-emails.component.html'
})
export class UnreadEmailsComponent implements OnInit {
  protected emails: UnprocessedEmail[] = [];
  protected rules: ActiveForwardingRule[] = [];
  protected loading = true;
  protected refreshing = false;
  protected selectedRules: Record<string, string> = {};
  protected markingReadId: string | null = null;
  protected assigningEmailId: string | null = null;

  constructor(private readonly unreadEmailDataService: UnreadEmailDataService) {}

  async ngOnInit(): Promise<void> {
    await this.loadUnreadEmails();
  }

  protected async loadUnreadEmails(): Promise<void> {
    this.loading = true;
    const data = await this.unreadEmailDataService.getUnreadEmails();
    this.emails = data.emails;
    this.rules = data.rules.filter((rule) => rule.active);
    this.loading = false;
    this.refreshing = false;
  }

  protected async refresh(): Promise<void> {
    this.refreshing = true;
    await this.loadUnreadEmails();
  }

  protected markAsRead(emailId: string): void {
    this.markingReadId = emailId;
    this.emails = this.emails.filter((email) => email.id !== emailId);
    this.markingReadId = null;
  }

  protected assignEmail(emailId: string): void {
    if (!this.selectedRules[emailId]) {
      return;
    }

    this.assigningEmailId = emailId;
    this.emails = this.emails.filter((email) => email.id !== emailId);
    delete this.selectedRules[emailId];
    this.assigningEmailId = null;
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
