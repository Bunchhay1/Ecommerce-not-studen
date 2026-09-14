import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { KafkaModule } from './kafka/kafka.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { AuditModule } from './audit/audit.module';
import { AdminModule } from './admin/admin.module';
import { UsersModule } from './users/users.module';
import { SellersModule } from './sellers/sellers.module';
import { CatalogModule } from './catalog/catalog.module';
import { OrdersModule } from './orders/orders.module';
import { InventoryModule } from './inventory/inventory.module';
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { PromotionsModule } from './promotions/promotions.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SearchModule } from './search/search.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.example'],
    }),
    PrismaModule,
    RedisModule,
    KafkaModule,
    AuthModule,
    RolesModule,
    AuditModule,
    AdminModule,
    UsersModule,
    SellersModule,
    CatalogModule,
    OrdersModule,
    InventoryModule,
    PaymentsModule,
    ReviewsModule,
    PromotionsModule,
    NotificationsModule,
    DashboardModule,
    SearchModule,
    HealthModule,
  ],
})
export class AppModule {}
