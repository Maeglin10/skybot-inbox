import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENT_KEY = 'idempotent';

/**
 * Decorator to enable idempotency for a route handler
 *
 * Usage:
 * ```typescript
 * @Post('messages')
 * @Idempotent()
 * async sendMessage(@Body() dto: SendMessageDto) {
 *   // ...
 * }
 * ```
 *
 * Clients should send an Idempotency-Key header:
 * ```
 * POST /api/messages
 * Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
 * Content-Type: application/json
 *
 * {
 *   "conversationId": "123",
 *   "text": "Hello"
 * }
 * ```
 */
export const Idempotent = () => SetMetadata(IDEMPOTENT_KEY, true);
