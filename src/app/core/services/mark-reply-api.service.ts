import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import {
  MarkReplyConfirmResponse,
  MarkReplyPreviewResponse,
} from '../models/mark-reply.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MarkReplyApiService {
  private readonly baseUrl: string = environment.apiBaseUrl;
  constructor(
    private readonly http: HttpClient,
    private readonly apiService: ApiService
  ) {}

  preview(token: string): Observable<MarkReplyPreviewResponse> {
    return this.http.post<MarkReplyPreviewResponse>(
      `${this.baseUrl}/v1/api/reply/mark`,
      { token, preview: true }
    );
  }

  confirm(token: string): Observable<MarkReplyConfirmResponse> {
    return this.http.post<MarkReplyConfirmResponse>(
      `${this.baseUrl}/v1/api/reply/mark`,
      { token, preview: false }
    );
  }
}
