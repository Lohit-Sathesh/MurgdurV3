import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator'

export class CreateAddressDto {
  @IsOptional() @IsString() @MaxLength(50) label?: string
  @IsString() @MaxLength(50) firstName!: string
  @IsString() @MaxLength(50) lastName!: string
  @IsString() @MaxLength(200) line1!: string
  @IsOptional() @IsString() @MaxLength(200) line2?: string
  @IsString() @MaxLength(100) city!: string
  @IsString() @MaxLength(100) state!: string
  @IsString() @MaxLength(20) postalCode!: string
  @IsOptional() @IsString() @MaxLength(2) country?: string
  @IsOptional() @IsString() @MaxLength(20) phone?: string
  @IsOptional() @IsBoolean() isDefault?: boolean
}
