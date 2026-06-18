import { Controller, Post, Get, Delete, Patch, UploadedFiles, UploadedFile, UseGuards, UseInterceptors, Body, Param, Query } from '@nestjs/common'
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AdminGuard } from '../common/guards/admin.guard'
import { MediaService } from './media.service'

@Controller('media')
@UseGuards(JwtAuthGuard, AdminGuard)
export class MediaController {
  constructor(private media: MediaService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 10))
  upload(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('sku') sku: string,
    @Body('variantId') variantId?: string,
  ) {
    return this.media.uploadProductImages(files, sku, variantId)
  }

  @Post('upload-homepage')
  @UseInterceptors(FileInterceptor('file'))
  uploadHomepage(@UploadedFile() file: Express.Multer.File) {
    return this.media.uploadHomepageMedia(file)
  }

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(@UploadedFile() file: Express.Multer.File, @Body('prefix') prefix?: string) {
    return this.media.uploadGenericImage(file, prefix ?? 'general')
  }

  @Get('images')
  getImages(@Query('sku') sku: string) {
    return this.media.getProductImages(sku)
  }

  @Patch('images/:imageId')
  reorderImage(@Param('imageId') imageId: string, @Body('sortOrder') sortOrder: number) {
    return this.media.reorderProductImage(imageId, sortOrder)
  }

  @Delete('images/:imageId')
  deleteImage(@Param('imageId') imageId: string, @Query('sku') sku: string) {
    return this.media.deleteProductImage(sku, imageId)
  }
}
