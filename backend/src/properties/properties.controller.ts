import {
  Body,
  Controller,
  Get,
  Param,
  ParseFloatPipe,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {CurrentUser} from '../common/decorators/current-user.decorator';
import {Roles} from '../common/decorators/roles.decorator';
import {AuthUser} from '../common/auth-user';
import {JwtAuthGuard} from '../common/guards/jwt-auth.guard';
import {RolesGuard} from '../common/guards/roles.guard';
import {CreateSaleListingDto} from './dto/create-sale-listing.dto';
import {PropertiesService} from './properties.service';

@Controller('properties')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  @Roles('citizen', 'admin')
  getProperties(
    @Query('page', new ParseIntPipe({optional: true})) page = 1,
    @Query('limit', new ParseIntPipe({optional: true})) limit = 20,
    @Query('search') search?: string,
    @Query('marketType') marketType?: string,
    @Query('city') city?: string,
    @Query('propertyType') propertyType?: string,
    @Query('minPrice', new ParseFloatPipe({optional: true})) minPrice?: number,
    @Query('maxPrice', new ParseFloatPipe({optional: true})) maxPrice?: number,
    @Query('sort') sort?: string,
  ) {
    return this.propertiesService.getSaleListings({
      page,
      limit,
      search,
      marketType,
      city,
      propertyType,
      minPrice,
      maxPrice,
      sort,
    });
  }

  @Post('sell-listings')
  @Roles('citizen')
  createSaleListing(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateSaleListingDto,
  ) {
    return this.propertiesService.createSaleListing(user.sub, user.role, dto);
  }

  @Get(':id')
  @Roles('citizen', 'admin')
  getPropertyDetails(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.propertiesService.getPropertyDetails(id, user.sub, user.role);
  }

  @Post(':id/buy')
  @Roles('citizen')
  buyProperty(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.propertiesService.buySaleProperty(id, user.sub, user.role);
  }

  @Post(':id/buy-with-wallet')
  @Roles('citizen')
  buyPropertyWithWallet(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.propertiesService.buySalePropertyWithWallet(id, user.sub, user.role);
  }
}
