import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator'

export class UpdateAddressDto {
  @IsOptional() @IsString() @MaxLength(50) label?: string
  @IsOptional() @IsString() @MaxLength(50) firstName?: string
  @IsOptional() @IsString() @MaxLength(50) lastName?: string
  @IsOptional() @IsString() @MaxLength(200) line1?: string
  @IsOptional() @IsString() @MaxLength(200) line2?: string
  @IsOptional() @IsString() @MaxLength(100) city?: string
  @IsOptional() @IsString() @MaxLength(100) state?: string
  @IsOptional() @IsString() @MaxLength(20) postalCode?: string
  @IsOptional() @IsString() @MaxLength(2) country?: string
  @IsOptional() @IsString() @MaxLength(20) phone?: string
  @IsOptional() @IsBoolean() isDefault?: boolean
}
