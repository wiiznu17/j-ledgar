'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api-config';

interface Transaction {
  id: string;
  transactionType: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

interface LedgerEntry {
  id: string;
  entryType: 'DEBIT' | 'CREDIT';
  amount: number;
  createdAt: string;
  account: {
    id: string;
    accountName: string;
  };
}

interface DetailsDto {
  transaction: Transaction;
  ledgerEntries: LedgerEntry[];
}

export default function TransactionDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<DetailsDto | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_BASE_URL}/api/v1/transactions/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((d) => setData(d))
      .catch(() => toast.error('Service temporarily unavailable. Please try again.'));
  }, [id]);

  if (!data) {
    return <div className="p-8 text-muted-foreground animate-pulse">Loading transaction details...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Transaction Details</h2>
        <Badge variant="outline" className={
          data.transaction.status === 'SUCCESS' ? 'border-green-500 text-green-600 bg-green-50' : 
          data.transaction.status === 'FAILED' ? 'border-red-500 text-red-600 bg-red-50' : 
          'border-orange-500 text-orange-600 bg-orange-50'
        }>
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
              <p className="font-semibold">{data.transaction.transactionType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Timestamp</p>
              <p>{new Date(data.transaction.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Amount Configured</p>
              <p className="font-bold text-lg">{data.transaction.amount.toFixed(4)} {data.transaction.currency}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>Double-Entry Ledger Records</CardTitle>
            <CardDescription>System integrity verification map.</CardDescription>
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
                        <Badge variant={entry.entryType === 'CREDIT' ? 'default' : 'destructive'} 
                               className={entry.entryType === 'CREDIT' ? 'bg-chart-4 text-white hover:bg-chart-4/80 border-0' : 'bg-chart-3 text-white hover:bg-chart-3/80 border-0'}>
                          {entry.entryType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{entry.account?.accountName || 'Unknown'}</TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.amount.toFixed(4)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.ledgerEntries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
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
