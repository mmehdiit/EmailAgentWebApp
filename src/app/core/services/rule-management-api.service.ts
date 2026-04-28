import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

type ForwardingRuleDto = {
  id: string;
  name: string;
  keywords: string[];
  negative_keywords: string[];
  recipient_email: string;
  conditions: string | null;
  active: boolean;
  priority: number;
  sender_pattern: string | null;
  subject_pattern: string | null;
  ai_enabled: boolean;
  ai_context: string | null;
  rotation_enabled: boolean;
  current_rotation_index: number;
  smart_thread_enabled: boolean;
  extract_attachments: boolean;
};

type ForwardingRuleRequest = {
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
};

type RuleRecipientDto = {
  id: string;
  rule_id: string;
  email: string;
  display_name: string | null;
  sort_order: number;
  on_vacation: boolean;
  vacation_start: string | null;
  vacation_end: string | null;
};

type RuleRecipientRequest = {
  email: string;
  display_name: string;
  sort_order: number;
  on_vacation: boolean;
  vacation_start: string | null;
  vacation_end: string | null;
};

@Injectable({
  providedIn: 'root',
})
export class RuleManagementApiService {
  private readonly baseUrl: string = environment.apiBaseUrl;
  constructor(
    private readonly http: HttpClient,
    private readonly apiService: ApiService
  ) {}

  listRules(): Observable<ForwardingRuleDto[]> {
    return this.http.get<ForwardingRuleDto[]>(`${this.baseUrl}/v1/api/rules`);
  }

  createRule(rule: ForwardingRuleRequest): Observable<ForwardingRuleDto> {
    return this.http.post<ForwardingRuleDto>(
      `${this.baseUrl}/v1/api/rules`,
      rule
    );
  }

  updateRule(
    ruleId: string,
    rule: ForwardingRuleRequest
  ): Observable<ForwardingRuleDto> {
    return this.http.put<ForwardingRuleDto>(
      `${this.baseUrl}/v1/api/rules/${ruleId}`,
      rule
    );
  }

  deleteRule(ruleId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `${this.baseUrl}/v1/api/rules/${ruleId}`
    );
  }

  reorderRules(ids: string[]): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.baseUrl}/v1/api/rules/reorder`,
      { ids }
    );
  }

  listRecipients(ruleId: string): Observable<RuleRecipientDto[]> {
    return this.http.get<RuleRecipientDto[]>(
      `${this.baseUrl}/v1/api/rules/${ruleId}/recipients`
    );
  }

  syncRecipients(
    ruleId: string,
    recipients: RuleRecipientRequest[]
  ): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.baseUrl}/v1/api/rules/${ruleId}/recipients/sync`,
      recipients
    );
  }
}
