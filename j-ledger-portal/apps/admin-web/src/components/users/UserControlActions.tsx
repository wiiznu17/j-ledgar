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
import { 
  ShieldAlert, 
  Loader2, 
  Ban, 
  Unlock, 
  UserCheck, 
  MoreHorizontal 
} from 'lucide-react';
import { useState } from 'react';
import { userRequester } from '@/lib/requesters';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { usePermissions } from '@/components/auth/PermissionContext';
import { Permission } from '@repo/dto';

interface UserControlActionsProps {
  userId: string;
  email: string;
  status: string;
}

export function UserControlActions({ userId, email, status }: UserControlActionsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { permissions } = usePermissions();

  const handleAction = async (action: 'suspend' | 'unsuspend' | 'block' | 'unblock') => {
    setLoading(true);
    try {
      if (action === 'suspend') await userRequester.suspendWalletUser(userId);
      if (action === 'unsuspend') await userRequester.unsuspendWalletUser(userId);
      if (action === 'block') await userRequester.blockWalletUser(userId);
      if (action === 'unblock') await userRequester.unblockWalletUser(userId);
      
      toast.success(`Action ${action} for ${email} performed successfully`);
      router.refresh();
    } catch (error) {
      console.error(`[USER_ACTION] ${action} error:`, error);
      const message = error instanceof Error ? error.message : `Failed to ${action} user`;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'SUSPENDED') {
    return (
      <PermissionGuard permissions={permissions} require={Permission.UNFREEZE_USERS}>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                className="gap-2 border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
                Unsuspend Account
              </Button>
            }
          />
          <AlertDialogContent className="bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Restore account access?</AlertDialogTitle>
              <AlertDialogDescription>
                This will re-activate the wallet account for <strong>{email}</strong>. 
                The user will regain full access to their wallet and financial services.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleAction('unsuspend');
                }}
                disabled={loading}
                className="bg-orange-600 text-white hover:bg-orange-700"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm Unsuspend
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PermissionGuard>
    );
  }

  if (status === 'BLOCKED') {
    return (
      <PermissionGuard permissions={permissions} require={Permission.UNFREEZE_USERS}>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                Unblock Account
              </Button>
            }
          />
          <AlertDialogContent className="bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Unblock this user?</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to restore access for <strong>{email}</strong>. 
                Please ensure that the security issues leading to this block have been fully resolved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleAction('unblock');
                }}
                disabled={loading}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm Unblock
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PermissionGuard>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <PermissionGuard permissions={permissions} require={Permission.FREEZE_USERS}>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button variant="outline" size="sm" className="gap-2 border-orange-200 text-orange-600 hover:bg-orange-50">
                <ShieldAlert className="h-4 w-4" />
                Suspend
              </Button>
            }
          />
          <AlertDialogContent className="bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Suspend wallet account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will temporarily disable <strong>{email}</strong>. 
                The user will be unable to perform any financial transactions until unsuspended.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleAction('suspend');
                }}
                disabled={loading}
                className="bg-orange-600 text-white hover:bg-orange-700"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm Suspension
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PermissionGuard>

      <PermissionGuard permissions={permissions} require={Permission.FREEZE_USERS}>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button variant="destructive" size="sm" className="gap-2">
                <Ban className="h-4 w-4" />
                Block
              </Button>
            }
          />
          <AlertDialogContent className="bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Permanently block this user?</AlertDialogTitle>
              <AlertDialogDescription>
                Blocking <strong>{email}</strong> is a severe action used for confirmed fraud. 
                The user will lose all access to the platform.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleAction('block');
                }}
                disabled={loading}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm Block
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PermissionGuard>
    </div>
  );
}
