import { Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../database/prisma.service'

const OTP_TTL_MS = 10 * 60 * 1000
const VERIFIED_WINDOW_MS = 30 * 60 * 1000
const MAX_ATTEMPTS = 5

@Injectable()
export class VerificationService {
  constructor(private prisma: PrismaService) {}

  async createOtp(identifier: string, purpose: 'email' | 'phone' | 'password-reset'): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const codeHash = await bcrypt.hash(code, 10)
    await this.prisma.otpCode.create({
      data: { identifier, purpose, codeHash, expiresAt: new Date(Date.now() + OTP_TTL_MS) },
    })
    return code
  }

  async verifyOtp(identifier: string, purpose: 'email' | 'phone' | 'password-reset', code: string): Promise<boolean> {
    const otp = await this.prisma.otpCode.findFirst({
      where: { identifier, purpose, consumed: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    })
    if (!otp || otp.attempts >= MAX_ATTEMPTS) return false

    const match = await bcrypt.compare(code, otp.codeHash)
    if (!match) {
      await this.prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } })
      return false
    }

    await this.prisma.otpCode.update({ where: { id: otp.id }, data: { consumed: true } })
    return true
  }

  async isVerified(identifier: string, purpose: 'email' | 'phone'): Promise<boolean> {
    const recent = await this.prisma.otpCode.findFirst({
      where: {
        identifier, purpose, consumed: true,
        createdAt: { gt: new Date(Date.now() - VERIFIED_WINDOW_MS) },
      },
      orderBy: { createdAt: 'desc' },
    })
    return !!recent
  }
}
