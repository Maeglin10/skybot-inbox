import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { KnownError } from '../errors/known-error';

/**
 * Global exception filter for consistent error handling
 * Inspired by Stack Auth's error handling pattern
 *
 * Handles:
 * - KnownError (our custom errors)
 * - HttpException (NestJS errors)
 * - Prisma errors (database errors)
 * - Unknown errors (unexpected errors)
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, body } = this.handleException(exception);

    // Log error with context (but not in production for known errors)
    if (!(exception instanceof KnownError) || status >= 500) {
      this.logger.error({
        message: 'Exception caught',
        error: exception instanceof Error ? exception.message : 'Unknown error',
        stack: exception instanceof Error ? exception.stack : undefined,
        path: request.url,
        method: request.method,
        statusCode: status,
        user: (request as any).user?.id,
      });
    }

    response.status(status).json({
      ...body,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private handleException(exception: unknown): {
    status: number;
    body: Record<string, any>;
  } {
    // 1. KnownError - our custom error hierarchy
    if (exception instanceof KnownError) {
      return {
        status: exception.statusCode,
        body: exception.toJSON(),
      };
    }

    // 2. Prisma errors - database errors
    if (this.isPrismaError(exception)) {
      return this.handlePrismaError(exception);
    }

    // 3. NestJS HttpException
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      return {
        status,
        body: {
          code: this.getErrorCodeFromStatus(status),
          error:
            typeof response === 'string'
              ? response
              : (response as any).message || 'An error occurred',
          ...(typeof response === 'object' && response !== null
            ? { details: response }
            : {}),
        },
      };
    }

    // 4. Unknown errors - don't leak information
    this.logger.error('Unexpected error:', exception);

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        code: 'INTERNAL_SERVER_ERROR',
        error:
          process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : exception instanceof Error
              ? exception.message
              : 'Unknown error',
      },
    };
  }

  private isPrismaError(
    exception: unknown,
  ): exception is Prisma.PrismaClientKnownRequestError {
    return (
      exception instanceof Prisma.PrismaClientKnownRequestError ||
      exception instanceof Prisma.PrismaClientUnknownRequestError ||
      exception instanceof Prisma.PrismaClientValidationError
    );
  }

  private handlePrismaError(
    error: Prisma.PrismaClientKnownRequestError,
  ): { status: number; body: Record<string, any> } {
    // P2002: Unique constraint violation
    if (error.code === 'P2002') {
      const fields = (error.meta?.target as string[]) || [];
      return {
        status: HttpStatus.CONFLICT,
        body: {
          code: 'DUPLICATE_RESOURCE',
          error: `A record with this ${fields.join(', ')} already exists`,
          details: { fields },
        },
      };
    }

    // P2025: Record not found
    if (error.code === 'P2025') {
      return {
        status: HttpStatus.NOT_FOUND,
        body: {
          code: 'RESOURCE_NOT_FOUND',
          error: 'The requested resource was not found',
        },
      };
    }

    // P2003: Foreign key constraint violation
    if (error.code === 'P2003') {
      const field = error.meta?.field_name as string;
      return {
        status: HttpStatus.BAD_REQUEST,
        body: {
          code: 'INVALID_REFERENCE',
          error: `Invalid reference: ${field}`,
          details: { field },
        },
      };
    }

    // P2014: Relation violation
    if (error.code === 'P2014') {
      return {
        status: HttpStatus.BAD_REQUEST,
        body: {
          code: 'RELATION_VIOLATION',
          error: 'Cannot perform operation due to existing relations',
        },
      };
    }

    // Generic Prisma error
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        code: 'DATABASE_ERROR',
        error:
          process.env.NODE_ENV === 'production'
            ? 'A database error occurred'
            : error.message,
      },
    };
  }

  private getErrorCodeFromStatus(status: number): string {
    const statusMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    };

    return statusMap[status] || 'UNKNOWN_ERROR';
  }
}
