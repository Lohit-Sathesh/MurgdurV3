import { Module } from '@nestjs/common'
import { OrdersController } from './orders.controller'
import { OrdersService }    from './orders.service'
import { EmailModule }      from '../email/email.module'
import { DatabaseModule }   from '../database/database.module'

@Module({
  imports:     [DatabaseModule, EmailModule],
  controllers: [OrdersController],
  providers:   [OrdersService],
  exports:     [OrdersService],
})
export class OrdersModule {}