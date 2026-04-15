import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {PrismaModule} from './common/prisma.module';
import {UsersModule} from './users/users.module';
import {AuthModule} from './auth/auth.module';
import {PropertiesModule} from './properties/properties.module';
import {AuditModule} from './audit/audit.module';
import {AnalyticsModule} from './analytics/analytics.module';
import {AdminModule} from './admin/admin.module';
import {InvestmentsModule} from './investments/investments.module';
import {MessagesModule} from './messages/messages.module';
import {ModerationModule} from './moderation/moderation.module';
import {CmsModule} from './cms/cms.module';
import {WalletModule} from './wallet/wallet.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    PropertiesModule,
    AuditModule,
    AnalyticsModule,
    AdminModule,
    InvestmentsModule,
    MessagesModule,
    ModerationModule,
    CmsModule,
    WalletModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
