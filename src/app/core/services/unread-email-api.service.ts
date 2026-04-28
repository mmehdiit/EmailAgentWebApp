import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { EmailClassificationResult } from '../models/dashboard.models';

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
  providedIn: 'root',
})
export class UnreadEmailApiService {
  private readonly baseUrl: string = environment.apiBaseUrl;
  constructor(private readonly http: HttpClient) {}

  getUnreadEmails(): Observable<UnreadEmailResponse> {
    return this.http.get<UnreadEmailResponse>(`${this.baseUrl}/emails/unread`);
  }

  classifyEmail(email: {
    subject: string;
    body: string;
    sender: string;
  }): Observable<EmailClassificationResult> {
    return this.http.post<EmailClassificationResult>(
      `${this.baseUrl}/emails/classify`,
      {
        email,
      }
    );
  }

  markAsRead(emailId: string): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(
      `${this.baseUrl}/emails/${emailId}/read`,
      {}
    );
  }

  manualAssign(
    emailId: string,
    ruleId: string
  ): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.baseUrl}/emails/manual-assign`,
      {
        emailId,
        ruleId,
      }
    );
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
    }>(`${this.baseUrl}/emails/${encodeURIComponent(emailId)}/content`);
  }

  retryFailedEmails(): Observable<{
    retried?: number;
    still_failed?: number;
    success?: boolean;
    message?: string;
  }> {
    return this.http.post<{
      retried?: number;
      still_failed?: number;
      success?: boolean;
      message?: string;
    }>(`${this.baseUrl}/emails/retry-failed`, {});
  }
}
