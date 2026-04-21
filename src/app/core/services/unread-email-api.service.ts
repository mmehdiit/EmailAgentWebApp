import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { EmailClassificationResult } from '../models/dashboard.models';
import { ApiService } from './api.service';

type UnreadEmailResponse = Array<{
  id: string;
  subject: string;
  from: string;
  fromName: string;
  receivedDateTime: string;
  bodyPreview: string;
  conversationId: string;
  hasAttachments: boolean;
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
    id: string;
    subject: string;
    from: string;
    body: string;
    htmlBody: string;
    receivedDateTime: string;
  }> {
    return this.http.get<{
      id: string;
      subject: string;
      from: string;
      body: string;
      htmlBody: string;
      receivedDateTime: string;
    }>(this.apiService.buildUrl(`/v1/api/emails/${encodeURIComponent(emailId)}/content`));
  }

  retryFailedEmails(): Observable<{ retried?: number; still_failed?: number; success?: boolean; message?: string }> {
    return this.http.post<{ retried?: number; still_failed?: number; success?: boolean; message?: string }>(
      this.apiService.buildUrl('/v1/api/emails/retry-failed'),
      {}
    );
  }
}
