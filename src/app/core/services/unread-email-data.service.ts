import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { UnreadEmailOverview } from '../models/dashboard.models';
import { RuleManagementApiService } from './rule-management-api.service';
import { UnreadEmailApiService } from './unread-email-api.service';

@Injectable({
  providedIn: 'root'
})
export class UnreadEmailDataService {
  constructor(
    private readonly unreadEmailApiService: UnreadEmailApiService,
    private readonly ruleManagementApiService: RuleManagementApiService
  ) {}

  async getUnreadEmails(): Promise<UnreadEmailOverview> {
    const [emails, rules] = await Promise.all([
      firstValueFrom(this.unreadEmailApiService.getUnreadEmails()),
      firstValueFrom(this.ruleManagementApiService.listRules())
    ]);

    const activeRules = rules
      .filter((rule) => rule.active)
      .map((rule) => ({
        id: rule.id,
        name: rule.name,
        recipientEmail: rule.recipient_email,
        active: rule.active
      }));

    const classifiedEmails = await Promise.all(
      emails.map(async (email) => {
        const classification = await firstValueFrom(
          this.unreadEmailApiService.classifyEmail({
            subject: email.subject,
            body: email.body_preview,
            sender: email.from
          })
        );

        const hasMatch = !!classification.matched_rule_id;

        return {
          id: email.id,
          subject: email.subject,
          from: email.from,
          fromName: email.from_name,
          receivedAt: email.received_date_time,
          preview: email.body_preview,
          isRead: false,
          matchesRule: hasMatch,
          matchedRuleName: hasMatch ? classification.matched_rule_name : null,
          aiClassified: hasMatch && classification.confidence > 0,
          aiConfidence: hasMatch ? classification.confidence : null,
          aiReasoning: classification.reasoning || null
        };
      })
    );

    return {
      emails: classifiedEmails,
      rules: activeRules
    };
  }

  async markAsRead(emailId: string): Promise<void> {
    await firstValueFrom(this.unreadEmailApiService.markAsRead(emailId));
  }

  async assignEmail(emailId: string, ruleId: string): Promise<void> {
    await firstValueFrom(this.unreadEmailApiService.manualAssign(emailId, ruleId));
  }
}
