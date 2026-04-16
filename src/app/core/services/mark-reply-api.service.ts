import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { MarkReplyConfirmResponse, MarkReplyPreviewResponse } from '../models/mark-reply.models';

@Injectable({
  providedIn: 'root'
})
export class MarkReplyApiService {
  constructor(
    private readonly http: HttpClient,
    private readonly apiService: ApiService
  ) {}

  preview(token: string): Observable<MarkReplyPreviewResponse> {
    return this.http.post<MarkReplyPreviewResponse>(
      this.apiService.buildUrl('/mark-reply/preview'),
      { token },
      { withCredentials: true }
    );
  }

  confirm(token: string): Observable<MarkReplyConfirmResponse> {
    return this.http.post<MarkReplyConfirmResponse>(
      this.apiService.buildUrl('/mark-reply/confirm'),
      { token },
      { withCredentials: true }
    );
  }
}
