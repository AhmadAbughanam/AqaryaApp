import {Body, Controller, Get, Param, Patch, Put, Post, Query, UseGuards} from '@nestjs/common';
import {CurrentUser} from '../common/decorators/current-user.decorator';
import {Roles} from '../common/decorators/roles.decorator';
import {JwtAuthGuard} from '../common/guards/jwt-auth.guard';
import {RolesGuard} from '../common/guards/roles.guard';
import {AuthUser} from '../common/auth-user';
import {CmsService} from './cms.service';
import {CreateAnnouncementDto} from './dto/create-announcement.dto';
import {UpsertContentBlockDto} from './dto/upsert-content-block.dto';
import {GetAnnouncementsDto} from './dto/get-announcements.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  // ─── Admin: announcements ─────────────────────────────────────────────────────

  @Post('admin/announcements')
  @Roles('admin')
  createAnnouncement(
    @Body() dto: CreateAnnouncementDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.cmsService.createAnnouncement(dto, user);
  }

  @Get('admin/announcements')
  @Roles('admin')
  getAnnouncements(@Query() dto: GetAnnouncementsDto) {
    return this.cmsService.getAnnouncements(dto);
  }

  @Patch('admin/announcements/:id/archive')
  @Roles('admin')
  archiveAnnouncement(@Param('id') id: string) {
    return this.cmsService.archiveAnnouncement(id);
  }

  // ─── Admin: content blocks ────────────────────────────────────────────────────

  @Get('admin/content')
  @Roles('admin')
  getAllContentBlocks() {
    return this.cmsService.getAllContentBlocks();
  }

  @Put('admin/content/:key')
  @Roles('admin')
  upsertContentBlock(
    @Param('key') key: string,
    @Body() dto: UpsertContentBlockDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.cmsService.upsertContentBlock(key, dto, user);
  }

  // ─── Citizen: active content blocks ─────────────────────────────────────────

  @Get('content/active')
  @Roles('citizen')
  getActiveContentBlocks() {
    return this.cmsService.getActiveContentBlocks();
  }
}
