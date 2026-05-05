'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { WalletUser } from '@repo/dto';
import { UserControlActions } from './UserControlActions';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

interface WalletUsersTableProps {
  users: WalletUser[];
  loading?: boolean;
}

export function WalletUsersTable({ users, loading }: WalletUsersTableProps) {
  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p>Syncing user records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white text-slate-900">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow className="border-b border-slate-100">
            <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-widest py-4">User Email</TableHead>
            <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-widest hidden md:table-cell py-4">Internal ID</TableHead>
            <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-widest py-4">Status</TableHead>
            <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-widest py-4">Joined Date</TableHead>
            <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-widest py-4">Activity</TableHead>
            <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-widest text-right py-4">Fraud Control</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 group">
              <TableCell className="font-semibold text-slate-900">
                <a href={`/users/${user.id}`} className="hover:text-indigo-600 hover:underline transition-colors">
                  {user.email}
                </a>
              </TableCell>
              <TableCell className="font-mono text-[11px] text-slate-400 hidden md:table-cell">
                {user.id}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    user.status === 'ACTIVE'
                      ? 'border-emerald-200 text-emerald-700 bg-emerald-50 font-bold'
                      : user.status === 'PENDING_APPROVAL'
                      ? 'border-amber-200 text-amber-700 bg-amber-50 font-bold'
                      : user.status === 'SUSPENDED'
                      ? 'border-orange-200 text-orange-700 bg-orange-50 font-bold'
                      : 'border-rose-200 text-rose-700 bg-rose-50 font-bold'
                  }
                >
                  {user.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-slate-500 font-medium">
                {new Date(user.createdAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <a 
                    href={`/users/${user.id}`}
                    className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold text-xs")}
                  >
                    Manage
                  </a>
                  <a 
                    href={`/users/activity?userId=${user.id}`}
                    className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), "text-slate-400 hover:text-slate-600 hover:bg-slate-50 font-bold text-[10px] uppercase tracking-tighter")}
                  >
                    Logs
                  </a>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <UserControlActions
                  userId={user.id}
                  email={user.email || ''}
                  status={user.status}
                />
              </TableCell>
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-slate-400 font-medium">
                No registered wallet users found matching your criteria.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
