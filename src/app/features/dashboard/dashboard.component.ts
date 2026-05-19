import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, Observable, forkJoin, from, of } from 'rxjs';
import { catchError, finalize, switchMap, tap } from 'rxjs/operators';

import {
  DashboardOverview,
  EmailAnalyticsLog,
  EmailContent,
} from '@core/models/dashboard.models';
import { SortableDashboardRule } from '@core/models/rule.models';
import { AnalyticsDataService } from '@core/services/analytics-data.service';
import { AuthSessionService } from '@core/services/auth-session.service';
import { DashboardDataService } from '@core/services/dashboard-data.service';
import { RuleManagementService } from '@core/services/rule-management.service';
import { ToastService } from '@core/services/toast.service';
import { KeywordInputComponent } from '@shared/components/keyword-input/keyword-input.component';
import { RecipientManagerComponent } from '@shared/components/recipient-manager/recipient-manager.component';
import { TopNavbarComponent } from '@shared/components/top-navbar/top-navbar.component';
import { EmailAnalyticsTableComponent } from './components/email-analytics-table/email-analytics-table.component';
import { ReplyAnalyticsComponent } from './components/reply-analytics/reply-analytics.component';
import { RulePerformanceComponent } from './components/rule-performance/rule-performance.component';
import { RuleTesterComponent } from './components/rule-tester/rule-tester.component';
import { SortableRuleItemComponent } from './components/sortable-rule-item/sortable-rule-item.component';
import { UnreadEmailsComponent } from './components/unread-emails/unread-emails.component';
import { UserManagementComponent } from './components/user-management/user-management.component';

