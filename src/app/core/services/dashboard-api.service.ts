import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  DashboardConnectionStatus,
  DashboardProcessResult,
  OutlookConnectResult,
} from '../models/dashboard.models';
import { ApiService } from './api.service';

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
  constructor(
    private readonly http: HttpClient,
    private readonly apiService: ApiService
  ) {}

  getConnectionStatus(): Observable<OutlookConnectionResponse> {
    return this.http.get<OutlookConnectionResponse>(
      this.apiService.buildUrl('v1/api/outlook/connection')
    );
  }

  getOutlookAuthUrl(
    frontendOrigin: string,
    redirectUri: string
  ): Observable<OutlookAuthResponse> {
    return this.http.post<OutlookAuthResponse>(
      this.apiService.buildUrl('v1/api/outlook/auth'),
      {
        frontendOrigin,
        redirectUri,
      }
    );
  }

  completeOutlookConnection(
    payload: OutlookCallbackPayload
  ): Observable<OutlookCallbackResponse> {
    return this.http.post<OutlookCallbackResponse>(
      this.apiService.buildUrl('v1/api/outlook/callback'),
      payload
    );
  }

  disconnectOutlook(): Observable<DashboardProcessResult> {
    return this.http.delete<DashboardProcessResult>(
      this.apiService.buildUrl('v1/api/outlook/connection')
    );
  }

  processEmails(): Observable<DashboardProcessResult> {
    return this.http.post<DashboardProcessResult>(
      this.apiService.buildUrl('v1/api/emails/process'),
      {}
    );
  }
}
