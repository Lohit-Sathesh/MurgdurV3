import { Module } from '@nestjs/common'
import { DatabaseModule }    from '../database/database.module'
import { OrdersModule }      from '../orders/orders.module'
import { TempOrderService }  from './temp-order.service'
import { TempOrderController } from './temp-order.controller'

@Module({
  imports:     [DatabaseModule, OrdersModule],
  controllers: [TempOrderController],
  providers:   [TempOrderService],
  exports:     [TempOrderService],
})
export class TempOrderModule {}
