import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { IdempotencyService } from './idempotency.service';

/**
 * Idempotency Interceptor
 *
 * Prevents duplicate operations by caching responses based on Idempotency-Key header
 *
 * Usage:
 * - Client sends: Idempotency-Key: unique-key-123
 * - First request: Processes normally and caches response
 * - Subsequent requests with same key: Returns cached response immediately
 *
 * Best practices:
 * - Use UUIDs as idempotency keys
 * - Keys expire after 24 hours
 * - Only applies to POST, PUT, PATCH methods
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly idempotencyService: IdempotencyService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Only apply to mutating operations
    const method = request.method;
    if (!['POST', 'PUT', 'PATCH'].includes(method)) {
      return next.handle();
    }

    // Check for Idempotency-Key header
    const idempotencyKey = request.headers['idempotency-key'];
    if (!idempotencyKey) {
      // No idempotency key provided - process normally
      return next.handle();
    }

    // Extract accountId from authenticated user
    const accountId = request.user?.accountId || request.accountId;
    if (!accountId) {
      // Can't enforce idempotency without accountId - process normally
      return next.handle();
    }

    // Check if this key has been used before
    const cached = await this.idempotencyService.checkIdempotency({
      accountId,
      key: idempotencyKey,
      endpoint: request.url,
      method: request.method,
      requestBody: request.body,
    });

    if (cached) {
      // Return cached response
      response.status(cached.statusCode);
      return of(cached.responseBody);
    }

    // First time seeing this key - process request and cache result
    return next.handle().pipe(
      tap(async (responseBody) => {
        await this.idempotencyService.storeResult({
          accountId,
          key: idempotencyKey,
          endpoint: request.url,
          method: request.method,
          requestBody: request.body,
          statusCode: response.statusCode || 200,
          responseBody,
        });
      }),
    );
  }
}
