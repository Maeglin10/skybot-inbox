import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly apiUrl = 'https://graph.facebook.com/v21.0';
  private readonly accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  private readonly phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  /**
   * Send a text message via WhatsApp Cloud API
   */
  async sendTextMessage(params: {
    to: string; // Recipient phone number (without +)
    text: string;
    conversationId?: string;
    messageId?: string;
  }): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    const { to, text, conversationId, messageId } = params;

    if (!this.accessToken) {
      throw new Error('WHATSAPP_ACCESS_TOKEN not configured');
    }

    if (!this.phoneNumberId) {
      throw new Error('WHATSAPP_PHONE_NUMBER_ID not configured');
    }

    this.logger.log('Sending WhatsApp message', {
      to,
      conversationId,
      messageId,
      textLength: text.length,
    });

    try {
      const response = await fetch(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'text',
            text: {
              preview_url: false,
              body: text,
            },
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        this.logger.error('WhatsApp API error', {
          status: response.status,
          error: errorData,
          to,
          conversationId,
        });

        return {
          success: false,
          error: `WhatsApp API error: ${response.status} - ${JSON.stringify(errorData)}`,
        };
      }

      const data = await response.json();

      this.logger.log('WhatsApp message sent successfully', {
        waMessageId: data.messages?.[0]?.id,
        to,
        conversationId,
        messageId,
      });

      return {
        success: true,
        messageId: data.messages?.[0]?.id,
      };
    } catch (error) {
      this.logger.error('Failed to send WhatsApp message', {
        error: error instanceof Error ? error.message : String(error),
        to,
        conversationId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
