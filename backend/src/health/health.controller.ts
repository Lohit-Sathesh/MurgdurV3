import { Controller, Get } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'

@Controller()
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get('health')
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() }
  }

  @Get('health/ready')
  async ready() {
    await this.prisma.$queryRaw`SELECT 1`
    return { status: 'ready' }
  }
}
