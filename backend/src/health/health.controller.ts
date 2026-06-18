import { Controller, Get, Res } from '@nestjs/common'
import type { Response } from 'express'
import * as client from 'prom-client'
import { PrismaService } from '../database/prisma.service'

client.collectDefaultMetrics()

@Controller()
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get('health')
  async check() {
    return { status: 'ok', timestamp: new Date().toISOString() }
  }

  @Get('health/ready')
  async ready() {
    await this.prisma.$queryRaw`SELECT 1`
    return { status: 'ready' }
  }

  @Get('metrics')
  async metrics(@Res() res: Response) {
    res.set('Content-Type', client.register.contentType)
    res.send(await client.register.metrics())
  }
}
