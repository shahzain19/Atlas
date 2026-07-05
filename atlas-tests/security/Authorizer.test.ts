import { Authorizer } from "../../atlas-security/Authorization/Authorizer";
import { User } from "../../atlas-security/Authentication/User";

describe("Authorizer", () => {
  let authorizer: Authorizer;

  beforeEach(() => {
    authorizer = new Authorizer();
  });

  it("should check permissions correctly", () => {
    const user: User = {
      id: "test-001",
      username: "tester",
      roles: ["user"],
      permissions: ["read", "write"],
    };
    expect(authorizer.checkPermission(user, "read")).toBe(true);
    expect(authorizer.checkPermission(user, "write")).toBe(true);
    expect(authorizer.checkPermission(user, "delete")).toBe(false);
  });

  it("should check wildcard permissions", () => {
    const admin: User = {
      id: "admin-001",
      username: "admin",
      roles: ["admin"],
      permissions: ["*"],
    };
    expect(authorizer.checkPermission(admin, "anything")).toBe(true);
  });

  it("should check roles", () => {
    const user: User = {
      id: "test-001",
      username: "tester",
      roles: ["user", "editor"],
      permissions: [],
    };
    expect(authorizer.checkRole(user, "user")).toBe(true);
    expect(authorizer.checkRole(user, "editor")).toBe(true);
    expect(authorizer.checkRole(user, "admin")).toBe(false);
  });

  it("should check any permissions", () => {
    const user: User = {
      id: "test-001",
      username: "tester",
      roles: ["user"],
      permissions: ["read"],
    };
    expect(authorizer.checkAnyPermission(user, ["write", "read"])).toBe(true);
    expect(authorizer.checkAnyPermission(user, ["write", "delete"])).toBe(false);
  });

  it("should check all permissions", () => {
    const user: User = {
      id: "test-001",
      username: "tester",
      roles: ["user"],
      permissions: ["read", "write"],
    };
    expect(authorizer.checkAllPermissions(user, ["read", "write"])).toBe(true);
    expect(authorizer.checkAllPermissions(user, ["read", "delete"])).toBe(false);
  });
});
