import { Matches } from 'class-validator'
import { PHONE_REGEX, PHONE_VALIDATION_MESSAGE } from '../../common/validators/phone'

export class SendPhoneOtpDto {
  @Matches(PHONE_REGEX, { message: PHONE_VALIDATION_MESSAGE })
  phone!: string
}
