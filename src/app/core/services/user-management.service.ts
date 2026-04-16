import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { CreateUserPayload, CreateUserResponse } from '../models/dashboard.models';
import { UserManagementApiService } from './user-management-api.service';

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  constructor(private readonly userManagementApiService: UserManagementApiService) {}

  async createUser(payload: CreateUserPayload): Promise<CreateUserResponse> {
    const response = await firstValueFrom(this.userManagementApiService.createUser(payload));

    return {
      success: true,
      email: response.email,
      role: response.role,
      message: `Created ${response.email} with ${response.role} role.`
    };
  }
}
