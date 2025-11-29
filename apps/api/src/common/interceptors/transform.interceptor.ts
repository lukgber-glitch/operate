import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

export interface Response<T> {
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest();
    const requestId = uuidv4();

    // Attach requestId to request for logging
    request.requestId = requestId;

    return next.handle().pipe(
      map((data) => {
        // Don't transform health check responses
        if (data?.status && data?.info && data?.details) {
          return data;
        }

        // Handle pagination metadata
        if (data?.data && data?.meta) {
          return {
            data: data.data,
            meta: {
              ...data.meta,
              timestamp: new Date().toISOString(),
              requestId,
            },
          };
        }

        // Standard response transformation
        return {
          data,
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        };
      }),
    );
  }
}
