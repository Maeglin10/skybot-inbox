import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to inject tenant context into the request
 * Extracts accountId from authenticated user and adds it to request
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // If user is authenticated, extract accountId (tenant ID)
    if (req.user && (req.user as any).accountId) {
      // Add tenant context to request
      (req as any).tenantId = (req.user as any).accountId;
    }

    next();
  }
}
