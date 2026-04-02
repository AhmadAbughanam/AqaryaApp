import {Injectable} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {ExtractJwt, Strategy} from 'passport-jwt';
import {UserRole} from '@prisma/client';
import {AuthUser} from '../common/auth-user';
import {LegacyRole, normalizeRole} from '../common/roles';

interface JwtPayload {
  sub: string;
  username: string;
  role: LegacyRole;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'replace-with-strong-secret',
    });
  }

  validate(payload: JwtPayload): AuthUser {
    return {
      sub: payload.sub,
      username: payload.username,
      role: normalizeRole(payload.role) as UserRole,
    };
  }
}
