import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis

  onModuleInit() {
    this.client = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379')
    this.client.on('error', (err) => console.error('Redis error:', err))
  }

  async onModuleDestroy() { await this.client.quit() }

  async get(key: string) { return this.client.get(key) }
  async set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds) return this.client.setex(key, ttlSeconds, value)
    return this.client.set(key, value)
  }
  async del(key: string) { return this.client.del(key) }
  async exists(key: string) { return this.client.exists(key) }
  async ttl(key: string) { return this.client.ttl(key) }

  async incrWithExpiry(key: string, ttlSeconds: number) {
    const count = await this.client.incr(key)
    if (count === 1) await this.client.expire(key, ttlSeconds)
    return count
  }
}