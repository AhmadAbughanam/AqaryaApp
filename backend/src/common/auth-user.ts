import {UserRole} from '@prisma/client';

export interface AuthUser {
  sub: string;
  username: string;
  role: UserRole;
}
