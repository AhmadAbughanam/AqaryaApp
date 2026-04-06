import {Body, Controller, Get, Post, Query, UseGuards} from '@nestjs/common';
import {Roles} from '../common/decorators/roles.decorator';
import {CurrentUser} from '../common/decorators/current-user.decorator';
import {JwtAuthGuard} from '../common/guards/jwt-auth.guard';
import {RolesGuard} from '../common/guards/roles.guard';
import {AuthUser} from '../common/auth-user';
import {SimulateInvestmentDto} from './dto/simulate-investment.dto';
import {InvestmentsService} from './investments.service';

@Controller('investments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

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
}
