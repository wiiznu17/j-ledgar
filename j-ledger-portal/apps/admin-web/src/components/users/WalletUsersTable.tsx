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
import { FreezeUserAction } from './FreezeUserAction';

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
                    user.isActive
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-destructive text-destructive bg-destructive/5'
                  }
                >
                  {user.isActive ? 'Active' : 'Frozen'}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <FreezeUserAction userId={user.id} email={user.email} isActive={user.isActive} />
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
