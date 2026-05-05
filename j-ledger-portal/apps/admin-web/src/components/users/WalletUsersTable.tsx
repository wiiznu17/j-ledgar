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

interface WalletUsersTableProps {
  users: WalletUser[];
}

export function WalletUsersTable({ users }: WalletUsersTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden border-border bg-white text-[#2D3748]">
      <Table>
        <TableHeader className="bg-secondary/50">
          <TableRow>
            <TableHead>User Email</TableHead>
            <TableHead className="hidden md:table-cell">Internal ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined Date</TableHead>
            <TableHead>Activity</TableHead>
            <TableHead className="text-right">Fraud Control</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="hover:bg-secondary/30 transition-colors">
              <TableCell className="font-medium">{user.email}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground hidden md:table-cell">
                {user.id}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    user.status === 'ACTIVE'
                      ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                      : user.status === 'PENDING_APPROVAL'
                      ? 'border-amber-500 text-amber-600 bg-amber-50'
                      : user.status === 'SUSPENDED'
                      ? 'border-orange-500 text-orange-600 bg-orange-50'
                      : 'border-destructive text-destructive bg-destructive/5'
                  }
                >
                  {user.status === 'ACTIVE' 
                    ? 'Active' 
                    : user.status === 'PENDING_APPROVAL'
                    ? 'Pending Approval'
                    : user.status === 'SUSPENDED'
                    ? 'Suspended'
                    : user.status === 'BLOCKED'
                    ? 'Blocked'
                    : user.status === 'INACTIVE'
                    ? 'Inactive'
                    : user.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary-foreground hover:bg-primary"
                  render={<a href={`/users/activity?userId=${user.id}`} />}
                  nativeButton={false}
                >
                  View Logs
                </Button>
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
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                No registered wallet users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
