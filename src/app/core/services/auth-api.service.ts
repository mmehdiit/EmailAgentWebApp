import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthLoginResponse, AuthSessionResponse, SignInPayload } from '../models/auth.models';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  constructor(
    private readonly http: HttpClient,
    private readonly apiService: ApiService
  ) {}

  getSession(): Observable<AuthSessionResponse> {
    return this.http.get<AuthSessionResponse>(this.apiService.buildUrl('/auth/session'), {
      withCredentials: true
    });
  }

  signIn(payload: SignInPayload): Observable<AuthLoginResponse> {
    return this.http.post<AuthLoginResponse>(this.apiService.buildUrl('/auth/login'), payload, {
      withCredentials: true
    });
  }
}
