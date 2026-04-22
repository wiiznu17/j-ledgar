'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Play } from 'lucide-react';
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
    <Button
      onClick={handleTrigger}
      disabled={isLoading}
      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md active:scale-95 transition-all flex gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Play className="h-4 w-4 fill-current" />
      )}
      {isLoading ? 'Running Audit...' : 'Run Manual Audit'}
    </Button>
  );
}
