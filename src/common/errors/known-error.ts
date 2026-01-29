import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base class for all known/expected errors in the application
 * Inspired by Stack Auth's error handling pattern
 *
 * Benefits:
 * - Consistent error format across all endpoints
 * - Type-safe error handling
 * - Prevents information leakage (no stack traces to clients)
 * - Easy error tracking and categorization
 */
export class KnownError extends HttpException {
  constructor(
    public readonly errorCode: string,
    public readonly statusCode: HttpStatus,
    public readonly humanReadableMessage: string,
    public readonly details?: Record<string, any>,
  ) {
    super(
      {
        code: errorCode,
        message: humanReadableMessage,
        ...(details && { details }),
      },
      statusCode,
    );
    this.name = 'KnownError';
  }

  toJSON() {
    return {
      code: this.errorCode,
      error: this.humanReadableMessage,
      ...(this.details && { details: this.details }),
    };
  }
}

// ============================================
// AUTHENTICATION ERRORS
// ============================================

export class InvalidCredentialsError extends KnownError {
  constructor() {
    super(
      'INVALID_CREDENTIALS',
      HttpStatus.UNAUTHORIZED,
      'Invalid credentials',
    );
  }
}

export class InvalidAccessTokenError extends KnownError {
  constructor(message = 'Invalid or expired access token') {
    super('INVALID_ACCESS_TOKEN', HttpStatus.UNAUTHORIZED, message);
  }
}

export class InvalidRefreshTokenError extends KnownError {
  constructor(message = 'Invalid or expired refresh token') {
    super('INVALID_REFRESH_TOKEN', HttpStatus.UNAUTHORIZED, message);
  }
}

export class SessionExpiredError extends KnownError {
  constructor() {
    super(
      'SESSION_EXPIRED',
      HttpStatus.UNAUTHORIZED,
      'Your session has expired. Please log in again.',
    );
  }
}

export class SessionRevokedError extends KnownError {
  constructor() {
    super(
      'SESSION_REVOKED',
      HttpStatus.UNAUTHORIZED,
      'This session has been revoked',
    );
  }
}

export class EmailNotVerifiedError extends KnownError {
  constructor() {
    super(
      'EMAIL_NOT_VERIFIED',
      HttpStatus.FORBIDDEN,
      'Please verify your email address before continuing',
    );
  }
}

export class AccountInactiveError extends KnownError {
  constructor() {
    super(
      'ACCOUNT_INACTIVE',
      HttpStatus.FORBIDDEN,
      'Your account is inactive. Please contact support.',
    );
  }
}

// ============================================
// AUTHORIZATION ERRORS
// ============================================

export class InsufficientPermissionsError extends KnownError {
  constructor(requiredPermission?: string) {
    super(
      'INSUFFICIENT_PERMISSIONS',
      HttpStatus.FORBIDDEN,
      'You do not have permission to perform this action',
      requiredPermission ? { requiredPermission } : undefined,
    );
  }
}

export class ResourceNotOwnedError extends KnownError {
  constructor(resourceType: string, resourceId: string) {
    super(
      'RESOURCE_NOT_OWNED',
      HttpStatus.FORBIDDEN,
      `You do not have access to this ${resourceType}`,
      { resourceType, resourceId },
    );
  }
}

// ============================================
// RESOURCE ERRORS
// ============================================

export class ResourceNotFoundError extends KnownError {
  constructor(resourceType: string, identifier?: string) {
    super(
      'RESOURCE_NOT_FOUND',
      HttpStatus.NOT_FOUND,
      `${resourceType} not found`,
      identifier ? { identifier } : undefined,
    );
  }
}

export class ConversationNotFoundError extends KnownError {
  constructor(conversationId: string) {
    super(
      'CONVERSATION_NOT_FOUND',
      HttpStatus.NOT_FOUND,
      'Conversation not found',
      { conversationId },
    );
  }
}

export class MessageNotFoundError extends KnownError {
  constructor(messageId: string) {
    super(
      'MESSAGE_NOT_FOUND',
      HttpStatus.NOT_FOUND,
      'Message not found',
      { messageId },
    );
  }
}

export class UserNotFoundError extends KnownError {
  constructor(identifier?: string) {
    super(
      'USER_NOT_FOUND',
      HttpStatus.NOT_FOUND,
      'User not found',
      identifier ? { identifier } : undefined,
    );
  }
}

export class AccountNotFoundError extends KnownError {
  constructor(accountId?: string) {
    super(
      'ACCOUNT_NOT_FOUND',
      HttpStatus.NOT_FOUND,
      'Account not found',
      accountId ? { accountId } : undefined,
    );
  }
}

// ============================================
// VALIDATION ERRORS
// ============================================

export class DuplicateResourceError extends KnownError {
  constructor(resourceType: string, field: string, value: string) {
    super(
      'DUPLICATE_RESOURCE',
      HttpStatus.CONFLICT,
      `A ${resourceType} with this ${field} already exists`,
      { resourceType, field, value },
    );
  }
}

