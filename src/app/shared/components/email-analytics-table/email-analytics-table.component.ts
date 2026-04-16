import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  DashboardAnalytics,
  EmailAnalyticsLog,
  EmailContent,
  RuleItem,
} from '../../../core/models/dashboard.models';
import { AnalyticsDataService } from '../../../core/services/analytics-data.service';
import { KeywordInputComponent } from '../keyword-input/keyword-input.component';

@Component({
  selector: 'app-email-analytics-table',
  standalone: true,
  imports: [CommonModule, FormsModule, KeywordInputComponent],
  templateUrl: './email-analytics-table.component.html',
})
export class EmailAnalyticsTableComponent implements OnInit {
  protected loading = true;
  protected exporting = false;
  protected analytics: DashboardAnalytics | null = null;
  protected statusFilter = 'all';

  protected isBackfilling = false;
  protected isRetrying = false;
  protected isClearing = false;
  protected isExporting = false;

  protected openClearDialog = false;
  protected readonly canClearLogs = false;
  protected readonly canBackfillReceivedDates = false;

  protected datePreset = '30';
  protected ruleFilter = 'all';
  protected subjectSearch: string[] = [];

  protected assignPopoverOpen: string | null = null;
  protected isAssigning: string | null = null;

  protected emailDialogOpen = false;
  protected loadingEmail = false;
  protected emailContent: EmailContent | null = null;

  protected availableRules: RuleItem[] = [];

  constructor(private readonly analyticsDataService: AnalyticsDataService) {}

  async ngOnInit(): Promise<void> {
    await this.loadAnalytics();
    await this.loadRules();
  }

  protected async loadAnalytics(): Promise<void> {
    this.loading = true;
    try {
      this.analytics = await this.analyticsDataService.getAnalytics();
    } finally {
      this.loading = false;
    }
  }

  protected async loadLogs(): Promise<void> {
    await this.loadAnalytics();
  }

  protected async loadRules(): Promise<void> {
    this.availableRules = await this.analyticsDataService.listAvailableRules();
  }

  protected logs(): EmailAnalyticsLog[] {
    return this.analytics?.logs ?? [];
  }

  protected stats(): {
    total: number;
    forwarded: number;
    replied: number;
    failed: number;
    noMatch: number;
    success: number;
    skipped: number;
  } {
    const logs = this.logs();

    return {
      total: logs.length,
      forwarded: logs.filter((x) => x.status === 'forwarded').length,
      replied: logs.filter((x) => x.replyDetected).length,
      failed: logs.filter((x) => x.status === 'failed').length,
      noMatch: logs.filter((x) => x.status === 'no_match').length,
      success: logs.filter((x) => x.status === 'success').length,
      skipped: logs.filter((x) => x.status === 'skipped').length,
    };
  }

  protected filteredLogs(): EmailAnalyticsLog[] {
    let rows = this.logs();

    const days = Number(this.datePreset);
    if (!Number.isNaN(days) && days > 0) {
      const now = new Date();
      const minDate = new Date();
      minDate.setDate(now.getDate() - days);

      rows = rows.filter((log) => {
        const value = log.receivedAt || log.processedAt || log.date;
        if (!value) return false;
        const d = new Date(value);
        return !Number.isNaN(d.getTime()) && d >= minDate;
      });
    }

    if (this.statusFilter !== 'all') {
      if (this.statusFilter === 'replied') {
        rows = rows.filter((log) => log.replyDetected);
      } else {
        rows = rows.filter((log) => log.status === this.statusFilter);
      }
    }

    if (this.ruleFilter !== 'all') {
      if (this.ruleFilter === 'no_rule') {
        rows = rows.filter((log) => !log.ruleName);
      } else {
        rows = rows.filter((log) => log.ruleName === this.ruleFilter);
      }
    }

    if (this.subjectSearch.length > 0) {
      const keywords = this.subjectSearch
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);

      rows = rows.filter((log) => {
        const subject = (log.subject || '').toLowerCase();
        return keywords.every((keyword) => subject.includes(keyword));
      });
    }

