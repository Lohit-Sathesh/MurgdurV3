import { Injectable, Logger, UnauthorizedException, ConflictException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../database/prisma.service'
import { RedisService } from '../database/redis.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { EmailService } from '../email/email.service'
import { VerificationService } from '../verification/verification.service'
import { SmsService } from '../verification/sms.service'
import * as bcrypt from 'bcrypt'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  private readonly MAX_LOGIN_ATTEMPTS = 5
  private readonly LOGIN_LOCKOUT_SECONDS = 5 * 60 // 5-minute temporary block

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private redis: RedisService,
    private email: EmailService,
    private sms: SmsService,
    private verification: VerificationService,
  ) {}

  async sendEmailOtp(email: string) {
    const code = await this.verification.createOtp(email, 'email')
    try {
      await this.email.sendEmail(
        email,
        'Your Murgdur verification code',
        `<p>Your verification code is <strong>${code}</strong>. It expires in 10 minutes.</p>`,
      )
    } catch {
      this.logger.warn(`Email delivery failed — verification code for ${email}: ${code}`)
    }
    return { sent: true }
  }

  async verifyEmailOtp(email: string, code: string) {
    const ok = await this.verification.verifyOtp(email, 'email', code)
    if (!ok) throw new BadRequestException('Invalid or expired verification code')
    return { verified: true }
  }

  async sendPhoneOtp(phone: string) {
    const code = await this.verification.createOtp(phone, 'phone')
    await this.sms.sendSms(phone, `Your Murgdur verification code is ${code}. It expires in 10 minutes.`)
    return { sent: true }
  }

  async verifyPhoneOtp(phone: string, code: string) {
    const ok = await this.verification.verifyOtp(phone, 'phone', code)
    if (!ok) throw new BadRequestException('Invalid or expired verification code')
    return { verified: true }
  }

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (exists) throw new ConflictException('Email already registered')

    const emailVerified = await this.verification.isVerified(dto.email, 'email')
    if (!emailVerified) throw new BadRequestException('Please verify your email with the code sent to it before creating an account')

    let phoneVerified = false
    if (dto.phone) {
      phoneVerified = await this.verification.isVerified(dto.phone, 'phone')
      if (!phoneVerified) throw new BadRequestException('Please verify your phone number with the code sent to it before creating an account')
    }

    const passwordHash = await bcrypt.hash(dto.password, 12)
    const customerId = `MRG-${String(Date.now()).slice(-8)}`

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        customerId,
        emailVerified: true,
        phoneVerified,
      }
    })

    return this.generateTokens(user)
  }

  async login(dto: LoginDto, ip: string) {
    const email   = dto.email.toLowerCase()
    const ipKey   = `login_lock:ip:${ip}`
    const emailKey = `login_lock:email:${email}`

    // Check both IP block and account block independently
    const [ipAttempts, emailAttempts] = await Promise.all([
      this.redis.get(ipKey),
      this.redis.get(emailKey),
    ])

    if (ipAttempts && parseInt(ipAttempts) >= this.MAX_LOGIN_ATTEMPTS) {
      const retryAfter = await this.redis.ttl(ipKey)
      throw new HttpException(
        `Too many failed login attempts. Please try again in ${Math.ceil(retryAfter / 60)} minute(s).`,
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }

    if (emailAttempts && parseInt(emailAttempts) >= this.MAX_LOGIN_ATTEMPTS) {
      const retryAfter = await this.redis.ttl(emailKey)
      throw new HttpException(
        `Too many failed login attempts. Please try again in ${Math.ceil(retryAfter / 60)} minute(s).`,
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    const valid = user?.passwordHash ? await bcrypt.compare(dto.password, user.passwordHash) : false

    if (!user || !valid) {
      // Increment both counters — only set TTL on first increment
      await Promise.all([
        this.redis.incrWithExpiry(ipKey, this.LOGIN_LOCKOUT_SECONDS),
        this.redis.incrWithExpiry(emailKey, this.LOGIN_LOCKOUT_SECONDS),
      ])
      throw new UnauthorizedException('Invalid credentials')
    }

    // Reset both counters on successful login
    await Promise.all([
      this.redis.del(ipKey),
      this.redis.del(emailKey),
    ])
    return this.generateTokens(user)
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (user) {
      const code = await this.verification.createOtp(email, 'password-reset')
      try {
        await this.email.sendEmail(
          email,
          'Reset your Murgdur password',
          `<p>Your password reset code is <strong>${code}</strong>. It expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
        )
      } catch {
        this.logger.warn(`Email delivery failed — password reset code for ${email}: ${code}`)
      }
    }
    return { sent: true }
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const ok = await this.verification.verifyOtp(email, 'password-reset', code)
    if (!ok) throw new BadRequestException('Invalid or expired code')

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await this.prisma.user.update({ where: { email }, data: { passwordHash } })
    return { success: true }
  }

  async refreshTokens(refreshToken: string) {
    let payload: { sub: string }
    try {
      payload = this.jwt.verify(refreshToken, { secret: process.env.JWT_REFRESH_SECRET })
    } catch {
      throw new UnauthorizedException('Invalid refresh token')
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) throw new UnauthorizedException('Invalid refresh token')

    return this.generateTokens(user)
  }

  // ── Google OAuth sign-in / sign-up ────────────────────────────────────────
  async googleSignIn(profile: { email: string; firstName: string; lastName: string; picture?: string }) {
    let user = await this.prisma.user.findUnique({ where: { email: profile.email } })

    if (!user) {
      // Auto-register Google users — no password, emailVerified = true
      const customerId = `CUS-${Math.floor(100000 + Math.random() * 900000)}`
      user = await this.prisma.user.create({
        data: {
          email:         profile.email,
          firstName:     profile.firstName,
          lastName:      profile.lastName,
          customerId,
          emailVerified: true,
          avatarUrl:     profile.picture ?? null,
        },
      })
    }

    return this.generateTokens(user)
  }

  private generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email }
    return {
      accessToken: this.jwt.sign(payload, { expiresIn: '15m' }),
      refreshToken: this.jwt.sign(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d'
      }),
      customerId: user.customerId,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        customerId: user.customerId,
        role: user.role,
      }
    }
  }
}