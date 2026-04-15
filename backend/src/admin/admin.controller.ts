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
import {CreateInvestmentOpportunityDto} from './dto/create-investment-opportunity.dto';
import {ReviewInvestmentOpportunityDto} from './dto/review-investment-opportunity.dto';
import {RequestChangesPropertyDto} from './dto/request-changes-property.dto';
import {GetAdminUsersDto} from './dto/get-admin-users.dto';
import {ReviewProviderDto} from './dto/review-provider.dto';

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

  @Post('properties/:id/request-changes')
  @Roles('admin')
  requestPropertyChanges(
    @Param('id') propertyId: string,
    @Body() dto: RequestChangesPropertyDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.adminService.requestPropertyChanges(propertyId, dto.notes, user);
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

  @Get('dashboard/summary')
  @Roles('admin')
  getDashboardSummary() {
    return this.adminService.getDashboardSummary();
  }

  // ─── Investment Opportunity admin routes ────────────────────────────────────

  @Post('investment-opportunities')
  @Roles('admin')
  createInvestmentOpportunity(
    @Body() dto: CreateInvestmentOpportunityDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.adminService.createInvestmentOpportunity(dto, user);
  }

  @Get('investment-opportunities')
  @Roles('admin')
  getInvestmentOpportunities(@Query('status') status?: string) {
    return this.adminService.getInvestmentOpportunities(status);
  }

  @Get('investment-opportunities/:id')
  @Roles('admin')
  getInvestmentOpportunityDetails(@Param('id') opportunityId: string) {
    return this.adminService.getInvestmentOpportunityDetails(opportunityId);
  }

  @Post('investment-opportunities/:id/review')
  @Roles('admin')
  reviewInvestmentOpportunity(
    @Param('id') opportunityId: string,
    @Body() dto: ReviewInvestmentOpportunityDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.adminService.reviewInvestmentOpportunity(opportunityId, dto, user);
  }

  // ─── User / Provider management routes ────────────────────────────────────

  @Get('users')
  @Roles('admin')
  getUsers(@Query() dto: GetAdminUsersDto) {
    return this.adminService.getUsers(dto.accountType, dto.providerStatus);
  }

  @Get('users/:id')
  @Roles('admin')
  getUserDetail(@Param('id') userId: string) {
    return this.adminService.getUserDetail(userId);
  }

  @Post('users/:id/provider-review')
  @Roles('admin')
  reviewProvider(
    @Param('id') userId: string,
    @Body() dto: ReviewProviderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.adminService.reviewProvider(userId, dto, user);
  }
}
