'use client';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { WalletUser } from '@repo/dto';
import { cn } from '@/lib/utils';
import { getUserStatusConfig } from '@/lib/status-utils';
import { buttonVariants } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface WalletUsersTableProps {
  users: WalletUser[];
  loading?: boolean;
}

export function WalletUsersTable({ users, loading }: WalletUsersTableProps) {
  const router = useRouter();
  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground font-medium bg-card">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p>Syncing user records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-card text-foreground">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="border-b border-border">
            <TableHead className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest py-4">
              User Email
            </TableHead>
            <TableHead className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest hidden md:table-cell py-4">
              Phone Number
            </TableHead>
            <TableHead className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest py-4">
              Status
            </TableHead>
            <TableHead className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest py-4">
              Joined Date
            </TableHead>
            <TableHead className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest text-right py-4">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow
              key={user.id}
              onClick={() => router.push(`/support/users/${user.id}`)}
              className="hover:bg-muted/50 transition-colors border-b border-border group cursor-pointer"
            >
              <TableCell className="font-semibold text-foreground">
                {user.email || '-'}
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground hidden md:table-cell">
                {user.phoneNumber}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    'font-bold uppercase text-[9px]',
                    getUserStatusConfig(user.status).color,
                  )}
                >
                  {(() => {
                    const Icon = getUserStatusConfig(user.status).icon;
                    return <Icon className="w-3 h-3 mr-1" />;
                  })()}
                  {user.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground font-medium">
                {new Date(user.createdAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </TableCell>
              <TableCell className="text-right">
                <a
                  href={`/support/user-activity?userId=${user.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    'text-muted-foreground hover:text-foreground hover:bg-muted font-bold text-[10px] uppercase tracking-tighter',
                  )}
                >
                  View Logs
                </a>
              </TableCell>
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-32 text-center text-muted-foreground font-medium"
              >
                No registered wallet users found matching your criteria.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
