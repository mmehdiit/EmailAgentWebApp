import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
    DashboardConnectionStatus,
    DashboardOverview,
    DashboardProcessResult,
    OutlookConnectResult,
} from '../models/dashboard.models';
import { AnalyticsDataService } from './analytics-data.service';
import { DashboardApiService } from './dashboard-api.service';
import { RuleManagementService } from './rule-management.service';

@Injectable({
    providedIn: 'root',
})
export class DashboardDataService {
    constructor(
        private readonly dashboardApiService: DashboardApiService,
        private readonly analyticsDataService: AnalyticsDataService,
        private readonly ruleManagementService: RuleManagementService
    ) { }

    async getOverview(forceRefresh = false): Promise<DashboardOverview> {
        const [analytics, rules, connection] = await Promise.all([
            this.analyticsDataService.getAnalytics(forceRefresh),
            this.ruleManagementService.listRules(),
            this.getConnectionStatus()
        ]);

        const totalProcessed = analytics.logs.length;
        const forwardedToday = analytics.logs.filter((log) => {
            if (!log.processedAt) {
                return false;
            }

            const processed = new Date(log.processedAt);
            const today = new Date();
            return processed.toDateString() === today.toDateString() && log.status === 'forwarded';
        }).length;

        return {
            stats: {
                totalProcessed,
                forwardedToday,
                successRate: totalProcessed === 0 ? 0 : Math.round((analytics.summary.forwarded / totalProcessed) * 100)
            },
            connection,
            recentLogs: analytics.logs.slice(0, 3).map((log) => ({
                id: log.id,
                emailFrom: log.from,
                emailSubject: log.subject,
                status: log.replyDetected ? 'replied' : (log.status as 'forwarded' | 'no_match' | 'failed' | 'replied'),
                aiClassified: log.aiClassified,
                replyDetected: log.replyDetected
            })),
            rules: rules.map((rule) => ({
                id: rule.id,
                name: rule.name,
                keywords: rule.keywords,
                active: rule.active,
                priority: rule.priority
            }))
        };
    }

    async getConnectionStatus(): Promise<DashboardConnectionStatus> {
        const connection = await firstValueFrom(this.dashboardApiService.getConnectionStatus());
        return {
            connected: connection.connected,
            email: connection.email ?? null,
            nextProcessInSeconds: 300
        };
    }

    async connectOutlook(): Promise<OutlookConnectResult> {
        const redirectUri = `${window.location.origin}/email-agent/dashboard`;
        const response = await firstValueFrom(
            this.dashboardApiService.getOutlookAuthUrl(window.location.origin + '/email-agent', redirectUri)
        );

        return {
            success: true,
            email: null,
            authUrl: response.authUrl,
            message: 'Redirecting to Outlook for authorization.'
        };
    }

    async completeOutlookConnection(code: string): Promise<OutlookConnectResult> {
        const redirectUri = `${window.location.origin}/email-agent/dashboard`;
        const response = await firstValueFrom(
            this.dashboardApiService.completeOutlookConnection({
                code,
                frontendOrigin: window.location.origin + '/email-agent',
                redirectUri
            })
        );

        return {
            success: response.success,
            email: response.email,
            message: `Connected ${response.email} to Outlook.`
        };
    }

    async disconnectOutlook(): Promise<DashboardProcessResult> {
        const response = await firstValueFrom(this.dashboardApiService.disconnectOutlook());
        return {
            success: response.success,
            message: response.message ?? 'Outlook disconnected successfully.'
        };
    }

    async processEmails(): Promise<DashboardProcessResult> {
        const response = await firstValueFrom(this.dashboardApiService.processEmails()) as DashboardProcessResult & {
            processed?: number;
            forwarded?: number;
        };

        const message =
            response.message ??
            `Processed ${response.processed ?? 0} emails and forwarded ${response.forwarded ?? 0}.`;

        return {
            success: response.success ?? true,
            message
        };
    }
}
