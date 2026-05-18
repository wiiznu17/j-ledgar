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
import { MoreVertical } from 'lucide-react';
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
          limit: 5, // Match 5 rows in the mockup
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
      <Card className={`border border-border/80 shadow-md shadow-slate-200/40 dark:shadow-none hover:shadow-lg transition-all duration-300 rounded-xl bg-card text-card-foreground ${className}`}>
        <CardHeader className="py-4 border-b border-border/80">
          <CardTitle className="text-sm font-bold">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border border-border/80 shadow-md shadow-slate-200/40 dark:shadow-none hover:shadow-lg transition-all duration-300 rounded-xl overflow-hidden flex flex-col bg-card text-card-foreground ${className}`}>
      <CardHeader className="py-4 border-b border-border/80 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-bold text-foreground">
          Recent Transactions
        </CardTitle>
        <Link
          href="/transactions"
          className="px-3 py-1 rounded-md bg-secondary text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
        >
          View all
        </Link>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-border/80">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-6 py-3.5">
                Time
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3.5">
                Transaction ID
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3.5">
                User
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3.5">
                Type
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3.5">
                Amount
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3.5">
                Status
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3.5">
                Channel
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pr-6 py-3.5 w-10">
              </TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {transactions.length > 0 ? (
              transactions.map((tx) => {
                // Formatting values for high fidelity representation matching mockup
                const formattedTime = format(new Date(tx.createdAt), 'MMM dd, yyyy HH:mm');
                
                // Truncate Transaction ID
                const txIdStr = tx.id.toString();
                const txnId = txIdStr.length > 18 ? `${txIdStr.substring(0, 14)}...` : txIdStr;
                
                // Map User Fallback
                const username = tx.senderId ? `user_${tx.senderId.substring(0, 3)}` : 'user_001';

                // Map transaction status dynamically with beautiful UI badges
                const status = (tx.status || 'SUCCESS').toUpperCase();
                let statusBadge = (
                  <Badge className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-none">
                    Success
                  </Badge>
                );
                if (status === 'PENDING') {
                  statusBadge = (
                    <Badge className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-none">
                      Pending
                    </Badge>
                  );
                } else if (status === 'FAILED' || status === 'REJECTED') {
                  statusBadge = (
                    <Badge className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-none">
                      Failed
                    </Badge>
                  );
                }

                // Map dynamic types and channels
                const rawType = tx.transactionType || 'TRANSFER';
                let displayType = 'Transfer';
                let channel = 'Mobile App';
                
                if (rawType === TransactionType.TOPUP) {
                  displayType = 'Top Up';
                  channel = 'Web Portal';
                } else if (rawType === TransactionType.PAYMENT) {
                  displayType = 'Payment';
                  channel = 'Mobile App';
                } else if (rawType === TransactionType.WITHDRAW || (rawType as string) === 'WITHDRAWAL') {
                  displayType = 'Withdrawal';
                  channel = 'Web Portal';
                }

                return (
                  <TableRow
                    key={tx.id}
                    className="border-b border-border/60 hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-colors"
                  >
                    <TableCell className="pl-6 py-3.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                      {formattedTime}
                    </TableCell>
                    <TableCell className="py-3.5 text-xs font-bold text-foreground whitespace-nowrap">
                      {txnId}
                    </TableCell>
                    <TableCell className="py-3.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                      {username}
                    </TableCell>
                    <TableCell className="py-3.5 text-xs font-bold text-foreground whitespace-nowrap">
                      {displayType}
                    </TableCell>
                    <TableCell className="py-3.5 text-xs font-black text-foreground whitespace-nowrap">
                      ฿{Number(tx.amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="py-3.5">
                      {statusBadge}
                    </TableCell>
                    <TableCell className="py-3.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                      {channel}
                    </TableCell>
                    <TableCell className="pr-6 py-3.5 text-right w-10">
                      <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-12 text-center text-muted-foreground text-xs font-semibold"
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
