import {Module} from '@nestjs/common';
import {AuditModule} from '../audit/audit.module';
import {VerificationModule} from '../verification/verification.module';
import {WalletModule} from '../wallet/wallet.module';
import {PropertiesController} from './properties.controller';
import {PropertiesService} from './properties.service';

@Module({
  imports: [AuditModule, VerificationModule, WalletModule],
  controllers: [PropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
