'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { TransactionTable } from '@/components/tables/TransactionTable';
import { Transaction } from '@/types/models';
import { transactionRequester } from '@/lib/requesters';

export default function TransactionsPage() {
  const [data, setData] = useState<Transaction[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await transactionRequester.getHistory(0, 20);
        setData(response.content);
      } catch {
        toast.error('Service temporarily unavailable. Please try again.');
      }
    };
    
    fetchTransactions();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>A paginated list of all ledger transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionTable data={data} onRowClick={(id) => router.push(`/transactions/${id}`)} />
        </CardContent>
      </Card>
    </div>
  );
}
