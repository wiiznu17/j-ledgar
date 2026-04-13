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

export interface Transaction {
  id: string;
  transactionType: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

interface TransactionTableProps {
  data: Transaction[];
  onRowClick: (id: string) => void;
}

export function TransactionTable({ data, onRowClick }: TransactionTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden border-border bg-white">
      <Table>
        <TableHeader className="bg-secondary/50">
          <TableRow>
            <TableHead className="w-[100px]">Type</TableHead>
            <TableHead>Transaction ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((tx) => (
            <TableRow
              key={tx.id}
              className="cursor-pointer hover:bg-secondary/30 transition-colors"
              onClick={() => onRowClick(tx.id)}
            >
              <TableCell className="font-medium">{tx.transactionType}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">{tx.id}</TableCell>
              <TableCell>{new Date(tx.createdAt).toLocaleString()}</TableCell>
              <TableCell className="text-right font-semibold">
                {tx.amount.toFixed(4)} {tx.currency}
              </TableCell>
              <TableCell className="text-center">
                <Badge
                  variant="outline"
                  className={
                    tx.status === 'SUCCESS'
                      ? 'border-green-500 text-green-600 bg-green-50'
                      : tx.status === 'FAILED'
                        ? 'border-red-500 text-red-600 bg-red-50'
                        : 'border-orange-500 text-orange-600 bg-orange-50'
                  }
                >
                  {tx.status}
                </Badge>
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
