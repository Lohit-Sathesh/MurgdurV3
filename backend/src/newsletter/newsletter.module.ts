import { Module } from '@nestjs/common'
import { EmailModule } from '../email/email.module'
import { NewsletterController } from './newsletter.controller'

@Module({
  imports: [EmailModule],
  controllers: [NewsletterController],
})
export class NewsletterModule {}
