import { Channel } from '@prisma/client';

/**
 * Unified message format across all channels (WhatsApp, Instagram, Facebook, Webchat)
 * All connectors must normalize their incoming messages to this format
 */
export interface UnifiedMessage {
  /**
   * Unique identifier from the channel provider
   * Used for deduplication
   */
  externalId: string;

  /**
   * Channel type (WHATSAPP, INSTAGRAM, FACEBOOK, EMAIL, WEB)
   */
  channelType: Channel;

  /**
   * Channel-specific identifier (phone number, page ID, IG account ID, etc.)
   */
  channelIdentifier: string;

  /**
   * Message direction (inbound from customer, outbound to customer)
   */
  direction: 'inbound' | 'outbound';

  /**
   * Sender identifier (customer phone, IG user ID, FB user ID, etc.)
   */
  from: string;

  /**
   * Recipient identifier (business number, page ID, etc.)
   */
  to: string;

  /**
   * Message text content (if any)
   */
  text?: string;

  /**
   * Media URL (image, video, document, etc.)
   */
  mediaUrl?: string;

  /**
   * Media type (image/jpeg, video/mp4, application/pdf, etc.)
   */
  mediaType?: string;

  /**
   * Message timestamp (when sent/received)
   */
  timestamp: Date;

  /**
   * Channel-specific metadata (reactions, story replies, button responses, etc.)
   */
  metadata: Record<string, any>;

  /**
   * Conversation/thread identifier (if available from provider)
   */
  conversationExternalId?: string;

  /**
   * Contact name (if available from provider)
   */
  contactName?: string;

  /**
   * Message status (for outbound messages: sent, delivered, read, failed)
   */
  status?: string;
}

/**
 * Outgoing message format for sending messages through connectors
 */
export interface OutgoingMessage {
  /**
   * Recipient identifier (phone number, IG user ID, FB user ID)
   */
  to: string;

  /**
   * Message text
   */
  text?: string;

  /**
   * Media URL to send
   */
  mediaUrl?: string;

  /**
   * Media type
   */
  mediaType?: string;

  /**
   * Reply to specific message ID (for threading)
   */
  replyToMessageId?: string;

  /**
   * Additional message options (buttons, quick replies, etc.)
   */
  options?: Record<string, any>;
}
