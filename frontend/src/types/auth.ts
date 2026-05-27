// Auth types

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "supervisor" | "operacional";
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}
