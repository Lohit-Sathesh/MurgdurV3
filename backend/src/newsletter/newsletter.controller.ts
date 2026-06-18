import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common'
import { EmailService } from '../email/email.service'
import { PrismaService } from '../database/prisma.service'
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard'
import { SubscribeDto } from './dto/subscribe.dto'

@Controller('newsletter')
export class NewsletterController {
  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('subscribe')
  @UseGuards(OptionalJwtAuthGuard)
  async subscribe(@Body() dto: SubscribeDto, @Req() req: any) {
    if (req.user) {
      if (req.user.newsletterSubscribed) {
        return { success: true, alreadySubscribed: true, message: 'Already subscribed' }
      }
      await this.prisma.user.update({
        where: { id: req.user.id },
        data: { newsletterSubscribed: true },
      })
    }

    await this.emailService.sendNewsletterWelcome(dto.email)
    return { success: true, message: 'Subscribed successfully' }
  }

  @Post('unsubscribe')
  @UseGuards(OptionalJwtAuthGuard)
  async unsubscribe(@Body() dto: SubscribeDto, @Req() req: any) {
    if (req.user) {
      await this.prisma.user.update({
        where: { id: req.user.id },
        data: { newsletterSubscribed: false },
      })
    } else {
      const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
      if (user?.newsletterSubscribed) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { newsletterSubscribed: false },
        })
      }
    }

    await this.emailService.sendNewsletterGoodbye(dto.email)
    return { success: true, message: 'Unsubscribed successfully' }
  }
}
