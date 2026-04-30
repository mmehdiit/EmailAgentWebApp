import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  EventEmitter,
  OnInit,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { EMPTY, from } from 'rxjs';
import { catchError, finalize, switchMap, tap } from 'rxjs/operators';

import { SafeHtml } from '@angular/platform-browser';
import {
  DashboardAnalytics,
  EmailAnalyticsLog,
  EmailContent,
  RuleItem,
} from '../../../core/models/dashboard.models';
import { AnalyticsDataService } from '../../../core/services/analytics-data.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  AppSelectDropdownComponent,
  SelectDropdownOption,
} from '../app-select-dropdown/app-select-dropdown.component';
import { KeywordInputComponent } from '../keyword-input/keyword-input.component';

const RULE_COLOR_PALETTE = [
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-purple-100 text-purple-800 border-purple-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-rose-100 text-rose-800 border-rose-200',
  'bg-cyan-100 text-cyan-800 border-cyan-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-orange-100 text-orange-800 border-orange-200',
  'bg-teal-100 text-teal-800 border-teal-200',
  'bg-pink-100 text-pink-800 border-pink-200',
];

@Component({
  selector: 'app-email-analytics-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    KeywordInputComponent,
    AppSelectDropdownComponent,
  ],
  templateUrl: './email-analytics-table.component.html',
  styles: [
    `
      .paginator {
        // Meta section
        &__count {
          white-space: nowrap;
        }

        &__size-select {
          display: inline-flex;
          align-items: center;
        }

        &__select {
          cursor: pointer;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;

          &:hover {
            background-color: hsl(var(--muted) / 0.4);
          }
        }

        // Navigation
        &__nav {
          flex-wrap: wrap;
        }

        &__btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 28px;
          min-width: 28px;
          padding: 0 6px;
          border-radius: 8px;
          border: 1px solid hsl(var(--border) / 0.5);
          background: hsl(var(--background));
          color: hsl(var(--foreground) / 0.7);
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          line-height: 1;
          white-space: nowrap;

          &:hover:not(:disabled):not(.paginator__btn--active) {
            border-color: hsl(var(--primary) / 0.35);
            background: hsl(var(--primary) / 0.06);
            color: hsl(var(--primary));
          }

          &:disabled {
            opacity: 0.35;
            cursor: not-allowed;
          }

          // Active/current page
          &--active {
            border-color: hsl(var(--primary) / 0.5);
            background: hsl(var(--primary) / 0.1);
            color: hsl(var(--primary));
            font-weight: 600;
            cursor: default;
          }

          // Arrow prev/next — slightly wider touch target
          &--arrow {
            color: hsl(var(--muted-foreground) / 0.7);
          }
        }

        &__ellipsis {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 28px;
          min-width: 28px;
          font-size: 12px;
          color: hsl(var(--muted-foreground) / 0.5);
          letter-spacing: 0.05em;
          user-select: none;
        }
      }
    `,
  ],
})
export class EmailAnalyticsTableComponent implements OnInit {
  @Output() viewEmailRequested = new EventEmitter<EmailAnalyticsLog>();
  pageSize = signal(10);
  currentPage = signal(1);
  pageSizeOptions = [10, 25, 50];
  protected readonly weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
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
  protected datePopoverOpen = false;

  protected datePreset = '30';
  protected dateRange = this.buildPresetRange(30);
  protected calendarMonth = this.startOfMonth(this.dateRange.from);
  protected ruleFilter = 'all';
  protected subjectSearch: string[] = [];

  protected assignPopoverOpen: string | null = null;
  protected isAssigning: string | null = null;
  protected emailDialogOpen = false;
  protected loadingEmail = false;
  protected emailContent: EmailContent | null = null;
  protected trustedEmailBody: SafeHtml | null = null;

