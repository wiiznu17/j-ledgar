'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { transactionRequester } from '@/lib/requesters';
import {
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

import { Transaction, TransactionType } from '@repo/dto';

export function RecentTransactions({ className }: { className?: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await transactionRequester.getHistory({
          page: 0,
          limit: 10,
        });
        setTransactions(response.data || []);
      } catch (error) {
        console.error('Failed to fetch transactions', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <Card
        className={`border-none ring-0 shadow-xs rounded-xl bg-card text-card-foreground ${className}`}
      >
        <CardHeader>
          <CardTitle className="text-sm font-bold">
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-10 bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`border-none ring-0 shadow-xs rounded-xl overflow-hidden flex flex-col bg-card text-card-foreground ${className}`}
    >
      <CardHeader className="border-b border-border bg-card py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-500" />
            Recent Transactions
          </CardTitle>
          <Link
            href="/transactions"
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            View All
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground pl-6 py-3">
                Type
              </TableHead>
              <TableHead className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground py-3">
                User / Reference
              </TableHead>
              <TableHead className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground py-3">
                Amount
              </TableHead>
              <TableHead className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground py-3">
                Status
              </TableHead>
              <TableHead className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground pr-6 py-3 text-right">
                Date
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <TableRow
                  key={tx.id}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-full ${tx.transactionType === TransactionType.TOPUP ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}
                      >
                        {tx.transactionType === TransactionType.TOPUP ? (
                          <ArrowDownLeft size={14} />
                        ) : (
                          <ArrowUpRight size={14} />
                        )}
                      </div>
                      <span className="text-xs font-bold text-foreground">
                        {tx.transactionType}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-foreground truncate max-w-[150px]">
                        {tx.id}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {tx.currency} Wallet
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <span
                      className={`text-xs font-bold ${tx.transactionType === TransactionType.TOPUP ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}
                    >
                      {tx.transactionType === TransactionType.TOPUP ? '+' : '-'}
                      {tx.amount} {tx.currency}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge
                      variant="secondary"
                      className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0"
                    >
                      SUCCESS
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6 py-4 text-right">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {format(new Date(tx.createdAt), 'dd MMM, HH:mm')}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-12 text-center text-muted-foreground text-xs font-medium"
                >
                  No recent transactions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
