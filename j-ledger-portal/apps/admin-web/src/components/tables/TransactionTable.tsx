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
import { Transaction } from '@/types/models';
import { ArrowUpRight, ArrowDownLeft, RefreshCcw } from 'lucide-react';

interface TransactionTableProps {
  data: Transaction[];
  onRowClick: (id: string) => void;
}

export function TransactionTable({ data, onRowClick }: TransactionTableProps) {
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'TOPUP':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-200/50 gap-1">
            <ArrowDownLeft className="h-3 w-3" />
            TOPUP
          </Badge>
        );
      case 'TRANSFER':
        return (
          <Badge className="bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border-indigo-200/50 gap-1">
            <RefreshCcw className="h-3 w-3" />
            TRANSFER
          </Badge>
        );
      case 'WITHDRAW':
        return (
          <Badge className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-200/50 gap-1">
            <ArrowUpRight className="h-3 w-3" />
            WITHDRAW
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden border-border bg-white text-[#2D3748]">
      <Table>
        <TableHeader className="bg-secondary/50">
          <TableRow>
            <TableHead className="w-[140px]">Type</TableHead>
            <TableHead className="hidden md:table-cell">Transaction ID</TableHead>
            <TableHead>Date & Time</TableHead>
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
              <TableCell className="font-medium">
                {getTypeBadge(tx.transactionType)}
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground hidden md:table-cell">
                {tx.id}
              </TableCell>
              <TableCell className="text-sm">
                {new Date(tx.createdAt).toLocaleString('th-TH')}
              </TableCell>
              <TableCell className="text-right font-bold text-lg">
                {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  {tx.currency}
                </span>
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
                No ledger transactions found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
