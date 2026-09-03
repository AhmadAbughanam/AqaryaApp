export type UserRole = 'citizen' | 'admin';
export type RawUserRole =
  | UserRole
  | 'dlsAdmin'
  | 'dlsadmin'
  | 'auditor'
  | 'analyst';

export const normalizeUserRole = (
  role: RawUserRole | string | null,
): UserRole | null => {
  if (role === 'citizen') {
    return 'citizen';
  }

  if (
    role === 'admin' ||
    role === 'dlsAdmin' ||
    role === 'dlsadmin' ||
    role === 'auditor' ||
    role === 'analyst'
  ) {
    return 'admin';
  }

  return null;
};
