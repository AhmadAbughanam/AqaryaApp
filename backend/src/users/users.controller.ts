import {Controller, Get, UseGuards} from '@nestjs/common';
import {CurrentUser} from '../common/decorators/current-user.decorator';
import {Roles} from '../common/decorators/roles.decorator';
import {AuthUser} from '../common/auth-user';
import {JwtAuthGuard} from '../common/guards/jwt-auth.guard';
import {RolesGuard} from '../common/guards/roles.guard';
import {UsersService} from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/profile')
  @Roles('citizen')
  getMyProfile(@CurrentUser() user: AuthUser) {
    return this.usersService.getCitizenProfile(user.sub);
  }
}
