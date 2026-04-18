export interface ReconciliationReport {
  id: string;
  reportDate: string; // ISO format (e.g., "YYYY-MM-DD")
  totalSystemAssets: number;
  totalUserLiabilities: number;
  discrepancy: number;
  status: 'MATCHED' | 'DISCREPANCY';
  createdAt: string;
}
