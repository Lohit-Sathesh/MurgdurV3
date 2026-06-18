import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Decimal } from '@prisma/client/runtime/library'

function stripSensitive(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj
  if (obj instanceof Date) return obj
  if (Decimal.isDecimal(obj)) return obj.toNumber()
  if (Array.isArray(obj)) return obj.map(stripSensitive)
  const stripped = { ...obj }
  delete stripped.passwordHash
  delete stripped.tokenHash
  for (const key of Object.keys(stripped)) {
    stripped[key] = stripSensitive(stripped[key])
  }
  return stripped
}

@Injectable()
export class SerializerInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map(data => stripSensitive(data)))
  }
}