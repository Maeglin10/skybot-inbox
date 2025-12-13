import { Injectable } from '@nestjs/common';
import type { ParsedIncomingMessage } from './whatsapp.parser';

@Injectable()
export class WebhooksService {
  async handleIncoming(_msg: ParsedIncomingMessage): Promise<void> {
    // TODO: persistence + routing
  }
}