export class UserAlreadyExistsError extends KnownError {
  constructor(username: string) {
    super(
      'USER_ALREADY_EXISTS',
      HttpStatus.CONFLICT,
      'A user with this username already exists',
      { username },
    );
  }
}

export class InvalidInputError extends KnownError {
  constructor(message: string, field?: string) {
    super(
      'INVALID_INPUT',
      HttpStatus.BAD_REQUEST,
      message,
      field ? { field } : undefined,
    );
  }
}

export class ValidationFailedError extends KnownError {
  constructor(errors: Record<string, string[]>) {
    super(
      'VALIDATION_FAILED',
      HttpStatus.BAD_REQUEST,
      'Validation failed',
      { errors },
    );
  }
}

// ============================================
// RATE LIMITING
// ============================================

export class RateLimitExceededError extends KnownError {
  constructor(retryAfterSeconds?: number) {
    super(
      'RATE_LIMIT_EXCEEDED',
      HttpStatus.TOO_MANY_REQUESTS,
      'Too many requests. Please try again later.',
      retryAfterSeconds ? { retryAfter: retryAfterSeconds } : undefined,
    );
  }
}

export class MaxAttemptsReachedError extends KnownError {
  constructor(attemptsType: string, resetTimeSeconds?: number) {
    super(
      'MAX_ATTEMPTS_REACHED',
      HttpStatus.TOO_MANY_REQUESTS,
      `Maximum ${attemptsType} attempts reached`,
      resetTimeSeconds ? { resetAfter: resetTimeSeconds } : undefined,
    );
  }
}

// ============================================
// BUSINESS LOGIC ERRORS
// ============================================

export class InvalidStateTransitionError extends KnownError {
  constructor(fromState: string, toState: string) {
    super(
      'INVALID_STATE_TRANSITION',
      HttpStatus.BAD_REQUEST,
      `Cannot transition from ${fromState} to ${toState}`,
      { fromState, toState },
    );
  }
}

export class OperationNotAllowedError extends KnownError {
  constructor(operation: string, reason: string) {
    super(
      'OPERATION_NOT_ALLOWED',
      HttpStatus.FORBIDDEN,
      `Cannot ${operation}: ${reason}`,
      { operation, reason },
    );
  }
}

export class ExternalServiceError extends KnownError {
  constructor(serviceName: string, operation: string) {
    super(
      'EXTERNAL_SERVICE_ERROR',
      HttpStatus.BAD_GATEWAY,
      `Failed to ${operation} with ${serviceName}`,
      { serviceName, operation },
    );
  }
}

export class AirtableApiError extends KnownError {
  constructor(operation: string, details?: string) {
    super(
      'AIRTABLE_API_ERROR',
      HttpStatus.BAD_GATEWAY,
      `Airtable API error during ${operation}`,
      details ? { details } : undefined,
    );
  }
}

export class N8NApiError extends KnownError {
  constructor(operation: string, details?: string) {
    super(
      'N8N_API_ERROR',
      HttpStatus.BAD_GATEWAY,
      `N8N API error during ${operation}`,
      details ? { details } : undefined,
    );
  }
}

export class WhatsAppApiError extends KnownError {
  constructor(operation: string, errorCode?: string) {
    super(
      'WHATSAPP_API_ERROR',
      HttpStatus.BAD_GATEWAY,
      `WhatsApp API error during ${operation}`,
      errorCode ? { whatsappErrorCode: errorCode } : undefined,
    );
  }
}

// ============================================
// IDEMPOTENCY ERRORS
// ============================================

export class IdempotencyKeyConflictError extends KnownError {
  constructor(key: string) {
    super(
      'IDEMPOTENCY_KEY_CONFLICT',
      HttpStatus.CONFLICT,
      'This operation has already been performed',
      { idempotencyKey: key },
    );
  }
}

// ============================================
// FEATURE FLAGS
// ============================================

export class FeatureNotEnabledError extends KnownError {
  constructor(featureName: string) {
    super(
      'FEATURE_NOT_ENABLED',
      HttpStatus.FORBIDDEN,
      `The ${featureName} feature is not enabled for your account`,
      { feature: featureName },
    );
  }
}

// ============================================
// SUBSCRIPTION/BILLING
// ============================================

export class SubscriptionRequiredError extends KnownError {
  constructor(feature: string, requiredTier: string) {
    super(
      'SUBSCRIPTION_REQUIRED',
      HttpStatus.PAYMENT_REQUIRED,
      `This feature requires a ${requiredTier} subscription`,
      { feature, requiredTier },
    );
  }
}

export class QuotaExceededError extends KnownError {
  constructor(quotaType: string, limit: number) {
    super(
      'QUOTA_EXCEEDED',
      HttpStatus.PAYMENT_REQUIRED,
      `${quotaType} quota exceeded (limit: ${limit})`,
      { quotaType, limit },
    );
  }
}
