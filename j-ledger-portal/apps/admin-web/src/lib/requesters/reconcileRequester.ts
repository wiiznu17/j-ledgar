import { apiClient, RequestOptions } from '@/lib/api-client';
import {
  ReconciliationReport,
  ReconciliationSummary,
  API_PATHS,
} from '@repo/dto';

/**
 * Reconcile Requester
 * Handles all mathematical integrity audit communications.
 */
export const reconcileRequester = {
  /**
   * Fetches the history of nightly or manual reconciliation reports.
   * Path: /api/admin/system/reconcile/reports
   */
  getReports: async (options?: RequestOptions) => {
    return apiClient.get<ReconciliationReport[]>(
      API_PATHS.ADMIN.RECONCILIATION.REPORTS,
      options,
    );
  },

  /**
   * Manually triggers a reconciliation audit.
   * Path: /api/admin/reconciliation/run
   */
  triggerManualAudit: async (options?: RequestOptions) => {
    return apiClient.post<ReconciliationSummary>(
      API_PATHS.ADMIN.RECONCILIATION.RUN,
      {},
      options,
    );
  },
};
