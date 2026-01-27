import { UnifiedMessage, OutgoingMessage } from './unified-message.interface';
import { ConnectionStatus } from './connection-status.interface';

/**
 * OAuth response containing authorization URL and state
 */
export interface OAuthStartResponse {
  /**
   * URL to redirect user to for OAuth authorization
   */
  authUrl: string;

  /**
   * State parameter (JWT containing accountId, returnUrl, etc.)
   */
  state: string;
}

/**
 * OAuth callback data after user authorizes
 */
export interface OAuthCallbackData {
  /**
   * Authorization code from OAuth provider
   */
  code: string;

  /**
   * State parameter returned from provider
   */
  state: string;

  /**
   * Optional error from provider
   */
  error?: string;

  /**
   * Optional error description
   */
  error_description?: string;
}

/**
 * Asset selection for multi-asset channels (e.g., Meta with multiple Pages/IG accounts)
 */
export interface AssetSelection {
  /**
   * Account ID
   */
  accountId: string;

  /**
   * Selected asset ID (Page ID, IG account ID, etc.)
   */
  assetId: string;

  /**
   * Asset type (page, instagram_account, etc.)
   */
  assetType: string;

  /**
   * Asset metadata (name, username, etc.)
   */
  metadata?: Record<string, any>;
}

/**
 * Base interface that all channel connectors must implement
 * Ensures consistent behavior across WhatsApp, Instagram, Facebook, Webchat, etc.
 */
export interface ChannelConnector {
  /**
   * Channel type identifier (whatsapp, instagram, facebook, webchat)
   */
  readonly channelType: string;

  /**
   * Start OAuth authorization flow
   * @param accountId The business account ID
   * @param returnUrl Optional URL to redirect to after OAuth
   * @returns Authorization URL and state
   */
  startAuth(accountId: string, returnUrl?: string): Promise<OAuthStartResponse>;

  /**
   * Handle OAuth callback after user authorizes
   * Exchanges code for token, stores encrypted token in database
   * @param callbackData OAuth callback data (code, state)
   * @returns Connection ID
   */
  handleCallback(callbackData: OAuthCallbackData): Promise<string>;

  /**
   * Select specific asset to use (for multi-asset connectors like Meta)
   * @param selection Asset selection data
   */
  selectAsset?(selection: AssetSelection): Promise<void>;

  /**
   * Get connection status and health
   * @param connectionId Connection ID
   * @returns Connection status
   */
  getStatus(connectionId: string): Promise<ConnectionStatus>;

  /**
   * Ingest and normalize a webhook payload to UnifiedMessage
   * @param payload Raw webhook payload from provider
   * @param headers Request headers (for signature verification)
   * @returns Normalized unified message(s)
   */
  ingestWebhook(
    payload: any,
    headers: Record<string, string>,
  ): Promise<UnifiedMessage[]>;

  /**
   * Send a message through this channel
   * @param connectionId Connection ID
   * @param message Outgoing message
   * @returns External message ID from provider
   */
  sendMessage(connectionId: string, message: OutgoingMessage): Promise<string>;

  /**
   * Refresh OAuth token (if applicable)
   * @param connectionId Connection ID
   */
  refreshToken?(connectionId: string): Promise<void>;

  /**
   * Disconnect/deauthorize a connection
   * @param connectionId Connection ID
   */
  disconnect(connectionId: string): Promise<void>;
}
