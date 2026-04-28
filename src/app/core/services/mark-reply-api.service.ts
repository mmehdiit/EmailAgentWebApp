import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  MarkReplyConfirmResponse,
  MarkReplyPreviewResponse,
} from '../models/mark-reply.models';

@Injectable({
  providedIn: 'root',
})
export class MarkReplyApiService {
  private readonly baseUrl: string = environment.apiBaseUrl;
  constructor(private readonly http: HttpClient) {}

  preview(token: string): Observable<MarkReplyPreviewResponse> {
    return this.http.post<MarkReplyPreviewResponse>(
      `${this.baseUrl}/reply/mark`,
      { token, preview: true }
    );
  }

  confirm(token: string): Observable<MarkReplyConfirmResponse> {
    return this.http.post<MarkReplyConfirmResponse>(
      `${this.baseUrl}/reply/mark`,
      { token, preview: false }
    );
  }
}
