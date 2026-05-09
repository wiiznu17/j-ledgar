import { apiClient, RequestOptions } from '@/lib/api-client';
import { API_PATHS } from '@repo/dto';

export interface OutboxEvent {
  id: string;
  eventType: string;
  status: string;
  payload: any;
  metadata?: any;
  lastError?: string | null;
  retryCount: number;
  createdAt: string;
  updatedAt: string | null;
}

export const systemRequester = {
  /**
   * Fetches the current system outbox events for Kafka integration monitoring.
   */
  getOutbox: async (
    filters?: { status?: string; eventType?: string },
    options?: RequestOptions,
  ) => {
    return apiClient.get<OutboxEvent[]>(API_PATHS.ADMIN.SYSTEM.OUTBOX, {
      ...options,
      params: {
        ...options?.params,
        ...filters,
      },
    });
  },

  retryOutbox: async (id: string, options?: RequestOptions) => {
    return apiClient.post<void>(API_PATHS.ADMIN.SYSTEM.OUTBOX_RETRY(id), {}, options);
  },
};
