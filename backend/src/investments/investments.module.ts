import {Module} from '@nestjs/common';
import {AuditModule} from '../audit/audit.module';
import {InvestmentsController} from './investments.controller';
import {InvestmentsService} from './investments.service';

@Module({
  imports: [AuditModule],
  controllers: [InvestmentsController],
  providers: [InvestmentsService],
})
export class InvestmentsModule {}
