// src/lib/requesters/systemRequester.ts
import { apiClient, RequestOptions } from '@/lib/api-client';

export interface OutboxEvent {
  id: string;
  eventType: string;
  status: string;
  createdAt: string;
  processedAt: string | null;
}

export const systemRequester = {
  /**
   * Fetches the current system outbox events for Kafka integration monitoring.
   * Path: /api/admin/system/outbox
   */
  getOutbox: async (options?: RequestOptions) => {
    return apiClient.get<OutboxEvent[]>('/api/admin/system/outbox', options);
  },
};
