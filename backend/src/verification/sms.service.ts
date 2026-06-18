import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name)

  async sendSms(to: string, message: string) {
    // No SMS provider configured yet — log so OTPs are visible during development.
    this.logger.log(`SMS to ${to}: ${message}`)
    return { success: true }
  }
}
