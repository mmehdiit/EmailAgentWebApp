import { Injectable } from '@angular/core';
import { Observable, firstValueFrom, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { UnprocessedEmail, UnreadEmailOverview } from '../models/dashboard.models';
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

  classifyEmail(email: UnprocessedEmail): Observable<UnprocessedEmail> {
    return this.unreadEmailApiService.classifyEmail({
      subject: email.subject,
      body: email.preview,
      sender: email.from
    }).pipe(
      map((classification) => {
        const hasMatch = !!classification?.matched_rule_id;

        return {
          ...email,
          matchesRule: hasMatch,
          matchedRuleName: hasMatch ? classification?.matched_rule_name ?? null : null,
          aiClassified: hasMatch && (classification?.confidence ?? 0) > 0,
          aiConfidence: hasMatch ? classification?.confidence ?? null : null,
          aiReasoning: classification?.reasoning || null
        };
      }),
      catchError(() => of(email))
    );
  }

  async getUnreadEmails(): Promise<UnreadEmailOverview> {
    const overview = await firstValueFrom(this.getUnreadEmailsOverview());
    const classifiedEmails = await Promise.all(
      overview.emails.map((email) => firstValueFrom(this.classifyEmail(email)))
    );

    return { ...overview, emails: classifiedEmails };
  }

  async markAsRead(emailId: string): Promise<void> {
    await firstValueFrom(this.unreadEmailApiService.markAsRead(emailId));
  }

  async assignEmail(emailId: string, ruleId: string): Promise<void> {
    await firstValueFrom(this.unreadEmailApiService.manualAssign(emailId, ruleId));
  }
}
