import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator'

export class UpdateProductDto {
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsString() description?: string
  @IsOptional() @IsNumber() @Min(0) price?: number
  @IsOptional() @IsBoolean() isActive?: boolean
  @IsOptional() @IsBoolean() isFeatured?: boolean
  @IsOptional() @IsString() material?: string
  @IsOptional() @IsNumber() @Min(0) comparePrice?: number
}