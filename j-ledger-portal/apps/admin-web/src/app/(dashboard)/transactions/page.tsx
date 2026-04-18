import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionTable } from '@/components/tables/TransactionTable';
import { transactionRequester } from '@/lib/requesters';
import { Transaction } from '@/types/models';
import { redirect } from 'next/navigation';

async function getTransactions(): Promise<Transaction[]> {
  try {
    const response = await transactionRequester.getHistory(0, 50);
    return response.content || [];
  } catch (error) {
    console.error('[TRANSACTIONS_PAGE] Fetch error:', error);
    return [];
  }
}

export default async function TransactionsPage() {
  const transactions = await getTransactions();

  // Handle client-side navigation logic via a server action or simple client component pass-through
  // In this case, TransactionTable is 'use client', so we can pass a function or let it handle its own router
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-[#2D3748]">Global Transaction Monitor</h2>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>System-wide Transaction History</CardTitle>
          <CardDescription>
            Monitoring real-time financial flows across all user wallets and system accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* We pass a simple navigate function logic or use the table's internal handling if preferred */}
          <TransactionTableWrapper transactions={transactions} />
        </CardContent>
      </Card>
    </div>
  );
}

// Simple internal client wrapper to handle the router logic without polluting the main server page
'use client';
import { useRouter } from 'next/navigation';

function TransactionTableWrapper({ transactions }: { transactions: Transaction[] }) {
  const router = useRouter();
  return (
    <TransactionTable 
      data={transactions} 
      onRowClick={(id) => router.push(`/transactions/${id}`)} 
    />
  );
}
