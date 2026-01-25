/**
 * Channel connection health status
 */
export interface ConnectionStatus {
  /**
   * Connection ID
   */
  connectionId: string;

  /**
   * Channel type
   */
  channelType: string;

  /**
   * Status (active, inactive, error, pending)
   */
  status: 'active' | 'inactive' | 'error' | 'pending';

  /**
   * Is the token valid and not expired?
   */
  isTokenValid: boolean;

  /**
   * Last successful sync/test timestamp
   */
  lastSync?: Date;

  /**
   * Last error message (if any)
   */
  lastError?: string;

  /**
   * Token expiry date (if applicable)
   */
  tokenExpiresAt?: Date;

  /**
   * Channel-specific metadata (page name, username, etc.)
   */
  metadata?: Record<string, any>;
}
