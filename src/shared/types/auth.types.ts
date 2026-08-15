import type { UserRole } from "./common.types";

export interface AuthSessionUser {
  id: number;
  name: string;
  role: UserRole;
  email?: string;
  phone?: string | null;
}

export interface LoginResult {
  id: number;
  name: string;
  role: UserRole;
}

export interface RegisterResult {
  id: number;
  name: string;
}
