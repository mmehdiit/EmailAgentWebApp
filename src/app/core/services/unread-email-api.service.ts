import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { EmailClassificationResult } from '../models/dashboard.models';
import { ApiService } from './api.service';

type UnreadEmailResponse = Array<{
  id: string;
  subject: string;
  from: string;
  from_name: string;
  received_date_time: string;
  body_preview: string;
  conversation_id: string;
  has_attachments: boolean;
}>;

@Injectable({
  providedIn: 'root'
})
export class UnreadEmailApiService {
  constructor(
    private readonly http: HttpClient,
    private readonly apiService: ApiService
  ) {}

  getUnreadEmails(): Observable<UnreadEmailResponse> {
    return this.http.get<UnreadEmailResponse>(this.apiService.buildUrl('/v1/api/emails/unread'));
  }

  classifyEmail(email: { subject: string; body: string; sender: string }): Observable<EmailClassificationResult> {
    return this.http.post<EmailClassificationResult>(this.apiService.buildUrl('/v1/api/emails/classify'), {
      email
    });
  }

  markAsRead(emailId: string): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(this.apiService.buildUrl(`/v1/api/emails/${emailId}/read`), {});
  }

  manualAssign(emailId: string, ruleId: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(this.apiService.buildUrl('/v1/api/emails/manual-assign'), {
      emailId,
      ruleId
    });
  }

  getEmailContent(emailId: string): Observable<{
    subject: string;
    from: string;
    body: string;
    html_body: string;
    received_date_time: string;
  }> {
    return this.http.get<{
      subject: string;
      from: string;
      body: string;
      html_body: string;
      received_date_time: string;
    }>(this.apiService.buildUrl(`/v1/api/emails/${emailId}/content`));
  }

  retryFailedEmails(): Observable<{ retried?: number; still_failed?: number; success?: boolean; message?: string }> {
    return this.http.post<{ retried?: number; still_failed?: number; success?: boolean; message?: string }>(
      this.apiService.buildUrl('/v1/api/emails/retry-failed'),
      {}
    );
  }
}