    return rows;
  }

  protected applyPreset(): void {
    this.applyFilters();
  }

  protected applyFilters(): void {}

  protected uniqueRuleNames(): string[] {
    return [
      ...new Set(
        this.logs()
          .map((x) => x.ruleName)
          .filter((x): x is string => !!x)
      ),
    ].sort();
  }

  protected rules(): RuleItem[] {
    return this.availableRules;
  }

  protected hasLogsWithoutReceivedAt(): boolean {
    return this.logs().some((log) => !log.receivedAt);
  }

  protected async backfillReceivedDates(): Promise<void> {
    return;
  }

  protected async retryFailedEmails(): Promise<void> {
    this.isRetrying = true;
    try {
      await this.analyticsDataService.retryFailedEmails();
      await this.loadAnalytics();
    } finally {
      this.isRetrying = false;
    }
  }

  protected async clearLogs(): Promise<void> {
    return;
  }

  protected async exportCsv(): Promise<void> {
    const rows = this.filteredLogs();
    if (rows.length === 0) {
      return;
    }

    this.exporting = true;
    this.isExporting = true;

    try {
      const headers = [
        'Date',
        'From',
        'Subject',
        'Status',
        'Rule',
        'Forwarded To',
        'Reply',
        'Reply Source',
        'Response Time',
        'AI',
      ];

      const data = rows.map((log) =>
        [
          log.date,
          log.from,
          log.subject,
          log.replyDetected ? 'replied' : log.status,
          log.ruleName ?? '',
          log.forwardedTo ?? '',
          log.replyDetected ? 'Yes' : 'No',
          log.replySource ? this.getReplySourceLabel(log.replySource) : '',
          log.replyDetected && log.repliedAt
            ? this.calculateResponseTime(log.processedAt, log.repliedAt)
            : '',
          log.aiClassified ? 'Yes' : 'No',
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(',')
      );

      const csv = [headers.join(','), ...data].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'email-analytics.csv';
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      this.exporting = false;
      this.isExporting = false;
    }
  }

  protected statusClasses(log: EmailAnalyticsLog): string {
    if (log.replyDetected) {
      return 'bg-success/10 border-success/30 text-success';
    }

    if (log.status === 'forwarded') {
      return 'bg-primary text-primary-foreground';
    }

    if (log.status === 'failed') {
      return 'bg-destructive text-destructive-foreground';
    }

    return 'bg-muted text-muted-foreground';
  }

  protected getReplySourceLabel(source?: string | null): string {
    switch (source) {
      case 'manual':
        return 'Manual';
      case 'outlook':
        return 'Outlook';
      case 'system':
        return 'System';
      default:
        return source || '-';
    }
  }

  protected calculateResponseTime(
    processedAt?: string | null,
    repliedAt?: string | null
  ): string {
    if (!processedAt || !repliedAt) {
      return '-';
    }

    const start = new Date(processedAt).getTime();
    const end = new Date(repliedAt).getTime();

    if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
      return '-';
    }

    const diffMs = end - start;
    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) {
      return `${days}d ${hours}h`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
  }

  protected async viewEmail(log: EmailAnalyticsLog): Promise<void> {
    if (!log.outlookMessageId) {
      return;
    }

    this.emailDialogOpen = true;
    this.loadingEmail = true;
    this.emailContent = null;

    try {
      this.emailContent = await this.analyticsDataService.getEmailContent(log.outlookMessageId);
    } finally {
      this.loadingEmail = false;
    }
  }

  protected async markAsReplied(logId: string): Promise<void> {
    await this.analyticsDataService.markAsReplied(logId);
    await this.loadAnalytics();
  }

  protected toggleAssignPopover(logId: string): void {
    this.assignPopoverOpen = this.assignPopoverOpen === logId ? null : logId;
  }

  protected async assignToRule(
    log: EmailAnalyticsLog,
    ruleId: string
  ): Promise<void> {
    this.isAssigning = log.id;

    try {
      await this.analyticsDataService.assignToRule(log.outlookMessageId as string, ruleId);
      this.assignPopoverOpen = null;
      await this.loadAnalytics();
    } finally {
      this.isAssigning = null;
    }
  }
}
