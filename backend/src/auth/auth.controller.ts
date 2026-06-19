import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import { SendEmailOtpDto } from './dto/send-email-otp.dto'
import { VerifyEmailOtpDto } from './dto/verify-email-otp.dto'
import { SendPhoneOtpDto } from './dto/send-phone-otp.dto'
import { VerifyPhoneOtpDto } from './dto/verify-phone-otp.dto'
import { ForgotPasswordDto } from './dto/forgot-password.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) { return this.auth.register(dto) }

  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request) {
    // X-Forwarded-For is set by reverse proxies (nginx, Cloudflare, etc.) in production
    const forwarded = req.headers['x-forwarded-for']
    const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]) ?? req.ip ?? 'unknown'
    return this.auth.login(dto, ip.trim())
  }

  @Post('google')
  googleSignIn(@Body() body: { email: string; firstName: string; lastName: string; picture?: string }) {
    return this.auth.googleSignIn(body)
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) { return this.auth.refreshTokens(dto.refreshToken) }

  @Post('send-email-otp')
  sendEmailOtp(@Body() dto: SendEmailOtpDto) { return this.auth.sendEmailOtp(dto.email) }

  @Post('verify-email-otp')
  verifyEmailOtp(@Body() dto: VerifyEmailOtpDto) { return this.auth.verifyEmailOtp(dto.email, dto.code) }

  @Post('send-phone-otp')
  sendPhoneOtp(@Body() dto: SendPhoneOtpDto) { return this.auth.sendPhoneOtp(dto.phone) }

  @Post('verify-phone-otp')
  verifyPhoneOtp(@Body() dto: VerifyPhoneOtpDto) { return this.auth.verifyPhoneOtp(dto.phone, dto.code) }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) { return this.auth.forgotPassword(dto.email) }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) { return this.auth.resetPassword(dto.email, dto.code, dto.newPassword) }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: any) {
    const u = req.user
    return { id: u.id, email: u.email, role: u.role, firstName: u.firstName, lastName: u.lastName }
  }
}