  protected availableRules: RuleItem[] = [];

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly analyticsDataService: AnalyticsDataService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadAnalytics();
    this.loadRules();
  }

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: (number | '…')[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    if (current > 3) pages.push('…');

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (current < total - 2) pages.push('…');
    pages.push(total);
    return pages;
  });

  getEndRecord(): number {
    return Math.min(
      this.currentPage() * this.pageSize(),
      this.filteredLogs().length
    );
  }

  goToPage(page: number | '…') {
    if (typeof page !== 'number') return;
    this.currentPage.set(Math.min(Math.max(1, page), this.totalPages()));
  }

  onPageSizeChange(event: Event) {
    const size = Number((event.target as HTMLSelectElement).value);
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  prevPage() {
    if (this.currentPage() > 1) this.currentPage.update((p) => p - 1);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages())
      this.currentPage.update((p) => p + 1);
  }

  paginatedLogs = computed(() => {
    const all = this.filteredLogs();
    const size = this.pageSize();
    const page = this.currentPage();
    const start = (page - 1) * size;
    return all.slice(start, start + size);
  });

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredLogs().length / this.pageSize()))
  );

  protected loadAnalytics(forceRefresh = false): void {
    this.loading = true;

    from(
      this.analyticsDataService.getAnalytics(
        forceRefresh,
        this.analyticsDateFilters()
      )
    )
      .pipe(
        tap((analytics) => {
          this.analytics = analytics;
        }),
        catchError(() => EMPTY),
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  protected loadLogs(): void {
    this.loadAnalytics(true);
  }

  protected loadRules(): void {
    from(this.analyticsDataService.listAvailableRules())
      .pipe(
        tap((rules) => {
          this.availableRules = rules;
        }),
        catchError(() => EMPTY),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
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
    const minDate = this.startOfDay(this.dateRange.from);
    const maxDate = this.endOfDay(this.dateRange.to);

    rows = rows.filter((log) => {
      const value = log.receivedAt || log.processedAt || log.date;
      if (!value) {
        return false;
      }

      const date = new Date(value);
      return (
        !Number.isNaN(date.getTime()) && date >= minDate && date <= maxDate
      );
    });

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
    const days = Number(this.datePreset);
    if (!Number.isNaN(days) && days > 0) {
      this.setPreset(days);
    }
  }

  protected applyFilters(): void {}

  protected statusOptions(): SelectDropdownOption[] {
    return [
      { value: 'all', label: 'All Statuses' },
      { value: 'forwarded', label: 'Forwarded' },
      { value: 'replied', label: 'Replied' },
      { value: 'no_match', label: 'No Match' },
      { value: 'failed', label: 'Failed' },
      { value: 'success', label: 'Success' },
      { value: 'skipped', label: 'Skipped' },
    ];
  }

  protected ruleOptions(): SelectDropdownOption[] {
    return [
      { value: 'all', label: 'All Rules' },
      { value: 'no_rule', label: 'No Rule' },
      ...this.uniqueRuleNames().map((name) => ({ value: name, label: name })),
    ];
  }

  protected presetLabel(): string {
    return `${this.formatShortDate(
      this.dateRange.from
    )} - ${this.formatLongDate(this.dateRange.to)}`;
  }

  protected rangeDurationLabel(): string {
    const from = this.startOfDay(this.dateRange.from).getTime();
    const to = this.startOfDay(this.dateRange.to).getTime();
    const days = Math.round((to - from) / 86_400_000) + 1;
    return days === 1 ? '1 day' : `${days} days`;
  }

  protected setPreset(days: number): void {
    this.datePreset = String(days);
    this.dateRange = this.buildPresetRange(days);
    this.calendarMonth = this.startOfMonth(this.dateRange.from);
    this.loadAnalytics(true);
  }

  protected previousCalendarMonth(): void {
    this.calendarMonth = new Date(
      this.calendarMonth.getFullYear(),
      this.calendarMonth.getMonth() - 1,
      1
    );
  }

  protected nextCalendarMonth(): void {
    this.calendarMonth = new Date(
      this.calendarMonth.getFullYear(),
      this.calendarMonth.getMonth() + 1,
      1
    );
  }

  protected calendarTitle(offset = 0): string {
    const month = new Date(
      this.calendarMonth.getFullYear(),
      this.calendarMonth.getMonth() + offset,
      1
    );
    return month.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }

  protected calendarDays(
    offset = 0
  ): Array<{ date: Date; currentMonth: boolean }> {
    const month = new Date(
      this.calendarMonth.getFullYear(),
      this.calendarMonth.getMonth() + offset,
      1
    );
    const firstVisible = new Date(month);
    firstVisible.setDate(1 - month.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(firstVisible);
      date.setDate(firstVisible.getDate() + index);
      return {
        date,
        currentMonth: date.getMonth() === month.getMonth(),
      };
    });
  }

  protected selectDate(date: Date): void {
    const selected = this.startOfDay(date);
    const from = this.startOfDay(this.dateRange.from);
    const to = this.startOfDay(this.dateRange.to);

    if (from.getTime() === to.getTime()) {
      if (selected < from) {
        this.dateRange = { from: selected, to: from };
      } else if (selected.getTime() === from.getTime()) {
        this.dateRange = { from: selected, to: selected };
      } else {
        this.dateRange = { from, to: selected };
      }
      this.datePreset = 'custom';
      this.loadAnalytics(true);
      return;
    }

    this.dateRange = { from: selected, to: selected };
    this.datePreset = 'custom';
    this.loadAnalytics(true);
  }

  protected dayButtonClasses(day: {
    date: Date;
    currentMonth: boolean;
  }): string {
    const date = this.startOfDay(day.date);
    const from = this.startOfDay(this.dateRange.from);
    const to = this.startOfDay(this.dateRange.to);

    const isEndpoint =
      date.getTime() === from.getTime() || date.getTime() === to.getTime();
    const isBetween = date > from && date < to;
    const isToday = date.getTime() === this.startOfDay(new Date()).getTime();

    if (isEndpoint) {
      return 'bg-primary text-primary-foreground shadow-sm hover:bg-primary';
    }

    if (isBetween) {
      return 'bg-primary/10 text-primary hover:bg-primary/15';
    }

    if (!day.currentMonth) {
      return 'text-slate-300 hover:bg-slate-50';
    }

    if (isToday) {
      return 'border border-primary/40 text-primary hover:bg-primary/10';
    }

    return 'text-slate-700 hover:bg-slate-100';
  }

  protected dayCellClasses(day: { date: Date; currentMonth: boolean }): string {
    const date = this.startOfDay(day.date);
    const from = this.startOfDay(this.dateRange.from);
    const to = this.startOfDay(this.dateRange.to);

    const classes = ['flex', 'justify-center', 'py-0.5'];
    const isEndpoint =
      date.getTime() === from.getTime() || date.getTime() === to.getTime();

    if (date > from && date < to) {
      classes.push('bg-primary/10');
    }

    if (date.getTime() === from.getTime()) {
      classes.push('rounded-l-full');
    }

    if (date.getTime() === to.getTime()) {
      classes.push('rounded-r-full');
    }

    if (isEndpoint && from.getTime() !== to.getTime()) {
      classes.push('bg-primary/10');
    }

    return classes.join(' ');
  }

  protected uniqueRuleNames(): string[] {
    return [
      ...new Set(
        this.logs()
          .map((x) => x.ruleName)
          .filter((x): x is string => !!x)
      ),
    ].sort();
  }

  protected ruleBadgeClasses(ruleName?: string | null): string {
    if (!ruleName) {
      return '';
    }

    const ruleNames = this.uniqueRuleNames();
    const index = ruleNames.indexOf(ruleName);
    return index === -1
      ? ''
      : RULE_COLOR_PALETTE[index % RULE_COLOR_PALETTE.length];
  }

  protected rules(): RuleItem[] {
    return this.availableRules;
  }

  protected hasLogsWithoutReceivedAt(): boolean {
    return this.logs().some((log) => !log.receivedAt);
  }

  protected backfillReceivedDates(): void {
    return;
  }

  protected retryFailedEmails(): void {
    this.isRetrying = true;

    from(this.analyticsDataService.retryFailedEmails())
      .pipe(
        tap((result) => {
          this.toastService.success(
            `${result.retried} emails re-sent, ${result.stillFailed} still failed.`,
            'Retry Complete'
          );
        }),
        switchMap(() =>
          from(
            this.analyticsDataService.getAnalytics(
              true,
              this.analyticsDateFilters()
            )
          )
        ),
        tap((analytics) => {
          this.analytics = analytics;
        }),
        catchError(() => EMPTY),
        finalize(() => {
          this.isRetrying = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  protected clearLogs(): void {
    return;
  }

  protected exportCsv(): void {
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
      case 'manual_button':
        return 'Manual';
      case 'outlook':
        return 'Outlook';
      case 'sent_folder':
        return 'Sent';
      case 'cc_detection':
        return 'CC';
      case 'manual_link':
        return 'Link';
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

  protected viewEmail(log: EmailAnalyticsLog): void {
    this.viewEmailRequested.emit(log);
  }

  protected markAsReplied(logId: string): void {
    from(this.analyticsDataService.markAsReplied(logId))
      .pipe(
        tap(() => {
          this.toastService.success(
            'Email has been marked as replied.',
            'Marked As Replied'
          );
        }),
        switchMap(() =>
          from(
            this.analyticsDataService.getAnalytics(
              true,
              this.analyticsDateFilters()
            )
          )
        ),
        tap((analytics) => {
          this.analytics = analytics;
        }),
        catchError(() => EMPTY),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  protected toggleAssignPopover(logId: string): void {
    this.assignPopoverOpen = this.assignPopoverOpen === logId ? null : logId;
  }

  protected assignToRule(log: EmailAnalyticsLog, ruleId: string): void {
    this.isAssigning = log.id;

    from(
      this.analyticsDataService.assignToRule(
        log.outlookMessageId as string,
        ruleId
      )
    )
      .pipe(
        tap(() => {
          this.toastService.success(
            'Email has been assigned and processed successfully.',
            'Assigned Successfully'
          );
          this.assignPopoverOpen = null;
        }),
        switchMap(() =>
          from(
            this.analyticsDataService.getAnalytics(
              true,
              this.analyticsDateFilters()
            )
          )
        ),
        tap((analytics) => {
          this.analytics = analytics;
        }),
        catchError(() => EMPTY),
        finalize(() => {
          this.isAssigning = null;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private buildPresetRange(days: number): { from: Date; to: Date } {
    const to = this.startOfDay(new Date());
    const from = new Date(to);
    from.setDate(to.getDate() - days);
    return { from, to };
  }

  private startOfMonth(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), 1);
  }

  private startOfDay(value: Date): Date {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private endOfDay(value: Date): Date {
    const date = new Date(value);
    date.setHours(23, 59, 59, 999);
    return date;
  }

  private formatShortDate(value: Date): string {
    return value.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  private formatLongDate(value: Date): string {
    return value.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  private analyticsDateFilters(): { fromDate: string; toDate: string } {
    return {
      fromDate: this.formatApiDate(this.dateRange.from),
      toDate: this.formatApiDate(this.dateRange.to),
    };
  }

  private formatApiDate(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
