import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { EmailProcessor } from './consumers/email.processor'
import { MediaProcessorWorker } from './consumers/media-processor.worker'

@Module({
  imports: [
    BullModule.forRoot({
      connection: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' }
    }),
    BullModule.registerQueue(
      { name: 'email' },
      { name: 'media' }
    ),
  ],
  providers: [EmailProcessor, MediaProcessorWorker],
})
export class JobsModule {}