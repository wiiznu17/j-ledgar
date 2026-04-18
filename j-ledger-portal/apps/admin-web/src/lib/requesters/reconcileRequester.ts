import { apiClient } from '@/lib/api-client';
import { ReconciliationReport } from '@/types/reconcile';

/**
 * Reconcile Requester
 * Handles all mathematical integrity audit communications.
 */
export const reconcileRequester = {
  /**
   * Fetches the history of nightly or manual reconciliation reports.
   * Path: /api/v1/system/reconcile/reports (Proxied to Java Core via Admin API)
   */
  getReports: async () => {
    return apiClient.get<ReconciliationReport[]>('/api/admin/system/reconcile/reports', {
      next: { revalidate: 0 },
    });
  },

  /**
   * Manually triggers a reconciliation audit.
   * Path: /api/admin/system/reconcile/trigger (Admin API endpoint)
   */
  triggerManualAudit: async () => {
    return apiClient.post('/api/admin/system/reconcile/trigger');
  },
};
