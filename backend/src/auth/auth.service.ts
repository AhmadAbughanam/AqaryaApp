import {Injectable, UnauthorizedException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {AuditService} from '../audit/audit.service';
import {normalizeRole} from '../common/roles';
import {UsersService} from '../users/users.service';
import {LoginDto} from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async login(credentials: LoginDto): Promise<{
    token: string;
    role: string;
    userId: string;
  }> {
    const user = await this.usersService.findByUsername(credentials.username);
    if (!user) {
      throw new UnauthorizedException('Invalid username or password.');
    }

    const passwordMatches = await bcrypt.compare(
      credentials.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid username or password.');
    }

    const normalizedRole = normalizeRole(user.role);
    const token = await this.jwtService.signAsync({
      sub: user.id,
      username: user.username,
      role: normalizedRole,
    });

    await this.auditService.log({
      actorId: user.id,
      actorRole: normalizedRole,
      actionType: 'login',
      metadata: {
        username: user.username,
      },
    });

    return {
      token,
      role: normalizedRole,
      userId: user.id,
    };
  }
}
