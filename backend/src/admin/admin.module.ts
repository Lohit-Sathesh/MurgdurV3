import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SearchModule } from '../search/search.module';
import { OrdersModule } from '../orders/orders.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [DatabaseModule, SearchModule, OrdersModule],
  controllers: [AdminController],
})
export class AdminModule {}
