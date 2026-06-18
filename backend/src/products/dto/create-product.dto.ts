import { IsString, IsNumber, IsOptional, IsUUID, IsBoolean, IsHexColor, Min, IsArray, ValidateNested, IsInt } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateVariantDto {
  @IsOptional() @IsString() color?: string
  @IsOptional() @IsString() colorHex?: string
  @IsOptional() @IsString() size?: string
  @IsInt() @Min(0) stock!: number
}

export class CreateProductDto {
  @IsString() name!: string
  @IsString() description!: string
  @IsNumber() @Min(0) price!: number
  @IsUUID() categoryId!: string
  @IsOptional() @IsString() slug?: string
  @IsOptional() @IsString() sizeGuideId?: string | null
  @IsOptional() @IsString() material?: string
  @IsOptional() @IsBoolean() isFeatured?: boolean
  @IsOptional() @IsNumber() comparePrice?: number
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateVariantDto) variants?: CreateVariantDto[]
  @IsOptional() @IsInt() @Min(8) styleFontSize?: number
  @IsOptional() @IsHexColor() styleTextColor?: string
  @IsOptional() @IsHexColor() styleAccentColor?: string
  @IsOptional() @IsHexColor() styleBgColor?: string
}
