import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { DashboardProcessResult } from '../models/dashboard.models';

type OutlookConnectionResponse = {
  connected: boolean;
  email?: string;
};

type OutlookAuthResponse = {
  authUrl: string;
};

type OutlookCallbackPayload = {
  code: string;
  frontendOrigin: string;
  redirectUri: string;
};

type OutlookCallbackResponse = {
  success: boolean;
  email: string;
};

@Injectable({
  providedIn: 'root',
})
export class DashboardApiService {
  private readonly baseUrl: string = environment.apiBaseUrl;
  constructor(private readonly http: HttpClient) {}

  getConnectionStatus(): Observable<OutlookConnectionResponse> {
    return this.http.get<OutlookConnectionResponse>(
      `${this.baseUrl}/outlook/connection`
    );
  }

  getOutlookAuthUrl(
    frontendOrigin: string,
    redirectUri: string
  ): Observable<OutlookAuthResponse> {
    return this.http.post<OutlookAuthResponse>(`${this.baseUrl}/outlook/auth`, {
      frontendOrigin,
      redirectUri,
    });
  }

  completeOutlookConnection(
    payload: OutlookCallbackPayload
  ): Observable<OutlookCallbackResponse> {
    return this.http.post<OutlookCallbackResponse>(
      `${this.baseUrl}/outlook/callback`,
      payload
    );
  }

  disconnectOutlook(): Observable<DashboardProcessResult> {
    return this.http.delete<DashboardProcessResult>(
      `${this.baseUrl}/outlook/connection`
    );
  }

  processEmails(): Observable<DashboardProcessResult> {
    return this.http.post<DashboardProcessResult>(
      `${this.baseUrl}/emails/process`,
      {}
    );
  }
}
