import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { CreateAddressDto } from './dto/create-address.dto'
import { UpdateAddressDto } from './dto/update-address.dto'

@Injectable()
export class AddressesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateAddressDto) {
    if (dto.isDefault) {
      await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } })
    }
    return this.prisma.address.create({ data: { ...dto, userId } })
  }

  async update(userId: string, addressId: string, dto: UpdateAddressDto) {
    await this.ensureOwnership(userId, addressId)
    if (dto.isDefault) {
      await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } })
    }
    return this.prisma.address.update({ where: { id: addressId }, data: dto })
  }

  async remove(userId: string, addressId: string) {
    await this.ensureOwnership(userId, addressId)
    await this.prisma.address.delete({ where: { id: addressId } })
    return { success: true }
  }

  private async ensureOwnership(userId: string, addressId: string) {
    const address = await this.prisma.address.findUnique({ where: { id: addressId } })
    if (!address || address.userId !== userId) throw new NotFoundException('Address not found')
    return address
  }
}
