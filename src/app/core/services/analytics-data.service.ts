import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  DashboardAnalytics,
  EmailAnalyticsLog,
  EmailContent,
  RuleItem,
  ReplyAnalyticsStats,
  RulePerformanceStat
} from '../models/dashboard.models';
import { AnalyticsApiService } from './analytics-api.service';
import { RuleManagementApiService } from './rule-management-api.service';
import { UnreadEmailApiService } from './unread-email-api.service';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsDataService {
  constructor(
    private readonly analyticsApiService: AnalyticsApiService,
    private readonly ruleManagementApiService: RuleManagementApiService,
    private readonly unreadEmailApiService: UnreadEmailApiService
  ) {}

  async getAnalytics(): Promise<DashboardAnalytics> {
    const [logs, rules] = await Promise.all([
      firstValueFrom(this.analyticsApiService.getLogs()),
      firstValueFrom(this.ruleManagementApiService.listRules())
    ]);

    const ruleMap = new Map(rules.map((rule) => [rule.id, rule.name]));
    const mappedLogs = logs.map<EmailAnalyticsLog>((log) => ({
      id: log.id,
      date: this.formatDisplayDate(log.received_at ?? log.processed_at),
      from: log.email_from ?? '',
      subject: log.email_subject ?? '',
      status: log.status,
      ruleName: log.rule_matched ? (ruleMap.get(log.rule_matched) ?? null) : null,
      forwardedTo: log.forwarded_to,
      replyDetected: log.reply_detected,
      aiClassified: log.ai_classified,
      aiConfidence: log.ai_confidence,
      outlookMessageId: log.outlook_message_id,
      replySource: log.reply_source,
      processedAt: log.processed_at,
      repliedAt: log.replied_at,
      receivedAt: log.received_at
    }));

    return {
      summary: this.buildSummary(mappedLogs),
      logs: mappedLogs,
      replyStats: this.buildReplyStats(mappedLogs),
      rulePerformance: this.buildRulePerformance(mappedLogs)
    };
  }

  async listAvailableRules(): Promise<RuleItem[]> {
    const rules = await firstValueFrom(this.ruleManagementApiService.listRules());
    return rules
      .filter((rule) => rule.active)
      .map((rule) => ({ id: rule.id, name: rule.name }));
  }

  async checkReplies(): Promise<void> {
    await firstValueFrom(this.analyticsApiService.checkReplies());
  }

  async retryFailedEmails(): Promise<void> {
    await firstValueFrom(this.unreadEmailApiService.retryFailedEmails());
  }

  async getEmailContent(messageId: string): Promise<EmailContent> {
    const content = await firstValueFrom(this.unreadEmailApiService.getEmailContent(messageId));

    return {
      subject: content.subject,
      from: content.from,
      receivedAt: content.received_date_time,
      bodyHtml: content.html_body,
      bodyText: content.body
    };
  }

  async markAsReplied(emailLogId: string): Promise<void> {
    await firstValueFrom(this.analyticsApiService.markReplyManual(emailLogId));
  }

  async assignToRule(emailId: string, ruleId: string): Promise<void> {
    await firstValueFrom(this.unreadEmailApiService.manualAssign(emailId, ruleId));
  }

  private buildSummary(logs: EmailAnalyticsLog[]): DashboardAnalytics['summary'] {
    const repliedLogs = logs.filter((log) => log.replyDetected && log.repliedAt && log.processedAt);
    const avgResponseMinutes =
      repliedLogs.length > 0
        ? Math.round(
            repliedLogs.reduce((total, log) => {
              const start = new Date(log.processedAt as string).getTime();
              const end = new Date(log.repliedAt as string).getTime();
              return Number.isNaN(start) || Number.isNaN(end) || end < start
                ? total
                : total + Math.floor((end - start) / 60000);
            }, 0) / repliedLogs.length
          )
        : null;

    return {
      total: logs.length,
      forwarded: logs.filter((log) => log.status === 'forwarded').length,
      replied: logs.filter((log) => log.replyDetected).length,
      pending: logs.filter((log) => log.status === 'forwarded' && !log.replyDetected).length,
      noMatch: logs.filter((log) => log.status === 'no_match').length,
      failed: logs.filter((log) => log.status === 'failed').length,
      aiClassified: logs.filter((log) => log.aiClassified).length,
      avgResponseTime: avgResponseMinutes === null ? '-' : this.formatDuration(avgResponseMinutes)
    };
  }

  private buildReplyStats(logs: EmailAnalyticsLog[]): ReplyAnalyticsStats {
    const totalForwarded = logs.filter((log) => log.status === 'forwarded').length;
    const repliedLogs = logs.filter((log) => log.replyDetected && log.repliedAt && log.processedAt);
    const replied = logs.filter((log) => log.replyDetected).length;
    const pending = Math.max(totalForwarded - replied, 0);
    const avgResponseTimeHours =
      repliedLogs.length > 0
        ? Number(
            (
              repliedLogs.reduce((total, log) => {
                const start = new Date(log.processedAt as string).getTime();
                const end = new Date(log.repliedAt as string).getTime();
                return Number.isNaN(start) || Number.isNaN(end) || end < start
                  ? total
                  : total + (end - start) / 3600000;
              }, 0) / repliedLogs.length
            ).toFixed(1)
          )
        : null;

    return {
      totalForwarded,
      replied,
      pending,
      replyRate: totalForwarded === 0 ? 0 : Math.round((replied / totalForwarded) * 100),
      avgResponseTimeHours
    };
  }

  private buildRulePerformance(logs: EmailAnalyticsLog[]): RulePerformanceStat[] {
    const grouped = new Map<string, EmailAnalyticsLog[]>();

    for (const log of logs) {
      if (!log.ruleName) {
        continue;
      }

      const group = grouped.get(log.ruleName) ?? [];
      group.push(log);
      grouped.set(log.ruleName, group);
    }

    return Array.from(grouped.entries())
      .map(([ruleName, ruleLogs]) => {
        const successful = ruleLogs.filter((log) => log.status === 'forwarded').length;
        const failed = ruleLogs.filter((log) => log.status === 'failed').length;
        const lastMatched = ruleLogs
          .map((log) => log.receivedAt ?? log.processedAt ?? null)
          .filter((value): value is string => !!value)
          .sort()
          .at(-1) ?? null;

        return {
          ruleId: ruleLogs.find((log) => log.ruleName === ruleName)?.id ?? ruleName,
          ruleName,
          totalMatched: ruleLogs.length,
          forwarded: successful,
          failed,
          successRate: ruleLogs.length === 0 ? 0 : Math.round((successful / ruleLogs.length) * 100),
          lastMatched
        };
      })
      .sort((left, right) => right.totalMatched - left.totalMatched);
  }

  private formatDisplayDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  }

  private formatDuration(totalMinutes: number): string {
    if (totalMinutes < 60) {
      return `${totalMinutes}m`;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
  }
}
