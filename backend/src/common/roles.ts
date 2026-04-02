import {UserRole} from '@prisma/client';

export type LegacyRole = UserRole | 'dlsadmin' | 'auditor' | 'analyst';

export const normalizeRole = (role: LegacyRole): UserRole => {
  if (role === 'citizen') {
    return 'citizen';
  }

  return 'admin';
};
