import { User, AuthToken } from "./User";
import { uuidv4 } from "../../atlas-kernel/utils/uuid";

export class Authenticator {
  private users: Map<string, User> = new Map();
  private tokens: Map<string, AuthToken> = new Map();

  constructor() {
    // Add default admin user for testing
    this.createUser({
      id: "admin-001",
      username: "admin",
      roles: ["admin"],
      permissions: ["*"],
    });
  }

  createUser(user: User): User {
    this.users.set(user.id, user);
    return user;
  }

  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  getUserByUsername(username: string): User | undefined {
    return Array.from(this.users.values()).find((u) => u.username === username);
  }

  async login(username: string, password: string): Promise<AuthToken | null> {
    const user = this.getUserByUsername(username);
    if (!user) return null;

    // Placeholder for real password check
    if (password !== "password") return null;

    const token: AuthToken = {
      userId: user.id,
      token: uuidv4(),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24, // 24h
    };
    this.tokens.set(token.token, token);
    return token;
  }

  async validateToken(token: string): Promise<User | null> {
    const authToken = this.tokens.get(token);
    if (!authToken || authToken.expiresAt < Date.now()) {
      if (authToken) this.tokens.delete(token);
      return null;
    }
    return this.getUser(authToken.userId) || null;
  }

  async logout(token: string): Promise<void> {
    this.tokens.delete(token);
  }
}
