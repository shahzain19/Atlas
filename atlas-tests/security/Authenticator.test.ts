import { Authenticator } from "../../atlas-security/Authentication/Authenticator";
import { User } from "../../atlas-security/Authentication/User";

describe("Authenticator", () => {
  let auth: Authenticator;

  beforeEach(() => {
    auth = new Authenticator();
  });

  it("should initialize with default admin user", () => {
    const admin = auth.getUserByUsername("admin");
    expect(admin).toBeDefined();
    expect(admin?.username).toBe("admin");
  });

  it("should create new users", () => {
    const user: User = {
      id: "user-001",
      username: "testuser",
      roles: ["user"],
      permissions: ["read"],
    };
    auth.createUser(user);
    expect(auth.getUser("user-001")).toEqual(user);
  });

  it("should login with correct credentials", async () => {
    const token = await auth.login("admin", "password");
    expect(token).toBeDefined();
    expect(token?.userId).toBe("admin-001");
  });

  it("should not login with wrong password", async () => {
    const token = await auth.login("admin", "wrongpassword");
    expect(token).toBeNull();
  });

  it("should validate valid tokens", async () => {
    const token = await auth.login("admin", "password");
    if (token) {
      const user = await auth.validateToken(token.token);
      expect(user).toBeDefined();
      expect(user?.username).toBe("admin");
    }
  });

  it("should logout successfully", async () => {
    const token = await auth.login("admin", "password");
    if (token) {
      await auth.logout(token.token);
      const user = await auth.validateToken(token.token);
      expect(user).toBeNull();
    }
  });
});
