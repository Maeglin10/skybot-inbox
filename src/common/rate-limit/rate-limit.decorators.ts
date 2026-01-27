import { Throttle } from '@nestjs/throttler';

/**
 * Custom rate limit decorators for different endpoint tiers
 *
 * ttl: Time to live in milliseconds
 * limit: Maximum number of requests within the TTL window
 */

/**
 * Strict rate limit for authentication endpoints
 * 5 requests per minute
 */
export const AuthRateLimit = () => Throttle({ default: { ttl: 60_000, limit: 5 } });

/**
 * Medium rate limit for sensitive operations
 * 20 requests per minute
 */
export const SensitiveRateLimit = () => Throttle({ default: { ttl: 60_000, limit: 20 } });

/**
 * Standard rate limit for regular API endpoints
 * 60 requests per minute
 */
export const StandardRateLimit = () => Throttle({ default: { ttl: 60_000, limit: 60 } });

/**
 * Relaxed rate limit for read-only endpoints
 * 120 requests per minute (matches global default)
 */
export const RelaxedRateLimit = () => Throttle({ default: { ttl: 60_000, limit: 120 } });

/**
 * Very strict rate limit for password reset and magic link requests
 * 3 requests per 5 minutes
 */
export const PasswordResetRateLimit = () => Throttle({ default: { ttl: 300_000, limit: 3 } });
