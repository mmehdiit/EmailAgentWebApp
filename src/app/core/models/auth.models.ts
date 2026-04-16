export interface SignInPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthSessionResponse {
  authenticated: boolean;
  user: AuthUser | null;
}

export interface AuthLoginResponse {
  token: string;
  userId: string;
  email: string;
  role: string;
}

export interface AuthSessionData {
  id: string;
  email: string;
  role: string;
}

export interface AuthLoginResult {
  authenticated: boolean;
  user: AuthUser | null;
  message?: string;
}
