import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthSessionService } from '../../core/services/auth-session.service';
import { DashboardOverview } from '../../core/models/dashboard.models';
import { AnalyticsDataService } from '../../core/services/analytics-data.service';
import { DashboardDataService } from '../../core/services/dashboard-data.service';
import { RuleManagementService } from '../../core/services/rule-management.service';
import { EmailAnalyticsTableComponent } from '../../shared/components/email-analytics-table/email-analytics-table.component';
import { KeywordInputComponent } from '../../shared/components/keyword-input/keyword-input.component';
import { Recipient, RecipientManagerComponent } from '../../shared/components/recipient-manager/recipient-manager.component';
import { ReplyAnalyticsComponent } from '../../shared/components/reply-analytics/reply-analytics.component';
import { RuleTesterComponent } from '../../shared/components/rule-tester/rule-tester.component';
import { RulePerformanceComponent } from '../../shared/components/rule-performance/rule-performance.component';
import {
  SortableDashboardRule,
  SortableRuleItemComponent
} from '../../shared/components/sortable-rule-item/sortable-rule-item.component';
import { UnreadEmailsComponent } from '../../shared/components/unread-emails/unread-emails.component';
import { UserManagementComponent } from '../../shared/components/user-management/user-management.component';

type DashboardRuleEditor = SortableDashboardRule;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    KeywordInputComponent,
    RecipientManagerComponent,
    RuleTesterComponent,
    EmailAnalyticsTableComponent,
    ReplyAnalyticsComponent,
    RulePerformanceComponent,
    SortableRuleItemComponent,
    UnreadEmailsComponent,
    UserManagementComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  protected loading = true;
  protected activeTab: 'overview' | 'rules' | 'analytics' | 'emails' | 'users' = 'overview';
  protected countdown = 300;
  protected overview: DashboardOverview | null = null;
  protected userEmail = 'frontend@test.local';
  protected isAdmin = false;
  protected connectionMessage = '';
  protected outlookConnected = false;
  protected outlookEmail: string | null = null;
  protected isConnecting = false;
  protected isProcessing = false;
  protected rules: DashboardRuleEditor[] = [];
  protected showAddRule = false;
  protected editingRuleId: string | null = null;
  protected readonly newRule: DashboardRuleEditor = this.createEmptyRule();
  protected draggedRuleId: string | null = null;

  private countdownInterval?: ReturnType<typeof setInterval>;

  constructor(
    private readonly authSessionService: AuthSessionService,
    private readonly analyticsDataService: AnalyticsDataService,
    private readonly dashboardDataService: DashboardDataService,
    private readonly ruleManagementService: RuleManagementService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    const session = await this.authSessionService.getSession();
    if (!session.authenticated) {
      await this.router.navigate(['/auth']);
      return;
    }

    this.userEmail = session.user?.email ?? this.userEmail;
    this.isAdmin = session.user?.role?.toLowerCase() === 'admin';

    const callbackCode = this.route.snapshot.queryParamMap.get('code');
    if (callbackCode) {
      const callbackResult = await this.dashboardDataService.completeOutlookConnection(callbackCode);
      this.connectionMessage = callbackResult.message;
      await this.router.navigate(['/dashboard']);
    }

    const overview = await this.dashboardDataService.getOverview();
    this.overview = overview;
    this.outlookConnected = overview.connection.connected;
    this.outlookEmail = overview.connection.email;
    this.countdown = overview.connection.nextProcessInSeconds;
    this.rules = await this.ruleManagementService.listRules();
    this.startCountdown();
    this.loading = false;
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  protected setTab(tab: 'overview' | 'rules' | 'analytics' | 'emails' | 'users'): void {
    this.activeTab = tab;
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

  protected async saveRule(): Promise<void> {
    const hasSingleRecipient = !!this.newRule.recipient;
    const hasRotationRecipients = this.newRule.recipients.some((recipient) => recipient.email.trim());
    if (!this.newRule.name || (!this.newRule.rotationEnabled && !hasSingleRecipient) || (this.newRule.rotationEnabled && !hasRotationRecipients)) {
      return;
    }

    const ruleToSave: DashboardRuleEditor = this.editingRuleId
      ? { ...this.newRule, id: this.editingRuleId }
      : { ...this.newRule };

    this.rules = await this.ruleManagementService.saveRule(ruleToSave);

    this.resetRuleForm();
    this.showAddRule = false;
  }

  protected editRule(rule: DashboardRuleEditor): void {
    this.editingRuleId = rule.id;
    Object.assign(this.newRule, {
      ...rule,
      keywords: [...rule.keywords],
      negativeKeywords: [...rule.negativeKeywords],
      recipients: rule.recipients.map((recipient) => ({ ...recipient }))
    });
    this.showAddRule = true;
  }

  protected cancelEdit(): void {
    this.resetRuleForm();
    this.showAddRule = false;
  }

  protected async deleteRule(id: string): Promise<void> {
    this.rules = await this.ruleManagementService.deleteRule(id);
  }

  protected handleRuleDragStarted(id: string): void {
    this.draggedRuleId = id;
  }

  protected async handleRuleDropped(targetId: string): Promise<void> {
    if (!this.draggedRuleId || this.draggedRuleId === targetId) {
      return;
    }

    const oldIndex = this.rules.findIndex((rule) => rule.id === this.draggedRuleId);
    const newIndex = this.rules.findIndex((rule) => rule.id === targetId);
    if (oldIndex === -1 || newIndex === -1) {
      this.draggedRuleId = null;
      return;
    }

    const reordered = [...this.rules];
    const [movedRule] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, movedRule);
    this.rules = await this.ruleManagementService.reorderRules(reordered);
    this.draggedRuleId = null;
  }

  protected async moveRuleUp(id: string): Promise<void> {
    const index = this.rules.findIndex((rule) => rule.id === id);
    if (index <= 0) {
      return;
    }

    const nextRules = [...this.rules];
    [nextRules[index - 1], nextRules[index]] = [nextRules[index], nextRules[index - 1]];
    this.rules = await this.ruleManagementService.reorderRules(nextRules);
  }

  protected async moveRuleDown(id: string): Promise<void> {
    const index = this.rules.findIndex((rule) => rule.id === id);
    if (index === -1 || index >= this.rules.length - 1) {
      return;
    }

    const nextRules = [...this.rules];
    [nextRules[index], nextRules[index + 1]] = [nextRules[index + 1], nextRules[index]];
    this.rules = await this.ruleManagementService.reorderRules(nextRules);
  }

  protected async toggleRuleActive(id: string): Promise<void> {
    const targetRule = this.rules.find((rule) => rule.id === id);
    if (!targetRule) {
      return;
    }

    this.rules = await this.ruleManagementService.saveRule({
      ...targetRule,
      active: !targetRule.active
    });
  }

  protected async signOut(): Promise<void> {
    this.authSessionService.logout();
    await this.router.navigate(['/auth']);
  }

  protected async connectOutlook(): Promise<void> {
    this.isConnecting = true;
    this.connectionMessage = '';
    try {
      const result = await this.dashboardDataService.connectOutlook();
      this.connectionMessage = result.message;
      if (result.authUrl) {
        window.location.href = result.authUrl;
        return;
      }
    } finally {
      this.isConnecting = false;
    }
  }

  protected async disconnectOutlook(): Promise<void> {
    const result = await this.dashboardDataService.disconnectOutlook();
    this.outlookConnected = false;
    this.outlookEmail = null;
    this.countdown = 300;
    this.connectionMessage = result.message;
  }

  protected async processNow(): Promise<void> {
    this.isProcessing = true;
    try {
      const result = await this.dashboardDataService.processEmails();
      this.connectionMessage = result.message;
      this.countdown = 300;
    } finally {
      this.isProcessing = false;
    }
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
      smartThreadEnabled: true
    };
  }
}
