export interface User {
  id: string;
  username: string;
  email?: string;
  roles: string[];
  permissions: string[];
}

export interface AuthToken {
  userId: string;
  token: string;
  expiresAt: number;
}
