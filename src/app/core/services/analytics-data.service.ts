import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  DashboardAnalytics,
  EmailAnalyticsLog,
  ReplyAnalyticsStats,
  RulePerformanceStat
} from '../models/dashboard.models';
import { AnalyticsApiService } from './analytics-api.service';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsDataService {
  constructor(private readonly analyticsApiService: AnalyticsApiService) {}

  async getAnalytics(): Promise<DashboardAnalytics> {
    try {
      return await firstValueFrom(this.analyticsApiService.getAnalytics());
    } catch {
      const logs: EmailAnalyticsLog[] = [
        {
          id: 'analytics-log-1',
          date: 'Apr 16, 09:12',
          from: 'claims@partner.com',
          subject: 'Urgent motor claim update',
          status: 'forwarded',
          ruleName: 'Claims Processing',
          forwardedTo: 'claims.team@example.com',
          replyDetected: true,
          replySource: 'Sent',
          responseTime: '2h 14m',
          aiClassified: true,
          aiConfidence: 0.91
        },
        {
          id: 'analytics-log-2',
          date: 'Apr 16, 08:40',
          from: 'customer@example.com',
          subject: 'Need update on policy renewal',
          status: 'replied',
          ruleName: 'Customer Support',
          forwardedTo: 'support@example.com',
          replyDetected: true,
          replySource: 'Manual',
          responseTime: '38m',
          aiClassified: false,
          aiConfidence: null
        },
        {
          id: 'analytics-log-3',
          date: 'Apr 15, 17:26',
          from: 'garage@vendor.com',
          subject: 'Repair estimate attached',
          status: 'forwarded',
          ruleName: 'Claims Processing',
          forwardedTo: 'motor.claims@example.com',
          replyDetected: false,
          replySource: null,
          responseTime: null,
          aiClassified: true,
          aiConfidence: 0.84
        },
        {
          id: 'analytics-log-4',
          date: 'Apr 15, 15:04',
          from: 'notifications@vendor.com',
          subject: 'System maintenance notice',
          status: 'no_match',
          ruleName: null,
          forwardedTo: null,
          replyDetected: false,
          replySource: null,
          responseTime: null,
          aiClassified: false,
          aiConfidence: null
        },
        {
          id: 'analytics-log-5',
          date: 'Apr 15, 11:58',
          from: 'broker@agency.com',
          subject: 'Incomplete submission package',
          status: 'failed',
          ruleName: 'Underwriting Review',
          forwardedTo: 'uw@example.com',
          replyDetected: false,
          replySource: null,
          responseTime: null,
          aiClassified: true,
          aiConfidence: 0.73
        }
      ];

      const replyStats: ReplyAnalyticsStats = {
        totalForwarded: 31,
        replied: 19,
        pending: 12,
        replyRate: 61,
        avgResponseTimeHours: 2.4
      };

      const rulePerformance: RulePerformanceStat[] = [
        {
          ruleId: 'rule-claims',
          ruleName: 'Claims Processing',
          totalMatched: 18,
          forwarded: 17,
          failed: 1,
          successRate: 94,
          lastMatched: '2026-04-16T09:12:00Z'
        },
        {
          ruleId: 'rule-support',
          ruleName: 'Customer Support',
          totalMatched: 11,
          forwarded: 10,
          failed: 1,
          successRate: 91,
          lastMatched: '2026-04-16T08:40:00Z'
        },
        {
          ruleId: 'rule-underwriting',
          ruleName: 'Underwriting Review',
          totalMatched: 6,
          forwarded: 4,
          failed: 2,
          successRate: 67,
          lastMatched: '2026-04-15T11:58:00Z'
        }
      ];

      return {
        summary: {
          total: 54,
          forwarded: 31,
          replied: 19,
          pending: 12,
          noMatch: 8,
          failed: 3,
          aiClassified: 27,
          avgResponseTime: '2h 24m'
        },
        logs,
        replyStats,
        rulePerformance
      };
    }
  }
}
