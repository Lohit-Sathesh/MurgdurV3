import { IsString, Length, Matches } from 'class-validator'
import { PHONE_REGEX, PHONE_VALIDATION_MESSAGE } from '../../common/validators/phone'

export class VerifyPhoneOtpDto {
  @Matches(PHONE_REGEX, { message: PHONE_VALIDATION_MESSAGE })
  phone!: string

  @IsString()
  @Length(6, 6)
  code!: string
}
