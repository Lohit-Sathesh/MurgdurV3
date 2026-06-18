import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards, UseInterceptors,
  UploadedFile,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AdminGuard }   from '../common/guards/admin.guard'
import { SizeGuideService } from './size-guide.service'

@Controller('size-guides')
export class SizeGuideController {
  constructor(private readonly sizeGuide: SizeGuideService) {}

  // ── Public ────────────────────────────────────────────────────────────
  @Get()
  findAll() { return this.sizeGuide.findAll() }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.sizeGuide.findOne(id) }

  // ── Admin ─────────────────────────────────────────────────────────────
  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@Body() body: { name: string; sortOrder?: number; blocks?: any[] }) {
    return this.sizeGuide.create(body)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param('id') id: string, @Body() body: { name?: string; sortOrder?: number; blocks?: any[] }) {
    return this.sizeGuide.update(id, body)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param('id') id: string) { return this.sizeGuide.remove(id) }

  @Post('upload-image')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const url = await this.sizeGuide.uploadImage(file)
    return { url }
  }
}
