import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { UnreadEmailOverview } from '../models/dashboard.models';
import { UnreadEmailApiService } from './unread-email-api.service';

@Injectable({
  providedIn: 'root'
})
export class UnreadEmailDataService {
  constructor(private readonly unreadEmailApiService: UnreadEmailApiService) {}

  async getUnreadEmails(): Promise<UnreadEmailOverview> {
    try {
      return await firstValueFrom(this.unreadEmailApiService.getUnreadEmails());
    } catch {
      return {
        rules: [
          {
            id: 'rule-claims',
            name: 'Claims Processing',
            recipientEmail: 'claims.team@example.com',
            active: true
          },
          {
            id: 'rule-support',
            name: 'Customer Support',
            recipientEmail: 'support@example.com',
            active: true
          },
          {
            id: 'rule-underwriting',
            name: 'Underwriting Review',
            recipientEmail: 'uw@example.com',
            active: true
          }
        ],
        emails: [
          {
            id: 'email-1',
            subject: 'Urgent accident report attached',
            from: 'claims@broker.com',
            fromName: 'Broker Desk',
            receivedAt: '2026-04-16T08:35:00Z',
            preview: 'Please review the attached report and route this claim to the responsible team.',
            isRead: false,
            matchesRule: true,
            matchedRuleName: 'Claims Processing',
            aiClassified: true,
            aiConfidence: 0.89
          },
          {
            id: 'email-2',
            subject: 'Policy endorsement question',
            from: 'client@example.com',
            fromName: 'Maya Saab',
            receivedAt: '2026-04-16T07:40:00Z',
            preview: 'I need help understanding the latest endorsement wording on my renewal documents.',
            isRead: false,
            matchesRule: true,
            matchedRuleName: 'Customer Support',
            aiClassified: false,
            aiConfidence: null
          },
          {
            id: 'email-3',
            subject: 'Unclear submission package',
            from: 'agency@partner.com',
            fromName: 'Agency Team',
            receivedAt: '2026-04-15T13:05:00Z',
            preview: 'The attached files do not clearly map to an existing workflow. Please review manually.',
            isRead: false,
            matchesRule: false,
            matchedRuleName: null,
            aiClassified: false,
            aiConfidence: null
          }
        ]
      };
    }
  }
}
