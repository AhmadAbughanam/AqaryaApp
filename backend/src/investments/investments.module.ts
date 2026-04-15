import {Module} from '@nestjs/common';
import {AuditModule} from '../audit/audit.module';
import {WalletModule} from '../wallet/wallet.module';
import {InvestmentsController} from './investments.controller';
import {InvestmentsService} from './investments.service';

@Module({
  imports: [AuditModule, WalletModule],
  controllers: [InvestmentsController],
  providers: [InvestmentsService],
})
export class InvestmentsModule {}
