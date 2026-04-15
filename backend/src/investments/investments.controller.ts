import {Body, Controller, Get, Param, Post, Query, UseGuards} from '@nestjs/common';
import {Roles} from '../common/decorators/roles.decorator';
import {CurrentUser} from '../common/decorators/current-user.decorator';
import {JwtAuthGuard} from '../common/guards/jwt-auth.guard';
import {RolesGuard} from '../common/guards/roles.guard';
import {AuthUser} from '../common/auth-user';
import {SimulateInvestmentDto} from './dto/simulate-investment.dto';
import {GetOpportunitiesDto} from './dto/get-opportunities.dto';
import {SimulateOpportunityDto} from './dto/simulate-opportunity.dto';
import {InvestWithWalletDto} from './dto/invest-with-wallet.dto';
import {InvestmentsService} from './investments.service';

@Controller('investments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  // ─── Legacy property-based pilot routes (kept for backward compat) ─────────

  @Get('pilot-properties')
  @Roles('citizen')
  getPilotProperties(@Query('search') search?: string) {
    return this.investmentsService.getPilotProperties(search);
  }

  @Post('simulate')
  @Roles('citizen')
  simulate(
    @CurrentUser() user: AuthUser,
    @Body() dto: SimulateInvestmentDto,
  ) {
    return this.investmentsService.simulateInvestment(
      user.sub,
      dto.propertyId,
      dto.shares,
      dto.holdingPeriodYears,
      dto.exitScenario,
      dto.reinvestDistributions,
    );
  }

  @Get('portfolio')
  @Roles('citizen')
  getPortfolio(@CurrentUser() user: AuthUser) {
    return this.investmentsService.getPortfolio(user.sub);
  }

  // ─── Investment Opportunity routes ─────────────────────────────────────────

  @Get('opportunities')
  @Roles('citizen')
  getOpportunities(@Query() dto: GetOpportunitiesDto) {
    return this.investmentsService.getOpportunities(dto);
  }

  @Get('opportunities/:id')
  @Roles('citizen')
  getOpportunityDetail(@Param('id') id: string) {
    return this.investmentsService.getOpportunityDetail(id);
  }

  @Post('opportunities/simulate')
  @Roles('citizen')
  simulateOpportunity(
    @CurrentUser() user: AuthUser,
    @Body() dto: SimulateOpportunityDto,
  ) {
    return this.investmentsService.simulateOpportunityInvestment(
      user.sub,
      dto.opportunityId,
      dto.shares,
      dto.holdingPeriodYears,
      dto.exitScenario,
      dto.reinvestDistributions,
    );
  }

  @Get('opportunities-portfolio')
  @Roles('citizen')
  getOpportunityPortfolio(@CurrentUser() user: AuthUser) {
    return this.investmentsService.getOpportunityPortfolio(user.sub);
  }

  @Post('opportunities/:id/invest-with-wallet')
  @Roles('citizen')
  investWithWallet(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: InvestWithWalletDto,
  ) {
    return this.investmentsService.investOpportunityWithWallet(
      user.sub,
      id,
      dto.shares,
      dto.holdingPeriodYears,
      dto.exitScenario,
      dto.reinvestDistributions,
    );
  }
}
