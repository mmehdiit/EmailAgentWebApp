import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Recipient } from '../../shared/components/recipient-manager/recipient-manager.component';
import { SortableDashboardRule } from '../../shared/components/sortable-rule-item/sortable-rule-item.component';
import { RuleManagementApiService } from './rule-management-api.service';

@Injectable({
  providedIn: 'root'
})
export class RuleManagementService {
  constructor(private readonly ruleManagementApiService: RuleManagementApiService) {}

  async listRules(): Promise<SortableDashboardRule[]> {
    const rules = await firstValueFrom(this.ruleManagementApiService.listRules());

    return await Promise.all(
      rules.map(async (rule) => {
        const recipients = rule.rotation_enabled
          ? await firstValueFrom(this.ruleManagementApiService.listRecipients(rule.id))
          : [];

        return {
          id: rule.id,
          name: rule.name,
          keywords: rule.keywords ?? [],
          negativeKeywords: rule.negative_keywords ?? [],
          recipient: rule.recipient_email ?? '',
          recipients: recipients.map((recipient) => this.mapRecipient(recipient)),
          conditions: rule.conditions ?? '',
          active: rule.active,
          priority: rule.priority,
          senderPattern: rule.sender_pattern ?? '',
          subjectPattern: rule.subject_pattern ?? '',
          aiEnabled: rule.ai_enabled,
          aiContext: rule.ai_context ?? '',
          extractAttachments: rule.extract_attachments,
          rotationEnabled: rule.rotation_enabled,
          smartThreadEnabled: rule.smart_thread_enabled
        };
      })
    );
  }

  async saveRule(rule: SortableDashboardRule): Promise<SortableDashboardRule[]> {
    const payload = this.toRulePayload(rule);
    const savedRule = rule.id
      ? await firstValueFrom(this.ruleManagementApiService.updateRule(rule.id, payload))
      : await firstValueFrom(this.ruleManagementApiService.createRule(payload));

    await firstValueFrom(
      this.ruleManagementApiService.syncRecipients(savedRule.id, this.toRecipientPayload(rule.recipients))
    );

    return await this.listRules();
  }

  async deleteRule(ruleId: string): Promise<SortableDashboardRule[]> {
    await firstValueFrom(this.ruleManagementApiService.deleteRule(ruleId));
    return await this.listRules();
  }

  async reorderRules(rules: SortableDashboardRule[]): Promise<SortableDashboardRule[]> {
    const normalizedRules = this.withRecalculatedPriorities(rules);
    const orderedIds = normalizedRules
      .slice()
      .sort((left, right) => right.priority - left.priority)
      .map((rule) => rule.id)
      .filter(Boolean);

    await firstValueFrom(this.ruleManagementApiService.reorderRules(orderedIds));
    return await this.listRules();
  }

  private withRecalculatedPriorities(rules: SortableDashboardRule[]): SortableDashboardRule[] {
    const highestPriority = rules.length;
    return rules.map((rule, index) => ({
      ...rule,
      priority: highestPriority - index
    }));
  }

  private toRulePayload(rule: SortableDashboardRule): {
    name: string;
    keywords: string[];
    negative_keywords: string[];
    recipient_email: string;
    conditions: string;
    active: boolean;
    priority: number;
    sender_pattern: string;
    subject_pattern: string;
    ai_enabled: boolean;
    ai_context: string;
    rotation_enabled: boolean;
    smart_thread_enabled: boolean;
    extract_attachments: boolean;
  } {
    const fallbackRecipient = rule.recipients.find((recipient) => recipient.email.trim())?.email.trim() ?? '';

    return {
      name: rule.name.trim(),
      keywords: rule.keywords,
      negative_keywords: rule.negativeKeywords,
      recipient_email: (rule.recipient || fallbackRecipient).trim(),
      conditions: rule.conditions,
      active: rule.active,
      priority: rule.priority,
      sender_pattern: rule.senderPattern,
      subject_pattern: rule.subjectPattern,
      ai_enabled: rule.aiEnabled,
      ai_context: rule.aiContext,
      rotation_enabled: rule.rotationEnabled,
      smart_thread_enabled: rule.smartThreadEnabled,
      extract_attachments: rule.extractAttachments
    };
  }

  private toRecipientPayload(recipients: Recipient[]): Array<{
    email: string;
    display_name: string;
    sort_order: number;
    on_vacation: boolean;
    vacation_start: string | null;
    vacation_end: string | null;
  }> {
    return recipients
      .filter((recipient) => recipient.email.trim())
      .map((recipient, index) => ({
        email: recipient.email.trim(),
        display_name: recipient.display_name,
        sort_order: index,
        on_vacation: recipient.is_on_vacation,
        vacation_start: recipient.vacation_start,
        vacation_end: recipient.vacation_end
      }));
  }

  private mapRecipient(recipient: {
    id: string;
    email: string;
    display_name: string | null;
    sort_order: number;
    on_vacation: boolean;
    vacation_start: string | null;
    vacation_end: string | null;
  }): Recipient {
    return {
      id: recipient.id,
      email: recipient.email,
      display_name: recipient.display_name ?? '',
      sort_order: recipient.sort_order,
      is_on_vacation: recipient.on_vacation,
      vacation_start: recipient.vacation_start,
      vacation_end: recipient.vacation_end
    };
  }
}
