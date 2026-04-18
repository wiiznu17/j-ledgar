'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { userRequester } from '@/lib/requesters';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface FreezeUserActionProps {
  userId: string;
  email: string;
  isActive: boolean;
}

export function FreezeUserAction({ userId, email, isActive }: FreezeUserActionProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleFreeze = async () => {
    setLoading(true);
    try {
      await userRequester.freezeWalletUser(userId);
      toast.success(`User ${email} has been frozen successfully`);
      router.refresh();
    } catch (error) {
      console.error('[FREEZE_USER] Error:', error);
      const message = error instanceof Error ? error.message : 'Failed to freeze user';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isActive) {
    return (
      <Button variant="outline" size="sm" disabled className="bg-gray-50 text-gray-400 border-gray-200">
        Account Frozen
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="destructive" size="sm" className="gap-2">
            <ShieldAlert className="h-4 w-4" />
            Freeze Account
          </Button>
        }
      />
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will **immediately freeze** the wallet account for <strong>{email}</strong>. 
            The user will be unable to perform any transfers, payments, or withdrawals until manually un-frozen.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleFreeze();
            }}
            disabled={loading}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Confirm Freeze
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
