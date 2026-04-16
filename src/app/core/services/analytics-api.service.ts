import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { DashboardAnalytics } from '../models/dashboard.models';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsApiService {
  constructor(
    private readonly http: HttpClient,
    private readonly apiService: ApiService
  ) {}

  getAnalytics(): Observable<DashboardAnalytics> {
    return this.http.get<DashboardAnalytics>(this.apiService.buildUrl('/dashboard/analytics'), {
      withCredentials: true
    });
  }
}
