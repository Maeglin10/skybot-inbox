import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { winstonLogger } from '../logger/winston.config';

interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
}

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly encryptionKey: Buffer;

  constructor() {
    // Get encryption key from environment or use a default for development
    const keyHex = process.env.TOKENS_ENCRYPTION_KEY;

    if (!keyHex) {
      winstonLogger.warn(
        'TOKENS_ENCRYPTION_KEY not set - using development key',
        { warning: 'DO NOT USE IN PRODUCTION' },
      );
      // Default dev key (64 hex chars = 32 bytes)
      this.encryptionKey = Buffer.from('a'.repeat(64), 'hex');
    } else {
      this.encryptionKey = Buffer.from(keyHex, 'hex');
    }

    // Validate key length (must be 32 bytes for AES-256)
    if (this.encryptionKey.length !== 32) {
      throw new Error(
        `Invalid TOKENS_ENCRYPTION_KEY: Expected 32 bytes (64 hex chars), got ${this.encryptionKey.length} bytes`,
      );
    }
  }

  /**
   * Encrypt a plaintext string using AES-256-GCM
   * @param plaintext The string to encrypt
   * @returns Encrypted data with IV and authentication tag
   */
  encrypt(plaintext: string): EncryptedData {
    // Generate a random initialization vector (12 bytes recommended for GCM)
    const iv = crypto.randomBytes(12);

    // Create cipher
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.encryptionKey,
      iv,
    );

    // Encrypt the plaintext
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get the authentication tag (16 bytes for GCM)
    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  /**
   * Decrypt an encrypted string using AES-256-GCM
   * @param encrypted The encrypted hex string
   * @param iv The initialization vector (hex)
   * @param authTag The authentication tag (hex)
   * @returns The decrypted plaintext
   */
  decrypt(encrypted: string, iv: string, authTag: string): string {
    try {
      // Create decipher
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.encryptionKey,
        Buffer.from(iv, 'hex'),
      );

      // Set the authentication tag
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));

      // Decrypt the data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Decryption failed: ${errorMessage}`);
    }
  }

  /**
   * Test the encryption/decryption flow
   * @returns true if test passes
   */
  test(): boolean {
    const testData = 'test-token-12345';
    const { encrypted, iv, authTag } = this.encrypt(testData);
    const decrypted = this.decrypt(encrypted, iv, authTag);
    return testData === decrypted;
  }
}
