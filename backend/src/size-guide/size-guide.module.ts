import { Module } from '@nestjs/common'
import { MulterModule } from '@nestjs/platform-express'
import { DatabaseModule } from '../database/database.module'
import { SizeGuideService }    from './size-guide.service'
import { SizeGuideController } from './size-guide.controller'

@Module({
  imports: [
    DatabaseModule,
    MulterModule.register({ storage: undefined }), // memory storage for buffers
  ],
  controllers: [SizeGuideController],
  providers:   [SizeGuideService],
  exports:     [SizeGuideService],
})
export class SizeGuideModule {}
