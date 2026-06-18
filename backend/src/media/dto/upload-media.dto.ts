import { IsIn, IsOptional, IsString } from 'class-validator';

export class UploadMediaDto {
  @IsString()
  filename!: string;

  @IsOptional()
  @IsIn(['image', 'video'])
  kind?: 'image' | 'video';

  @IsOptional()
  @IsString()
  productId?: string;
}
