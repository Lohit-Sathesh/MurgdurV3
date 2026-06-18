import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import sharp from 'sharp'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

@Processor('media')
export class MediaProcessorWorker extends WorkerHost {
  private r2 = new S3Client({
    region: 'auto',
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })

  async process(job: Job) {
    const { buffer, productSlug, filename } = job.data
    const sizes = [
      { suffix: 'hero',   width: 1200 },
      { suffix: 'medium', width: 800  },
      { suffix: 'thumb',  width: 400  },
    ]

    for (const { suffix, width } of sizes) {
      const webp = await sharp(Buffer.from(buffer))
        .resize(width).webp({ quality: 90 }).toBuffer()
      const key = `products/${productSlug}/${Date.now()}-${suffix}.webp`
      await this.r2.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key, Body: webp,
        ContentType: 'image/webp',
      }))
    }

    console.log(`✅ Media processed for ${productSlug}`)
  }
}