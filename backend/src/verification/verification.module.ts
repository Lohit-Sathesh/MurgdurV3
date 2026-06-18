import { Module } from '@nestjs/common'
import { VerificationService } from './verification.service'
import { SmsService } from './sms.service'

@Module({
  providers: [VerificationService, SmsService],
  exports: [VerificationService, SmsService],
})
export class VerificationModule {}
