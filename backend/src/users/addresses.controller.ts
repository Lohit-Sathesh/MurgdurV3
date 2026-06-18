import { Controller, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AddressesService } from './addresses.service'
import { CreateAddressDto } from './dto/create-address.dto'
import { UpdateAddressDto } from './dto/update-address.dto'

@Controller('users/me/addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private addresses: AddressesService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateAddressDto) {
    return this.addresses.create(req.user.id, dto)
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateAddressDto) {
    return this.addresses.update(req.user.id, id, dto)
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.addresses.remove(req.user.id, id)
  }
}
