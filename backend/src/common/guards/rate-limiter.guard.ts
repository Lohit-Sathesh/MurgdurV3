import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common'
import { RedisService } from '../../database/redis.service'

@Injectable()
export class RateLimiterGuard implements CanActivate {
  constructor(private redis: RedisService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest()
    const ip = req.ip ?? 'unknown'
    const key = `rate:${ip}:${req.path}`
    const limit = 20
    const window = 60

    const current = await this.redis.get(key)
    const count = current ? parseInt(current) : 0

    if (count >= limit) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS)
    }

    if (count === 0) {
      await this.redis.set(key, '1', window)
    } else {
      await this.redis.set(key, String(count + 1))
    }

    return true
  }
}