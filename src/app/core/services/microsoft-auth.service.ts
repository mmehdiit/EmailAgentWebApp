import { Injectable } from '@angular/core';
import {
  PublicClientApplication,
  AuthenticationResult,
  Configuration,
} from '@azure/msal-browser';

import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class MicrosoftAuthService {
  private pca: PublicClientApplication | null = null;
  private initPromise: Promise<void> | null = null;

  private async getClient(): Promise<PublicClientApplication> {
    if (!this.pca) {
      const config: Configuration = {
        auth: {
          clientId: environment.msalClientId,
          authority: `https://login.microsoftonline.com/${environment.msalTenantId}`,
          redirectUri: window.location.origin + '/email-agent',
        },
        cache: {
          cacheLocation: 'sessionStorage',
          storeAuthStateInCookie: false,
        },
      };
      this.pca = new PublicClientApplication(config);
    }

    if (!this.initPromise) {
      this.initPromise = this.pca.initialize();
    }
    await this.initPromise;

    return this.pca;
  }

  async loginPopup(): Promise<AuthenticationResult> {
    const client = await this.getClient();
    return client.loginPopup({ scopes: ['openid', 'profile', 'email'] });
  }
}
