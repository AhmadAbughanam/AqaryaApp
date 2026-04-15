import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, UseGuards} from '@nestjs/common';
import {CurrentUser} from '../common/decorators/current-user.decorator';
import {Roles} from '../common/decorators/roles.decorator';
import {AuthUser} from '../common/auth-user';
import {JwtAuthGuard} from '../common/guards/jwt-auth.guard';
import {RolesGuard} from '../common/guards/roles.guard';
import {UsersService} from './users.service';
import {SaveItemDto} from './dto/save-item.dto';
import {UpdatePreferencesDto} from './dto/update-preferences.dto';
import {CreateSavedSearchDto} from './dto/create-saved-search.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/profile')
  @Roles('citizen')
  getMyProfile(@CurrentUser() user: AuthUser) {
    return this.usersService.getCitizenProfile(user.sub);
  }

  // ─── Saved items ─────────────────────────────────────────────────────────────

  @Get('me/saved')
  @Roles('citizen')
  getSavedItems(@CurrentUser() user: AuthUser) {
    return this.usersService.getSavedItems(user.sub);
  }

  @Post('me/saved')
  @Roles('citizen')
  saveItem(@CurrentUser() user: AuthUser, @Body() dto: SaveItemDto) {
    return this.usersService.saveItem(user.sub, dto);
  }

  @Delete('me/saved/listing/:propertyId')
  @Roles('citizen')
  @HttpCode(HttpStatus.NO_CONTENT)
  unsaveListing(@Param('propertyId') propertyId: string, @CurrentUser() user: AuthUser) {
    return this.usersService.unsaveListing(user.sub, propertyId);
  }

  @Delete('me/saved/opportunity/:opportunityId')
  @Roles('citizen')
  @HttpCode(HttpStatus.NO_CONTENT)
  unsaveOpportunity(@Param('opportunityId') opportunityId: string, @CurrentUser() user: AuthUser) {
    return this.usersService.unsaveOpportunity(user.sub, opportunityId);
  }

  @Get('me/saved/listing/:propertyId/status')
  @Roles('citizen')
  isSavedListing(@Param('propertyId') propertyId: string, @CurrentUser() user: AuthUser) {
    return this.usersService.isSavedListing(user.sub, propertyId).then(saved => ({saved}));
  }

  @Get('me/saved/opportunity/:opportunityId/status')
  @Roles('citizen')
  isSavedOpportunity(@Param('opportunityId') opportunityId: string, @CurrentUser() user: AuthUser) {
    return this.usersService.isSavedOpportunity(user.sub, opportunityId).then(saved => ({saved}));
  }

  // ─── Preferences ─────────────────────────────────────────────────────────────

  @Put('me/preferences')
  @Roles('citizen')
  updatePreferences(@CurrentUser() user: AuthUser, @Body() dto: UpdatePreferencesDto) {
    return this.usersService.updatePreferences(user.sub, dto);
  }

  // ─── Saved Searches ───────────────────────────────────────────────────────────

  @Get('me/saved-searches')
  @Roles('citizen')
  getSavedSearches(@CurrentUser() user: AuthUser) {
    return this.usersService.getSavedSearches(user.sub);
  }

  @Post('me/saved-searches')
  @Roles('citizen')
  createSavedSearch(@CurrentUser() user: AuthUser, @Body() dto: CreateSavedSearchDto) {
    return this.usersService.createSavedSearch(user.sub, dto);
  }

  @Delete('me/saved-searches/:id')
  @Roles('citizen')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSavedSearch(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.usersService.deleteSavedSearch(user.sub, id);
  }

  // ─── Notifications ────────────────────────────────────────────────────────────

  @Get('me/notifications')
  @Roles('citizen')
  getNotifications(@CurrentUser() user: AuthUser) {
    return this.usersService.getNotifications(user.sub);
  }

  @Patch('me/notifications/:id/read')
  @Roles('citizen')
  @HttpCode(HttpStatus.NO_CONTENT)
  markNotificationRead(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.usersService.markNotificationRead(user.sub, id);
  }
}
