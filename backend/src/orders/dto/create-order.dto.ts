import { IsUUID, IsArray, ValidateNested, IsInt, Min, IsOptional, IsIn } from 'class-validator'
import { Type } from 'class-transformer'

class OrderItemDto {
  @IsUUID() productId!: string
  @IsOptional() @IsUUID() variantId?: string
  @IsInt() @Min(1) quantity!: number
}

export class CreateOrderDto {
  @IsUUID() addressId!: string
  @IsArray() @ValidateNested({ each: true }) @Type(() => OrderItemDto)
  items!: OrderItemDto[]
  @IsIn(['RAZORPAY', 'COD']) paymentMethod!: string
}