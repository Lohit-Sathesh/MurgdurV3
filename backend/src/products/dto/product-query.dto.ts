import { IsOptional, IsString, IsBoolean, IsInt, IsNumber, Min, IsIn } from 'class-validator'
import { Transform, Type } from 'class-transformer'

export class ProductQueryDto {
  @IsOptional() @IsString() q?: string           // text search on name/sku
  @IsOptional() @IsString() ids?: string         // comma-separated product IDs
  @IsOptional() @IsString() category?: string
  @IsOptional() @Transform(({ value }) => value === 'true') @IsBoolean() featured?: boolean
  @IsOptional() @Transform(({ value }) => value === 'true') @IsBoolean() newArrivals?: boolean
  @IsOptional() @IsString() color?: string
  @IsOptional() @IsString() size?: string
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minPrice?: number
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxPrice?: number
  @IsOptional() @IsIn(['price_asc', 'price_desc', 'newest']) sort?: string
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) offset?: number
}