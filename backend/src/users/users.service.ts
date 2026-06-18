import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { VerificationService } from '../verification/verification.service'
import { UpdateUserDto } from './dto/update-user.dto'

const USER_SELECT = {
  id: true,
  customerId: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatarUrl: true,
  role: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
  addresses: true,
  passwordHash: false,
}

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private verification: VerificationService,
  ) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        customerId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        emailVerified: true,
        phoneVerified: true,
        newsletterSubscribed: true,
        createdAt: true,
        updatedAt: true,
        addresses: true,
      }
    })
    if (!user) throw new NotFoundException('User not found')
    return user
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    const data: any = { ...dto }

    if (dto.phone) {
      const current = await this.prisma.user.findUnique({ where: { id: userId }, select: { phone: true } })
      if (dto.phone !== current?.phone) {
        const verified = await this.verification.isVerified(dto.phone, 'phone')
        if (!verified) throw new BadRequestException('Please verify your phone number with the code sent to it before saving')
        data.phoneVerified = true
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        customerId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        phoneVerified: true,
        createdAt: true,
        updatedAt: true,
      }
    })
  }
}