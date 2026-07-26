export interface LoginRequest {
  username: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: string;
}

export interface SessionIdentity {
  name: string;
  username: string;
  permissions: readonly string[];
}
