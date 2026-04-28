import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AuthLoginResponse,
  AuthSessionData,
  SignInPayload,
} from '../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly baseUrl: string = environment.apiBaseUrl;
  constructor(private readonly http: HttpClient) {}

  getSession(): Observable<AuthSessionData> {
    return this.http.get<AuthSessionData>(`${this.baseUrl}/auth/me`);
  }

  signIn(payload: SignInPayload): Observable<AuthLoginResponse> {
    return this.http.post<AuthLoginResponse>(
      `${this.baseUrl}/auth/login`,
      payload
    );
  }
}
