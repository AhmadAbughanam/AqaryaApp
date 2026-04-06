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
  ],
  controllers: [AppController],
})
export class AppModule {}
