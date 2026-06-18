import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import helmet from 'helmet'
import * as Sentry from '@sentry/node'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import { SerializerInterceptor } from './common/interceptors/serializer.interceptor'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

async function bootstrap() {
  Sentry.init({ dsn: process.env.SENTRY_DSN })

  const app = await NestFactory.create(AppModule, { rawBody: true })

  app.use(helmet())
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  })
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }))
  app.useGlobalInterceptors(new SerializerInterceptor(), new TransformInterceptor())
  app.useGlobalFilters(new HttpExceptionFilter())

  await app.listen(process.env.PORT ?? 3001)
  console.log(`🚀 Murgdur API running on port ${process.env.PORT ?? 3001}`)
}
bootstrap()