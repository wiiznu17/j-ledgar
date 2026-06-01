import { Injectable } from '@nestjs/common';

@Injectable()
export class WebhookConfigService {
  async createWebhook(data: any) {
    return { success: true };
  }

  async getWebhooks() {
    return [];
  }

  async deleteWebhook(id: string) {
    return { success: true };
  }
}
