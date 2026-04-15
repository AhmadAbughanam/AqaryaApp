import {Module} from '@nestjs/common';
import {ModerationController} from './moderation.controller';
import {ModerationService} from './moderation.service';
import {QualityFlagsService} from './quality-flags.service';
import {AuditModule} from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ModerationController],
  providers: [ModerationService, QualityFlagsService],
  exports: [ModerationService, QualityFlagsService],
})
export class ModerationModule {}
