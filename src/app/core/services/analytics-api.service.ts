import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment.development';

type EmailLogDto = {
  id: string;
  email_from: string | null;
  emailFrom?: string | null;
  email_subject: string | null;
  emailSubject?: string | null;
  forwarded_to: string | null;
  forwardedTo?: string | null;
  rule_matched: string | null;
  ruleMatched?: string | null;
  status: string;
  outlook_message_id: string | null;
  outlookMessageId?: string | null;
  outlook_conversation_id: string | null;
  outlookConversationId?: string | null;
  processed_at: string;
  processedAt?: string;
  replied_at: string | null;
  repliedAt?: string | null;
  reply_detected: boolean;
  replyDetected?: boolean;
  ai_classified: boolean;
  aiClassified?: boolean;
  ai_confidence: number | null;
  aiConfidence?: number | null;
  ai_reasoning: string | null;
  aiReasoning?: string | null;
  tracking_token: string | null;
  trackingToken?: string | null;
  reply_source: string | null;
  replySource?: string | null;
  received_at: string | null;
  receivedAt?: string | null;
  negative_keyword_override: string | null;
  negativeKeywordOverride?: string | null;
};

@Injectable({
  providedIn: 'root',
})
export class AnalyticsApiService {
  private readonly baseUrl: string = environment.apiBaseUrl;
  constructor(private readonly http: HttpClient) {}

  getLogs(filters: { fromDate?: string; toDate?: string } = {}): Observable<EmailLogDto[]> {
    let params = new HttpParams();

    if (filters.fromDate) {
      params = params.set('fromDate', filters.fromDate);
    }

    if (filters.toDate) {
      params = params.set('toDate', filters.toDate);
    }

    return this.http.get<EmailLogDto[]>(`${this.baseUrl}/email-logs`, {
      params,
    });
  }

  checkReplies(): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.baseUrl}/reply/check`,
      {}
    );
  }

  markReplyManual(emailLogId: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.baseUrl}/reply/mark-manual`,
      {
        emailLogId,
      }
    );
  }
}
