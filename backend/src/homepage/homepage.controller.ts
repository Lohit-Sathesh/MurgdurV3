import { Controller, Get } from '@nestjs/common'
import { HomepageService } from './homepage.service'

@Controller('homepage')
export class HomepageController {
  constructor(private homepage: HomepageService) {}

  @Get('slides')
  getSlides() { return this.homepage.getActiveSlides() }

  @Get('blocks')
  getBlocks() { return this.homepage.getActiveBlocks() }
}
