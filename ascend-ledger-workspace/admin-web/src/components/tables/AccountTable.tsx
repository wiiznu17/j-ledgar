'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export interface Account {
  id: string;
  userId: string;
  accountName: string;
  balance: number;
  currency: string;
  status: string;
}

interface AccountTableProps {
  data: Account[];
  onToggleStatus: (accountId: string, currentStatus: string) => void;
  loading?: boolean;
}

export function AccountTable({ data, onToggleStatus, loading = false }: AccountTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden border-border bg-white">
      <Table>
        <TableHeader className="bg-secondary/50">
          <TableRow>
            <TableHead>Account Name</TableHead>
            <TableHead className="hidden md:table-cell">Account ID</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((acc) => (
            <TableRow key={acc.id} className="hover:bg-secondary/30 transition-colors">
              <TableCell className="font-medium">{acc.accountName}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground hidden md:table-cell">{acc.id}</TableCell>
              <TableCell className="text-right font-semibold">
                {acc.balance.toFixed(4)} {acc.currency}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className={
                  acc.status === 'ACTIVE' ? 'border-primary text-primary bg-primary/5' : 'border-destructive text-destructive bg-destructive/5'
                }>
                  {acc.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  variant={acc.status === 'ACTIVE' ? 'destructive' : 'default'} 
                  size="sm"
                  disabled={loading}
                  className={acc.status !== 'ACTIVE' ? 'bg-primary hover:bg-primary/90 text-white' : ''}
                  onClick={() => onToggleStatus(acc.id, acc.status)}
                >
                  {acc.status === 'ACTIVE' ? 'Freeze' : 'Unfreeze'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