type DashboardRuleEditor = SortableDashboardRule;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    KeywordInputComponent,
    RecipientManagerComponent,
    RuleTesterComponent,
    EmailAnalyticsTableComponent,
    ReplyAnalyticsComponent,
    RulePerformanceComponent,
    SortableRuleItemComponent,
    TopNavbarComponent,
    UnreadEmailsComponent,
    UserManagementComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  protected loading = true;
  protected loadingError = '';
  protected activeTab: 'overview' | 'rules' | 'analytics' | 'emails' | 'users' =
    'overview';
  protected countdown = 300;
  protected overview: DashboardOverview | null = null;
  protected userEmail = 'frontend@test.local';
  protected isAdmin = false;
  protected connectionMessage = '';
  protected outlookConnected = false;
  protected outlookEmail: string | null = null;
  protected isConnecting = false;
  protected isProcessing = false;
  protected isRefreshingActivity = false;
  protected emailDialogOpen = false;
  protected loadingEmail = false;
  protected emailContent: EmailContent | null = null;
  protected trustedEmailBody: SafeHtml | null = null;
  protected ruleTesterDialogOpen = false;
  protected rules: DashboardRuleEditor[] = [];
  protected showAddRule = false;
  protected editingRuleId: string | null = null;
  protected readonly newRule: DashboardRuleEditor = this.createEmptyRule();
  protected draggedRuleId: string | null = null;

  private countdownInterval?: ReturnType<typeof setInterval>;
  private readonly authSessionService = inject(AuthSessionService);
  private readonly analyticsDataService = inject(AnalyticsDataService);
  private readonly dashboardDataService = inject(DashboardDataService);
  private readonly ruleManagementService = inject(RuleManagementService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);

  ngOnInit(): void {
    this.loading = true;
    this.loadingError = '';

    from(this.authSessionService.getSession())
      .pipe(
        switchMap((session) => {
          if (!session.authenticated) {
            return from(this.router.navigate(['/auth'])).pipe(
              switchMap(() => EMPTY),
            );
          }

          this.userEmail = session.user?.email ?? this.userEmail;
          this.isAdmin = session.user?.role?.toLowerCase() === 'admin';

          const callbackCode = this.route.snapshot.queryParamMap.get('code');
          const completeOutlookCallback$: Observable<unknown> = callbackCode
            ? from(
                this.dashboardDataService.completeOutlookConnection(
                  callbackCode,
                ),
              ).pipe(
                tap((callbackResult) => {
                  this.connectionMessage = callbackResult.message;
                  this.toastService.success(
                    callbackResult.message,
                    'Outlook Connected',
                  );
                }),
                switchMap(() => from(this.router.navigate(['/dashboard']))),
              )
            : of(null);

          return completeOutlookCallback$.pipe(
            switchMap(() =>
              forkJoin({
                overview: from(this.dashboardDataService.getOverview()),
                rules: from(this.ruleManagementService.listRules()),
              }),
            ),
          );
        }),
        tap(({ overview, rules }) => {
          this.overview = overview;
          this.outlookConnected = overview.connection.connected;
          this.outlookEmail = overview.connection.email;
          this.countdown = overview.connection.nextProcessInSeconds;
          this.rules = rules;
          this.startCountdown();
        }),
        catchError((error) => {
          this.loadingError = this.resolveErrorMessage(error);
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  protected setTab(
    tab: 'overview' | 'rules' | 'analytics' | 'emails' | 'users',
  ): void {
    this.activeTab = tab;
  }

  protected refreshOverview(): void {
    this.isRefreshingActivity = true;

    from(this.dashboardDataService.getOverview(true))
      .pipe(
        tap((overview) => {
          this.overview = overview;
          this.outlookConnected = overview.connection.connected;
          this.outlookEmail = overview.connection.email;
          this.countdown = overview.connection.nextProcessInSeconds;
        }),
        catchError(() => EMPTY),
        finalize(() => {
          this.isRefreshingActivity = false;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected viewEmail(log: EmailAnalyticsLog): void {
    if (!log.outlookMessageId) {
      return;
    }

    this.emailDialogOpen = true;
    this.loadingEmail = true;
    this.emailContent = null;
    this.trustedEmailBody = null;

    from(this.analyticsDataService.getEmailContent(log.outlookMessageId))
      .pipe(
        tap((content) => {
          this.emailContent = content;
          this.trustedEmailBody = content.bodyHtml
            ? this.sanitizer.bypassSecurityTrustHtml(content.bodyHtml)
            : null;
        }),
        catchError(() => EMPTY),
        finalize(() => {
          this.loadingEmail = false;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected toggleRuleForm(): void {
    this.showAddRule = !this.showAddRule;
    if (!this.showAddRule) {
      this.resetRuleForm();
    }
  }

  protected parseSubjectPatternKeywords(value: string): string[] {
    return value
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean);
  }

  protected saveRule(): void {
    const hasSingleRecipient = !!this.newRule.recipient;
    const hasRotationRecipients = this.newRule.recipients.some((recipient) =>
      recipient.email.trim(),
    );
    if (
      !this.newRule.name ||
      (!this.newRule.rotationEnabled && !hasSingleRecipient) ||
      (this.newRule.rotationEnabled && !hasRotationRecipients)
    ) {
      return;
    }

    const ruleToSave: DashboardRuleEditor = this.editingRuleId
      ? { ...this.newRule, id: this.editingRuleId }
      : { ...this.newRule };

    from(this.ruleManagementService.saveRule(ruleToSave))
      .pipe(
        tap((rules) => {
          this.rules = rules;
          this.toastService.success(
            this.editingRuleId
              ? 'Your forwarding rule has been updated.'
              : 'Your forwarding rule has been created.',
            this.editingRuleId ? 'Rule Updated' : 'Rule Added',
          );

          this.resetRuleForm();
          this.showAddRule = false;
        }),
        catchError(() => EMPTY),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected editRule(rule: DashboardRuleEditor): void {
    this.editingRuleId = rule.id;
    Object.assign(this.newRule, {
      ...rule,
      keywords: [...rule.keywords],
      negativeKeywords: [...rule.negativeKeywords],
      recipients: rule.recipients.map((recipient) => ({ ...recipient })),
    });
    this.showAddRule = true;
  }

  protected cancelEdit(): void {
    this.resetRuleForm();
    this.showAddRule = false;
  }

  protected deleteRule(id: string): void {
    from(this.ruleManagementService.deleteRule(id))
      .pipe(
        tap((rules) => {
          this.rules = rules;
          this.toastService.success(
            'Forwarding rule has been removed.',
            'Rule Deleted',
          );
        }),
        catchError(() => EMPTY),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected handleRuleDragStarted(id: string): void {
    this.draggedRuleId = id;
  }

  protected handleRuleDropped(targetId: string): void {
    if (!this.draggedRuleId || this.draggedRuleId === targetId) {
      return;
    }

    const oldIndex = this.rules.findIndex(
      (rule) => rule.id === this.draggedRuleId,
    );
    const newIndex = this.rules.findIndex((rule) => rule.id === targetId);
    if (oldIndex === -1 || newIndex === -1) {
      this.draggedRuleId = null;
      return;
    }

    const reordered = [...this.rules];
    const [movedRule] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, movedRule);
    from(this.ruleManagementService.reorderRules(reordered))
      .pipe(
        tap((rules) => {
          this.rules = rules;
          this.toastService.success(
            'Rule priorities have been updated successfully.',
            'Rules Reordered',
          );
        }),
        catchError(() => EMPTY),
        finalize(() => {
          this.draggedRuleId = null;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected moveRuleUp(id: string): void {
    const index = this.rules.findIndex((rule) => rule.id === id);
    if (index <= 0) {
      return;
    }

    const nextRules = [...this.rules];
    [nextRules[index - 1], nextRules[index]] = [
      nextRules[index],
      nextRules[index - 1],
    ];
    this.updateRuleOrder(nextRules);
  }

  protected moveRuleDown(id: string): void {
    const index = this.rules.findIndex((rule) => rule.id === id);
    if (index === -1 || index >= this.rules.length - 1) {
      return;
    }

    const nextRules = [...this.rules];
    [nextRules[index], nextRules[index + 1]] = [
      nextRules[index + 1],
      nextRules[index],
    ];
    this.updateRuleOrder(nextRules);
  }

  protected toggleRuleActive(id: string): void {
    const targetRule = this.rules.find((rule) => rule.id === id);
    if (!targetRule) {
      return;
    }

    from(
      this.ruleManagementService.saveRule({
        ...targetRule,
        active: !targetRule.active,
      }),
    )
      .pipe(
        tap((rules) => {
          this.rules = rules;
          this.toastService.success(
            targetRule.active
              ? 'Forwarding rule has been paused.'
              : 'Forwarding rule is now active.',
            targetRule.active ? 'Rule Disabled' : 'Rule Enabled',
          );
        }),
        catchError(() => EMPTY),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected signOut(): void {
    this.authSessionService.logout();
    this.toastService.success(
      "You've been successfully logged out.",
      'Logged Out',
    );
    from(this.router.navigate(['/auth']))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  protected connectOutlook(): void {
    this.isConnecting = true;
    this.connectionMessage = '';

    from(this.dashboardDataService.connectOutlook())
      .pipe(
        tap((result) => {
          this.connectionMessage = result.message;
          if (result.authUrl) {
            window.location.href = result.authUrl;
          }
        }),
        catchError(() => EMPTY),
        finalize(() => {
          this.isConnecting = false;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected disconnectOutlook(): void {
    from(this.dashboardDataService.disconnectOutlook())
      .pipe(
        tap((result) => {
          this.outlookConnected = false;
          this.outlookEmail = null;
          this.countdown = 300;
          this.connectionMessage = result.message;
          this.toastService.success(
            'Your Outlook account has been disconnected.',
            'Outlook Disconnected',
          );
        }),
        catchError(() => EMPTY),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected processNow(): void {
    this.isProcessing = true;

    from(this.dashboardDataService.processEmails())
      .pipe(
        tap((result) => {
          this.connectionMessage = result.message;
          this.countdown = 300;
          this.toastService.success(result.message, 'Processing Complete');
        }),
        catchError(() => EMPTY),
        finalize(() => {
          this.isProcessing = false;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected formatCountdown(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private startCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    this.countdownInterval = setInterval(() => {
      if (!this.outlookConnected) {
        return;
      }
      this.countdown = this.countdown <= 1 ? 300 : this.countdown - 1;
    }, 1000);
  }

  private resetRuleForm(): void {
    this.editingRuleId = null;
    Object.assign(this.newRule, this.createEmptyRule());
  }

  private updateRuleOrder(rules: DashboardRuleEditor[]): void {
    from(this.ruleManagementService.reorderRules(rules))
      .pipe(
        tap((nextRules) => {
          this.rules = nextRules;
          this.toastService.success(
            'Rule priorities have been updated successfully.',
            'Rules Reordered',
          );
        }),
        catchError(() => EMPTY),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private resolveErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    return 'Dashboard data could not be loaded.';
  }

  private createEmptyRule(): DashboardRuleEditor {
    return {
      id: '',
      name: '',
      keywords: [],
      negativeKeywords: [],
      recipient: '',
      recipients: [],
      conditions: '',
      active: true,
      priority: 0,
      senderPattern: '',
      subjectPattern: '',
      aiEnabled: true,
      aiContext: '',
      extractAttachments: false,
      rotationEnabled: false,
      smartThreadEnabled: true,
    };
  }
}
