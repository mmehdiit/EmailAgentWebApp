import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  DashboardConnectionStatus,
  DashboardOverview,
  DashboardProcessResult,
  OutlookConnectResult
} from '../models/dashboard.models';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardApiService {
  constructor(
    private readonly http: HttpClient,
    private readonly apiService: ApiService
  ) {}

  getOverview(): Observable<DashboardOverview> {
    return this.http.get<DashboardOverview>(this.apiService.buildUrl('/dashboard/overview'), {
      withCredentials: true
    });
  }

  getConnectionStatus(): Observable<DashboardConnectionStatus> {
    return this.http.get<DashboardConnectionStatus>(this.apiService.buildUrl('/dashboard/outlook/status'), {
      withCredentials: true
    });
  }

  connectOutlook(): Observable<OutlookConnectResult> {
    return this.http.post<OutlookConnectResult>(this.apiService.buildUrl('/dashboard/outlook/connect'), {}, {
      withCredentials: true
    });
  }

  disconnectOutlook(): Observable<DashboardProcessResult> {
    return this.http.post<DashboardProcessResult>(this.apiService.buildUrl('/dashboard/outlook/disconnect'), {}, {
      withCredentials: true
    });
  }

  processEmails(): Observable<DashboardProcessResult> {
    return this.http.post<DashboardProcessResult>(this.apiService.buildUrl('/dashboard/process'), {}, {
      withCredentials: true
    });
  }
}
