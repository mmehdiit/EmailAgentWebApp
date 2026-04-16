import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

type EmailLogDto = {
  id: string;
  email_from: string | null;
  email_subject: string | null;
  forwarded_to: string | null;
  rule_matched: string | null;
  status: string;
  outlook_message_id: string | null;
  outlook_conversation_id: string | null;
  processed_at: string;
  replied_at: string | null;
  reply_detected: boolean;
  ai_classified: boolean;
  ai_confidence: number | null;
  ai_reasoning: string | null;
  tracking_token: string | null;
  reply_source: string | null;
  received_at: string | null;
};

@Injectable({
  providedIn: 'root'
})
export class AnalyticsApiService {
  constructor(
    private readonly http: HttpClient,
    private readonly apiService: ApiService
  ) {}

  getLogs(): Observable<EmailLogDto[]> {
    return this.http.get<EmailLogDto[]>(this.apiService.buildUrl('/v1/api/email-logs'));
  }

  checkReplies(): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(this.apiService.buildUrl('/v1/api/reply/check'), {});
  }

  markReplyManual(emailLogId: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(this.apiService.buildUrl('/v1/api/reply/mark-manual'), {
      emailLogId
    });
  }
}
