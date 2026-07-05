import { User } from "../Authentication/User";

export class Authorizer {
  checkPermission(user: User, permission: string): boolean {
    if (user.permissions.includes("*")) return true;
    if (user.permissions.includes(permission)) return true;
    return false;
  }

  checkRole(user: User, role: string): boolean {
    return user.roles.includes(role);
  }

  checkAnyPermission(user: User, permissions: string[]): boolean {
    return permissions.some((p) => this.checkPermission(user, p));
  }

  checkAllPermissions(user: User, permissions: string[]): boolean {
    return permissions.every((p) => this.checkPermission(user, p));
  }
}
