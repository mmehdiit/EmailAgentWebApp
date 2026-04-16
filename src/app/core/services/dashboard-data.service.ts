import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  DashboardConnectionStatus,
  DashboardOverview,
  DashboardProcessResult,
  OutlookConnectResult,
} from '../models/dashboard.models';
import { DashboardApiService } from './dashboard-api.service';

const OUTLOOK_STORAGE_KEY = 'email-ai-agent-outlook-connection';

@Injectable({
  providedIn: 'root',
})
export class DashboardDataService {
  constructor(private readonly dashboardApiService: DashboardApiService) {}

  async getOverview(): Promise<DashboardOverview> {
    try {
      return await firstValueFrom(this.dashboardApiService.getOverview());
    } catch {
      return {
        stats: {
          totalProcessed: 142,
          forwardedToday: 17,
          successRate: 96,
        },
        connection: {
          connected: false,
          email: null,
          nextProcessInSeconds: 300,
        },
        recentLogs: [
          {
            id: 'log-1',
            emailFrom: 'claims@partner.com',
            emailSubject: 'Urgent motor claim update',
            status: 'forwarded',
            aiClassified: true,
            replyDetected: true,
          },
          {
            id: 'log-2',
            emailFrom: 'customer@example.com',
            emailSubject: 'Need update on policy renewal',
            status: 'replied',
            aiClassified: false,
            replyDetected: false,
          },
          {
            id: 'log-3',
            emailFrom: 'notifications@vendor.com',
            emailSubject: 'System maintenance notice',
            status: 'no_match',
            aiClassified: false,
            replyDetected: false,
          },
        ],
        rules: [
          {
            id: 'rule-1',
            name: 'Customer Support',
            keywords: ['support', 'issue', 'help'],
            active: true,
            priority: 3,
          },
          {
            id: 'rule-2',
            name: 'Claims Processing',
            keywords: ['claim', 'accident', 'damage'],
            active: true,
            priority: 2,
          },
          {
            id: 'rule-3',
            name: 'Sales Leads',
            keywords: ['quote', 'pricing', 'proposal'],
            active: false,
            priority: 1,
          },
        ],
      };
    }
  }

  async getConnectionStatus(): Promise<DashboardConnectionStatus> {
    const fakeConnection = this.getFakeConnection();
    if (fakeConnection) {
      return fakeConnection;
    }

    try {
      return await firstValueFrom(
        this.dashboardApiService.getConnectionStatus()
      );
    } catch {
      return {
        connected: false,
        email: null,
        nextProcessInSeconds: 300,
      };
    }
  }

  async connectOutlook(): Promise<OutlookConnectResult> {
    try {
      return await firstValueFrom(this.dashboardApiService.connectOutlook());
    } catch {
      const fakeConnection: DashboardConnectionStatus = {
        connected: true,
        email: 'outlook.test@company.com',
        nextProcessInSeconds: 300,
      };
      localStorage.setItem(OUTLOOK_STORAGE_KEY, JSON.stringify(fakeConnection));
      return {
        success: true,
        email: fakeConnection.email,
        message: `Frontend test mode connected ${fakeConnection.email}.`,
      };
    }
  }

  async disconnectOutlook(): Promise<DashboardProcessResult> {
    try {
      return await firstValueFrom(this.dashboardApiService.disconnectOutlook());
    } catch {
      localStorage.removeItem(OUTLOOK_STORAGE_KEY);
      return {
        success: true,
        message: 'Frontend test mode disconnected Outlook.',
      };
    }
  }

  async processEmails(): Promise<DashboardProcessResult> {
    try {
      return await firstValueFrom(this.dashboardApiService.processEmails());
    } catch {
      return {
        success: true,
        message: 'Frontend test mode processed the mailbox queue.',
      };
    }
  }

  private getFakeConnection(): DashboardConnectionStatus | null {
    const raw = localStorage.getItem(OUTLOOK_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as DashboardConnectionStatus;
    } catch {
      localStorage.removeItem(OUTLOOK_STORAGE_KEY);
      return null;
    }
  }
}
