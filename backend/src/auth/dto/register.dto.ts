import { IsEmail, IsString, IsOptional, MaxLength, MinLength, Matches } from 'class-validator';
import { PHONE_REGEX, PHONE_VALIDATION_MESSAGE } from '../../common/validators/phone';

export class RegisterDto {
  @IsString()
  @MaxLength(50)
  firstName!: string;

  @IsString()
  @MaxLength(50)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @Matches(PHONE_REGEX, { message: PHONE_VALIDATION_MESSAGE })
  phone?: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
