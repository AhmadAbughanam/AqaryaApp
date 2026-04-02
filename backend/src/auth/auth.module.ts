import {Module} from '@nestjs/common';
import {JwtModule} from '@nestjs/jwt';
import {PassportModule} from '@nestjs/passport';
import {StringValue} from 'ms';
import {AuditModule} from '../audit/audit.module';
import {UsersModule} from '../users/users.module';
import {AuthController} from './auth.controller';
import {AuthService} from './auth.service';
import {JwtStrategy} from './jwt.strategy';

@Module({
  imports: [
    UsersModule,
    AuditModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'replace-with-strong-secret',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '1d') as StringValue,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
