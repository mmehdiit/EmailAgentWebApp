import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment.development';
import {
  CreateDepartmentPayload,
  CreateUserPayload,
  DepartmentResponse,
} from '../models/dashboard.models';

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
  constructor(private readonly http: HttpClient) {}

  createUser(payload: CreateUserPayload): Observable<CreateUserApiResponse> {
    return this.http.post<CreateUserApiResponse>(
      `${this.baseUrl}/admin/users`,
      payload,
    );
  }

  getDepartments(): Observable<DepartmentResponse[]> {
    return this.http.get<DepartmentResponse[]>(
      `${this.baseUrl}/admin/departments`,
    );
  }

  createDepartment(
    payload: CreateDepartmentPayload,
  ): Observable<DepartmentResponse> {
    return this.http.post<DepartmentResponse>(
      `${this.baseUrl}/admin/departments`,
      payload,
    );
  }
}
