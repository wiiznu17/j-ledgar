'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api-config';
import { Transaction, TransactionTable } from '@/components/tables/TransactionTable';

export default function TransactionsPage() {
  const [data, setData] = useState<Transaction[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/transactions?page=0&size=20`)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((d) => setData(d.content))
      .catch(() => toast.error('Service temporarily unavailable. Please try again.'));
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
