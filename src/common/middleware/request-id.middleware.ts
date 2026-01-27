import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

/**
 * Request ID Middleware
 *
 * Generates a unique ID for each incoming request and attaches it to:
 * 1. The request object (req.id)
 * 2. The response headers (X-Request-ID)
 * 3. The logger context for structured logging
 *
 * This allows tracing requests across the entire application lifecycle.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Check if request already has an ID (from upstream proxy/load balancer)
    const existingId = req.headers['x-request-id'] as string;
    const requestId = existingId || randomUUID();

    // Attach to request object
    req.id = requestId;

    // Add to response headers
    res.setHeader('X-Request-ID', requestId);

    // Create child logger with request ID context
    const childLogger = this.logger.child({ requestId });

    // Log incoming request
    childLogger.info('Incoming request', {
      method: req.method,
      url: req.originalUrl || req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    // Track request start time
    const startTime = Date.now();

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

      childLogger[logLevel]('Request completed', {
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        durationMs: duration,
      });
    });

    next();
  }
}
