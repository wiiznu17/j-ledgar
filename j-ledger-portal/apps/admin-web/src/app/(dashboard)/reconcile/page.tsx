import { ReconciliationTable } from '@/components/reconcile/ReconciliationTable';
import { TriggerAuditButton } from '@/components/reconcile/TriggerAuditButton';
import { ReconciliationReport, ReconciliationStatus } from '@repo/dto';
import { adminApi } from '@/lib/admin-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, AlertCircle, Wallet, Landmark, Activity } from 'lucide-react';

async function getReconciliationReports(): Promise<ReconciliationReport[]> {
  try {
    const response = await adminApi.reconciliation.findAll({ page: 1, limit: 50 });
    return response.data;
  } catch (error) {
    console.error('[RECONCILE] Fetch error:', error);
    return [];
  }
}

export default async function ReconcilePage() {
  const reports = await getReconciliationReports();
  const latestReport = reports[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-indigo-50 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
              Financial Integrity
            </span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-800">
            System Reconciliation
          </h2>
          <p className="text-slate-400 mt-1 text-sm font-medium max-w-xl">
            Mathematical auditing of the double-entry ledger. Ensuring that every digital Baht in
            circulation is backed by real-world assets.
          </p>
        </div>
        <TriggerAuditButton />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden bg-white group hover:border-indigo-100 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-50 rounded-xl">
                <Landmark className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Total Assets
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-slate-700 font-mono">
                {latestReport
                  ? new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(
                      latestReport.totalSystemAssets,
                    )
                  : '฿0.00'}
              </span>
              <span className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">
                System Bank Liquidity
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden bg-white group hover:border-indigo-100 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-amber-50 rounded-xl">
                <Wallet className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                User Liabilities
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-slate-700 font-mono">
                {latestReport
                  ? new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(
                      latestReport.totalUserLiabilities,
                    )
                  : '฿0.00'}
              </span>
              <span className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">
                In-Circulation Wallets
              </span>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`rounded-3xl shadow-sm overflow-hidden group transition-all border-2 ${latestReport?.status === ReconciliationStatus.DISCREPANCY ? 'border-rose-200 bg-rose-50/30' : 'border-emerald-100 bg-emerald-50/30'}`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-2 rounded-xl ${latestReport?.status === ReconciliationStatus.DISCREPANCY ? 'bg-rose-100' : 'bg-emerald-100'}`}
              >
                <Activity
                  className={`w-5 h-5 ${latestReport?.status === ReconciliationStatus.DISCREPANCY ? 'text-rose-600' : 'text-emerald-600'}`}
                />
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-widest ${latestReport?.status === ReconciliationStatus.DISCREPANCY ? 'text-rose-500' : 'text-emerald-500'}`}
              >
                Current Status
              </span>
            </div>
            <div className="flex flex-col">
              <span
                className={`text-2xl font-black font-mono ${latestReport?.status === ReconciliationStatus.DISCREPANCY ? 'text-rose-700' : 'text-emerald-700'}`}
              >
                {latestReport?.status || 'NO DATA'}
              </span>
              <span className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">
                {latestReport?.status === ReconciliationStatus.DISCREPANCY
                  ? 'Immediate Action Required'
                  : 'Ledger Invariant Verified'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              Historical Audit Logs
              {reports.some((r) => r.status === ReconciliationStatus.DISCREPANCY) && (
                <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </h3>
          </div>
          <ReconciliationTable reports={reports} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 bg-slate-900 rounded-[2rem] border border-slate-800 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-32 h-32 text-white" />
            </div>
            <h4 className="font-bold text-white text-lg mb-3 flex items-center gap-2">
              Mathematical Core Invariant
            </h4>
            <p className="text-slate-400 leading-relaxed text-sm relative z-10">
              The system enforces financial integrity by verifying the following invariant at each
              audit point:
              <span className="block font-mono mt-4 bg-slate-800 p-4 rounded-2xl border border-slate-700 text-indigo-400 text-xs">
                System Assets - Sum(User Liabilities) == 0
              </span>
              <span className="block mt-4 text-[10px] text-slate-500 uppercase font-black tracking-widest">
                Verification standard: Double-entry Bookkeeping
              </span>
            </p>
          </div>
          <div className="p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
            <h4 className="font-bold text-slate-800 text-lg mb-3">Nightly Automation</h4>
            <p className="text-slate-500 leading-relaxed text-sm">
              While manual audits can be triggered at any time for real-time verification, the
              system automatically performs this reconciliation nightly at{' '}
              <span className="font-black text-slate-700 underline decoration-indigo-200 decoration-2">
                00:00:00 UTC
              </span>
              .
            </p>
            <div className="mt-6 flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-[11px] text-amber-700 font-medium">
                If a discrepancy is detected, the system will automatically notify the treasury and
                security teams via the established incident response channels.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
