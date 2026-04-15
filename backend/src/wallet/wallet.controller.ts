import {Body, Controller, Get, Post, Query, UseGuards} from '@nestjs/common';
import {JwtAuthGuard} from '../common/guards/jwt-auth.guard';
import {RolesGuard} from '../common/guards/roles.guard';
import {Roles} from '../common/decorators/roles.decorator';
import {CurrentUser} from '../common/decorators/current-user.decorator';
import {AuthUser} from '../common/auth-user';
import {WalletService} from './wallet.service';
import {DepositDto} from './dto/deposit.dto';
import {WithdrawDto} from './dto/withdraw.dto';

@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('citizen')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  getBalance(@CurrentUser() user: AuthUser) {
    return this.walletService.getBalance(user.sub);
  }

  @Get('transactions')
  getTransactions(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.walletService.getTransactions(
      user.sub,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('deposit')
  requestDeposit(@CurrentUser() user: AuthUser, @Body() dto: DepositDto) {
    return this.walletService.requestDeposit(user.sub, dto);
  }

  @Post('withdraw')
  requestWithdrawal(@CurrentUser() user: AuthUser, @Body() dto: WithdrawDto) {
    return this.walletService.requestWithdrawal(user.sub, dto);
  }
}
