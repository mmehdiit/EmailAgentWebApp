import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CreateUserPayload } from '../models/dashboard.models';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

type CreateUserApiResponse = {
  token: string;
  user_id: string;
  email: string;
  role: string;
};

@Injectable({
  providedIn: 'root',
})
export class UserManagementApiService {
  private readonly baseUrl: string = environment.apiBaseUrl;
  constructor(
    private readonly http: HttpClient,
    private readonly apiService: ApiService
  ) {}

  createUser(payload: CreateUserPayload): Observable<CreateUserApiResponse> {
    return this.http.post<CreateUserApiResponse>(
      `${this.baseUrl}/v1/api/admin/users`,
      payload
    );
  }
}
