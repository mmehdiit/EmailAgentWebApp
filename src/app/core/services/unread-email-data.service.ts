import { Injectable } from '@angular/core';
import { Observable, firstValueFrom, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

import { UnreadEmailOverview } from '../models/dashboard.models';
import { RuleManagementService } from './rule-management.service';
import { UnreadEmailApiService } from './unread-email-api.service';

@Injectable({
  providedIn: 'root'
})
export class UnreadEmailDataService {
  constructor(
    private readonly unreadEmailApiService: UnreadEmailApiService,
    private readonly ruleManagementService: RuleManagementService
  ) {}

  getUnreadEmailsOverview(): Observable<UnreadEmailOverview> {
    return forkJoin({
      emails: this.unreadEmailApiService.getUnreadEmails(),
      rules: this.ruleManagementService.listRules()
    }).pipe(
      map(({ emails, rules }) => {
        const activeRules = rules
          .filter((rule) => rule.active)
          .map((rule) => ({
            id: rule.id,
            name: rule.name,
            recipientEmail: rule.recipient,
            active: rule.active
          }));

        return {
          emails: emails.map((email) => ({
            id: email.id,
            subject: email.subject,
            from: email.from,
            fromName: email.fromName,
            receivedAt: email.receivedDateTime,
            preview: email.bodyPreview,
            isRead: false,
            matchesRule: false,
            matchedRuleName: null,
            aiClassified: false,
            aiConfidence: null,
            aiReasoning: null
          })),
          rules: activeRules
        };
      })
    );
  }

  async getUnreadEmails(): Promise<UnreadEmailOverview> {
    return firstValueFrom(this.getUnreadEmailsOverview());
  }

  async markAsRead(emailId: string): Promise<void> {
    await firstValueFrom(this.unreadEmailApiService.markAsRead(emailId));
  }

  async assignEmail(emailId: string, ruleId: string): Promise<void> {
    await firstValueFrom(this.unreadEmailApiService.manualAssign(emailId, ruleId));
  }
}
