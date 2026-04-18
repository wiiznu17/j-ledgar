import { ReconciliationTable } from '@/components/reconcile/ReconciliationTable';
import { TriggerAuditButton } from '@/components/reconcile/TriggerAuditButton';
import { API_BASE_URL } from '@/lib/api-config';
import { ReconciliationReport } from '@/types/reconcile';
import { cookies } from 'next/headers';

async function getReconciliationReports(): Promise<ReconciliationReport[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/system/reconcile/reports`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 0 }, // Ensure fresh data on every request/refresh
    });

    if (!res.ok) {
      console.error(`[RECONCILE] Failed to fetch reports: ${res.status}`);
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error('[RECONCILE] Fetch error:', error);
    return [];
  }
}

export default async function ReconcilePage() {
  const reports = await getReconciliationReports();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            System Reconciliation
          </h2>
          <p className="text-muted-foreground mt-1 text-lg">
            Monitor and audit the mathematical integrity of the double-entry ledger.
          </p>
        </div>
        <TriggerAuditButton />
      </div>

      <div className="grid gap-6">
        <div className="bg-card p-6 rounded-xl border-2 border-primary/10 shadow-sm">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            Historical Audit Logs
            {reports.some(r => r.status === 'DISCREPANCY') && (
              <span className="flex h-3 w-3 rounded-full bg-destructive animate-pulse" />
            )}
          </h3>
          <ReconciliationTable reports={reports} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-green-50 rounded-xl border border-green-200">
            <h4 className="font-bold text-green-800 text-lg mb-2">Mathematical Core Invariant</h4>
            <p className="text-green-700 leading-relaxed text-sm">
              The system calculates reconciliation as follows: 
              <span className="block font-mono mt-2 bg-white/50 p-2 rounded">
                System Bank Assets - Sum(Total User Liabilities) == 0
              </span>
              Any value other than zero indicates a double-entry integrity violation that requires immediate investigation.
            </p>
          </div>
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-800 text-lg mb-2">Nightly Automation</h4>
            <p className="text-slate-700 leading-relaxed text-sm">
              While manual audits can be triggered at any time, the system automatically performs 
              this reconciliation nightly at <span className="font-bold">00:00:00 UTC</span>. 
              The results for the previous day are recorded above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
