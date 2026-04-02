import {Module} from '@nestjs/common';
import {AnalyticsModule} from '../analytics/analytics.module';
import {AuditModule} from '../audit/audit.module';
import {VerificationModule} from '../verification/verification.module';
import {AdminController} from './admin.controller';
import {AdminService} from './admin.service';

@Module({
  imports: [AuditModule, AnalyticsModule, VerificationModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
