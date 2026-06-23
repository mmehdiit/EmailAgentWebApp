import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthSessionResponse, AuthLoginResult } from '../models/auth.models';
import { AuthApiService } from './auth-api.service';
import { MicrosoftAuthService } from './microsoft-auth.service';

const TOKEN_KEY = 'email-ai-agent-auth-token';

@Injectable({
  providedIn: 'root',
})
export class AuthSessionService {
  private sessionPromise: Promise<AuthSessionResponse> | null = null;

  constructor(
    private readonly authApiService: AuthApiService,
    private readonly microsoftAuthService: MicrosoftAuthService,
  ) {}

  async getSession(): Promise<AuthSessionResponse> {
    if (this.sessionPromise) {
      return this.sessionPromise;
    }

    this.sessionPromise = this.loadSession();
    return this.sessionPromise;
  }

  async signInWithMicrosoft(): Promise<AuthLoginResult> {
    const msalResult = await this.microsoftAuthService.loginPopup();

    const response = await firstValueFrom(
      this.authApiService.microsoftLogin(msalResult.idToken),
    );

    const authenticatedUser = {
      id: response.user_id,
      email: response.email,
      role: response.role,
    };

    localStorage.setItem(TOKEN_KEY, response.token);
    this.sessionPromise = Promise.resolve({
      authenticated: true,
      user: authenticatedUser,
    });

    return {
      authenticated: true,
      user: authenticatedUser,
      message: 'You have successfully logged in.',
    };
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.sessionPromise = null;
  }

  private async loadSession(): Promise<AuthSessionResponse> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return { authenticated: false, user: null };
    }

    try {
      const data = await firstValueFrom(this.authApiService.getSession());
      return {
        authenticated: true,
        user: { id: data.id, email: data.email, role: data.role },
      };
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      this.sessionPromise = null;
      return { authenticated: false, user: null };
    }
  }
}
