import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  constructor(
    private readonly http: HttpClient,
    private readonly apiService: ApiService
  ) {}

  getSession(): Observable<AuthSessionData> {
    return this.http.get<AuthSessionData>(
      this.apiService.buildUrl('v1/api/auth/me')
    );
  }

  signIn(payload: SignInPayload): Observable<AuthLoginResponse> {
    return this.http.post<AuthLoginResponse>(
      this.apiService.buildUrl('v1/api/auth/login'),
      payload
    );
  }
}
