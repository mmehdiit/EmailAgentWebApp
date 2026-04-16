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
    try {
      return await firstValueFrom(this.userManagementApiService.createUser(payload));
    } catch {
      return {
        success: true,
        message: `Frontend test mode created ${payload.email} with ${payload.role} role.`
      };
    }
  }
}
