import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { adminApi } from '@/lib/admin-api';
import { TransactionTableWrapper } from '@/components/transactions/TransactionTableWrapper';

async function getTransactions() {
  try {
    const response = await adminApi.transactions.findAll({ page: 1, limit: 50 });
    return response.data || [];
  } catch (error) {
    console.error('[TRANSACTIONS_PAGE] Fetch error:', error);
    return [];
  }
}

export default async function TransactionsPage() {
  const transactions = await getTransactions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-[#2D3748]">
          Global Transaction Monitor
        </h2>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>System-wide Transaction History</CardTitle>
          <CardDescription>
            Monitoring real-time financial flows across all user wallets and system accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionTableWrapper transactions={transactions} />
        </CardContent>
      </Card>
    </div>
  );
}
