import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';
import { CatalogModule } from '../catalog/catalog.module';
import { SellersModule } from '../sellers/sellers.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [UsersModule, OrdersModule, CatalogModule, SellersModule, RolesModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
