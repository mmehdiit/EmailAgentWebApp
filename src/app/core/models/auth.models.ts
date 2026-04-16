export interface SignInPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  id?: string;
  email?: string;
  name?: string;
}

export interface AuthSessionResponse {
  authenticated: boolean;
  user?: AuthUser | null;
}

export interface AuthLoginResponse {
  authenticated?: boolean;
  user?: AuthUser | null;
  message?: string;
}
