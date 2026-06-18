import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module'
import { SiteConfigController } from './site-config.controller'
import { SiteConfigService } from './site-config.service'

@Module({
  imports: [DatabaseModule],
  controllers: [SiteConfigController],
  providers: [SiteConfigService],
  exports: [SiteConfigService],
})
export class SiteConfigModule {}
