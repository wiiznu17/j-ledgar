'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Activity } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';

export function TriggerAuditButton() {
  const [isPending, startTransition] = useTransition();
  const [isApiLoading, setIsApiLoading] = useState(false);
  const router = useRouter();

  const handleTrigger = async () => {
    setIsApiLoading(true);
    try {
      await adminApi.reconciliation.runReconciliation();

      toast.success('Manual audit triggered successfully');

      // Refresh the server-rendered data (the reports list)
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error('Audit trigger error:', error);
      toast.error('Failed to start reconciliation. Please try again later.');
    } finally {
      setIsApiLoading(false);
    }
  };

  const isLoading = isApiLoading || isPending;

  return (
    <div className="flex items-center gap-3">
      {isLoading && (
        <div className="flex flex-col items-end animate-in slide-in-from-right-2 duration-300">
          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            Auditing Ledger
          </span>
          <span className="text-[9px] text-muted-foreground font-medium">
            Verifying double-entry invariants...
          </span>
        </div>
      )}
      <Button
        onClick={handleTrigger}
        disabled={isLoading}
        className={`rounded-2xl px-6 h-12 font-black transition-all active:scale-95 shadow-xs flex gap-2 ${
          isLoading
            ? 'bg-muted text-muted-foreground border-border'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Activity className="h-4 w-4" />
        )}
        {isLoading ? 'Processing...' : 'Run Audit'}
      </Button>
    </div>
  );
}
