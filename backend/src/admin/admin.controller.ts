import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {CurrentUser} from '../common/decorators/current-user.decorator';
import {Roles} from '../common/decorators/roles.decorator';
import {JwtAuthGuard} from '../common/guards/jwt-auth.guard';
import {RolesGuard} from '../common/guards/roles.guard';
import {AuthUser} from '../common/auth-user';
import {AdminService} from './admin.service';
import {GetAuditLogsDto} from './dto/get-audit-logs.dto';
import {RejectPropertyDto} from './dto/reject-property.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('properties')
  @Roles('admin')
  getProperties(@Query('status') status?: string) {
    return this.adminService.getProperties(status);
  }

  @Get('properties/:id')
  @Roles('admin')
  getPropertyDetails(@Param('id') propertyId: string) {
    return this.adminService.getPropertyDetails(propertyId);
  }

  @Post('properties/:id/verify')
  @Roles('admin')
  verifyProperty(@Param('id') propertyId: string, @CurrentUser() user: AuthUser) {
    return this.adminService.verifyProperty(propertyId, user);
  }

  @Post('properties/:id/reject')
  @Roles('admin')
  rejectProperty(
    @Param('id') propertyId: string,
    @Body() dto: RejectPropertyDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.adminService.rejectProperty(propertyId, dto.reason, user);
  }

  @Post('properties/:id/freeze')
  @Roles('admin')
  freezeProperty(@Param('id') propertyId: string, @CurrentUser() user: AuthUser) {
    return this.adminService.freezeProperty(propertyId, user);
  }

  @Post('properties/:id/anchor')
  @Roles('admin')
  anchorProperty(@Param('id') propertyId: string, @CurrentUser() user: AuthUser) {
    return this.adminService.anchorProperty(propertyId, user);
  }

  @Get('audit-logs')
  @Roles('admin')
  getAuditLogs(@Query() dto: GetAuditLogsDto) {
    return this.adminService.getAuditLogs(dto);
  }

  @Get('analytics')
  @Roles('admin')
  getAnalytics() {
    return this.adminService.getAnalytics();
  }
}
