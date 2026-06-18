import { Module } from '@nestjs/common'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { AddressesController } from './addresses.controller'
import { AddressesService } from './addresses.service'
import { VerificationModule } from '../verification/verification.module'

@Module({
  imports: [VerificationModule],
  controllers: [UsersController, AddressesController],
  providers: [UsersService, AddressesService],
  exports: [UsersService],
})
export class UsersModule {}
