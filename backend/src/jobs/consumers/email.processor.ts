import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import * as nodemailer from 'nodemailer'

@Processor('email')
export class EmailProcessor extends WorkerHost {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  async process(job: Job) {
    const { to, subject, html } = job.data
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM ?? 'noreply@murgdur.com',
        to, subject, html,
      })
      console.log(`✅ Email sent to ${to}`)
    } catch (err) {
      console.error(`❌ Email failed:`, err)
      throw err
    }
  }
}