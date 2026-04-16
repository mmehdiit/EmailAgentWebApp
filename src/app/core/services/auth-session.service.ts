import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthLoginResponse, AuthSessionResponse, AuthUser, SignInPayload } from '../models/auth.models';
import { AuthApiService } from './auth-api.service';

const STORAGE_KEY = 'email-ai-agent-auth-session';

@Injectable({
  providedIn: 'root'
})
export class AuthSessionService {
  constructor(private readonly authApiService: AuthApiService) {}

  async getSession(): Promise<AuthSessionResponse> {
    const fakeSession = this.getFakeSession();
    if (fakeSession) {
      return {
        authenticated: true,
        user: fakeSession.user
      };
    }

    try {
      return await firstValueFrom(this.authApiService.getSession());
    } catch {
      return {
        authenticated: false,
        user: null
      };
    }
  }

  async signIn(payload: SignInPayload): Promise<AuthLoginResponse> {
    const response = await firstValueFrom(this.authApiService.signIn(payload));
    return response;
  }

  async signInFake(email: string): Promise<AuthLoginResponse> {
    const user: AuthUser = {
      id: 'fake-user',
      email,
      name: 'Frontend Test User'
    };

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        authenticated: true,
        user
      })
    );

    return {
      authenticated: true,
      user,
      message: 'Fake login enabled for frontend testing.'
    };
  }

  signOutFake(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  private getFakeSession(): AuthSessionResponse | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthSessionResponse;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }
}
