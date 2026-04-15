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
import {ModerationService} from './moderation.service';
import {CreateReportDto} from './dto/create-report.dto';
import {GetReportsDto} from './dto/get-reports.dto';
import {ModerateReportDto} from './dto/moderate-report.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  // ─── Citizen: submit reports ─────────────────────────────────────────────────

  @Post('reports/listings/:id')
  @Roles('citizen')
  createListingReport(
    @Param('id') propertyId: string,
    @Body() dto: CreateReportDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.moderationService.createListingReport(user.sub, propertyId, dto);
  }

  @Post('reports/opportunities/:id')
  @Roles('citizen')
  createOpportunityReport(
    @Param('id') opportunityId: string,
    @Body() dto: CreateReportDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.moderationService.createOpportunityReport(user.sub, opportunityId, dto);
  }

  // ─── Admin: moderation queue ─────────────────────────────────────────────────

  @Get('admin/moderation/reports')
  @Roles('admin')
  getReports(@Query() dto: GetReportsDto) {
    return this.moderationService.getReports(dto);
  }

  @Get('admin/moderation/reports/:id')
  @Roles('admin')
  getReportDetail(@Param('id') reportId: string) {
    return this.moderationService.getReportDetail(reportId);
  }

  @Post('admin/moderation/reports/:id/action')
  @Roles('admin')
  moderateReport(
    @Param('id') reportId: string,
    @Body() dto: ModerateReportDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.moderationService.moderateReport(reportId, dto.action, user);
  }
}
