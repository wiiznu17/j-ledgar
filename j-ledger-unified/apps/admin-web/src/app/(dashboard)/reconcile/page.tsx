'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api-config';

interface ReconcileSummary {
  timestamp: string;
  totalAccountBalances: number;
  totalCredits: number;
  totalDebits: number;
  isBalanced: boolean;
  ledgerIntegrityIntact: boolean;
  activeAccountsAnalyzed: boolean;
}

export default function ReconcilePage() {
  const [summary, setSummary] = useState<ReconcileSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const runReconciliation = async () => {
    setLoading(true);
    setSummary(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/system/reconcile`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to run reconciliation');
      const data = await res.json();
      setSummary(data);
      if (data.isBalanced && data.ledgerIntegrityIntact) {
        toast.success('Reconciliation completed successfully. Ledger is perfectly balanced.');
      } else {
        toast.error('Reconciliation completed. Issues detected in ledger integrity!');
      }
    } catch {
      toast.error('Service temporarily unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-3xl font-bold tracking-tight">System Reconciliation</h2>
      <p className="text-muted-foreground">
        Run the end-of-day reconciliation hook to verify that total system balances match the
        double-entry ledger records exactly.
      </p>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Reconciliation Action</CardTitle>
          <CardDescription>Operations may take a few moments on large datasets.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Button
            onClick={runReconciliation}
            disabled={loading}
            className="h-12 px-8 text-base font-semibold text-white bg-gradient-to-r from-[var(--color-magenta)] to-[var(--color-pink)] hover:opacity-90 transition-opacity border-0"
          >
            {loading ? 'Analyzing Databases...' : 'Run End-of-Day Reconciliation'}
          </Button>
        </CardContent>
      </Card>

      {summary && (
        <Card
          className={`border-border shadow-sm ${!summary.isBalanced || !summary.ledgerIntegrityIntact ? 'border-destructive/50 bg-destructive/5' : 'border-primary/50 bg-primary/5'}`}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              {summary.isBalanced && summary.ledgerIntegrityIntact ? (
                <ShieldCheck className="h-8 w-8 text-primary" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-destructive" />
              )}
              <div>
                <CardTitle>Reconciliation Report</CardTitle>
                <CardDescription>
                  Generated at {new Date(summary.timestamp).toLocaleString()}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3 mb-6">
              <div className="bg-white p-4 rounded-lg border border-border">
                <p className="text-sm border-b pb-2 mb-2 text-muted-foreground font-medium">
                  Total Account Balances
                </p>
                <p className="text-2xl font-mono text-foreground">
                  {summary.totalAccountBalances.toFixed(4)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-border">
                <p className="text-sm border-b pb-2 mb-2 text-muted-foreground font-medium">
                  Total Ledger Credits
                </p>
                <p className="text-2xl font-mono text-foreground">
                  {summary.totalCredits.toFixed(4)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-border">
                <p className="text-sm border-b pb-2 mb-2 text-muted-foreground font-medium">
                  Total Ledger Debits
                </p>
                <p className="text-2xl font-mono text-foreground">
                  {summary.totalDebits.toFixed(4)}
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">
                  Ledger Integrity (Debits == Credits):
                </span>
                <span
                  className={`font-semibold ${summary.ledgerIntegrityIntact ? 'text-green-600' : 'text-red-600'}`}
                >
                  {summary.ledgerIntegrityIntact ? 'PASSED' : 'FAILED'}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <span className="font-medium text-foreground">Total Balance vs Credits Valid:</span>
                <span
                  className={`font-semibold ${summary.isBalanced ? 'text-green-600' : 'text-red-600'}`}
                >
                  {summary.isBalanced ? 'PASSED' : 'FAILED'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
