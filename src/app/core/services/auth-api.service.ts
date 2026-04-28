import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AuthLoginResponse,
  AuthSessionData,
  SignInPayload,
} from '../models/auth.models';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly baseUrl: string = environment.apiBaseUrl;
  constructor(
    private readonly http: HttpClient,
    private readonly apiService: ApiService
  ) {}

  getSession(): Observable<AuthSessionData> {
    return this.http.get<AuthSessionData>(`${this.baseUrl}/v1/api/auth/me`);
  }

  signIn(payload: SignInPayload): Observable<AuthLoginResponse> {
    return this.http.post<AuthLoginResponse>(
      `${this.baseUrl}/v1/api/auth/login`,
      payload
    );
  }
}
