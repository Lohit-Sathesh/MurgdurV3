import { IsString, IsOptional, MaxLength, Matches } from 'class-validator'
import { PHONE_REGEX, PHONE_VALIDATION_MESSAGE } from '../../common/validators/phone'

export class UpdateUserDto {
  @IsOptional() @IsString() @MaxLength(50) firstName?: string
  @IsOptional() @IsString() @MaxLength(50) lastName?: string
  @IsOptional() @Matches(PHONE_REGEX, { message: PHONE_VALIDATION_MESSAGE }) phone?: string
  @IsOptional() @IsString() avatarUrl?: string
}
