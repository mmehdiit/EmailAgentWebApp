import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CreateUserPayload, CreateUserResponse } from '../models/dashboard.models';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class UserManagementApiService {
  constructor(
    private readonly http: HttpClient,
    private readonly apiService: ApiService
  ) {}

  createUser(payload: CreateUserPayload): Observable<CreateUserResponse> {
    return this.http.post<CreateUserResponse>(
      this.apiService.buildUrl('/admin/users'),
      payload,
      {
        withCredentials: true
      }
    );
  }
}
