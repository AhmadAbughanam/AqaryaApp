// Role-based access helpers for navigation/screen guards.
import {UserRole} from '../api/auth';

export const isRoleAllowed = (
  role: UserRole | null,
  allowedRoles: UserRole[],
): boolean => {
  if (!role) {
    return false;
  }
  return allowedRoles.includes(role);
};
