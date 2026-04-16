import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { UnreadEmailOverview } from '../models/dashboard.models';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class UnreadEmailApiService {
  constructor(
    private readonly http: HttpClient,
    private readonly apiService: ApiService
  ) {}

  getUnreadEmails(): Observable<UnreadEmailOverview> {
    return this.http.get<UnreadEmailOverview>(
      this.apiService.buildUrl('/dashboard/unread-emails'),
      {
        withCredentials: true
      }
    );
  }
}
