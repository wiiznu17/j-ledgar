'use client';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Coins, Calendar as CalendarIcon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { transactionRequester } from '@/lib/requesters';
import {
  TransactionDetailsDto,
  TransactionStatus,
  LedgerEntryType,
} from '@repo/dto';

export default function TransactionDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<TransactionDetailsDto | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchDetails = async () => {
      try {
        const d = await transactionRequester.getDetails(id);
        setData(d);
      } catch (error) {
        console.error('[TRANSACTION_DETAIL] Fetch error:', error);
        toast.error('Service temporarily unavailable. Please try again.');
      }
    };

    fetchDetails();
  }, [id]);

  if (!data) {
    return (
      <div className="p-8 text-muted-foreground animate-pulse">
        Loading transaction details...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">
          Transaction Details
        </h2>
        <Badge
          variant="outline"
          className={
            data.transaction.status === TransactionStatus.COMPLETED
              ? 'border-green-500 text-green-600 bg-green-50'
              : data.transaction.status === TransactionStatus.FAILED
                ? 'border-red-500 text-red-600 bg-red-50'
                : 'border-orange-500 text-orange-600 bg-orange-50'
          }
        >
          {data.transaction.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>Meta Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">ID</p>
              <p className="font-mono text-sm">{data.transaction.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-semibold">
                {data.transaction.transactionType}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Timestamp</p>
              <p>{new Date(data.transaction.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Amount Configured</p>
              <p className="font-bold text-lg">
                {data.transaction.amount.toFixed(4)} {data.transaction.currency}
              </p>
            </div>
          </CardContent>
        </Card>

        {data.pointsEarned && (
          <Card className="border-emerald-100 shadow-sm bg-emerald-50/10">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-emerald-700">
                <Coins className="h-5 w-5" />
                <CardTitle className="text-lg">Loyalty Points Earned</CardTitle>
              </div>
              <CardDescription className="text-emerald-600/80">
                Points awarded to user for this transaction.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-600">
                  +{data.pointsEarned.amount.toLocaleString()}
                </span>
                <span className="text-sm font-bold text-emerald-700/70">POINTS</span>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-white/50 rounded-lg border border-emerald-100/50">
                <CalendarIcon className="h-4 w-4 text-emerald-600" />
                <div className="text-xs">
                  <p className="text-emerald-700/60 font-medium uppercase tracking-wider">Expires On</p>
                  <p className="font-bold text-emerald-800">
                    {new Date(data.pointsEarned.expiresAt).toLocaleDateString(undefined, { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>Double-Entry Ledger Records</CardTitle>
            <CardDescription>
              System integrity verification map.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden border-border bg-white">
              <Table>
                <TableHeader className="bg-secondary/50">
                  <TableRow>
                    <TableHead>Operation</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead className="text-right">Amount Applied</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.ledgerEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Badge
                          variant={
                            entry.entryType === LedgerEntryType.CREDIT
                              ? 'default'
                              : 'destructive'
                          }
                          className={
                            entry.entryType === LedgerEntryType.CREDIT
                              ? 'bg-chart-4 text-white hover:bg-chart-4/80 border-0'
                              : 'bg-chart-3 text-white hover:bg-chart-3/80 border-0'
                          }
                        >
                          {entry.entryType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {entry.account?.accountName || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.amount.toFixed(4)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.ledgerEntries.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No ledger entries recorded.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
