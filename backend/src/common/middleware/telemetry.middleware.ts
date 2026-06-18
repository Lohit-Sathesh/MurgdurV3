import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

@Injectable()
export class TelemetryMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now()
    const { method, url } = req

    res.on('finish', () => {
      const duration = Date.now() - start
      console.log(`[${method}] ${url} ${res.statusCode} — ${duration}ms`)
      // Grafana Tempo span injection goes here when deployed
    })

    next()
  }
}