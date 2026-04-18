'use client';

import { Activity, DollarSign, ArrowRightLeft, CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { StatCard } from '@/components/dashboard/StatCard';
import { TransactionVolumeChart } from '@/components/dashboard/TransactionVolumeChart';
import { SystemHealthStatus } from '@/components/dashboard/SystemHealthStatus';
import { accountRequester, transactionRequester, reconcileRequester } from '@/lib/requesters';

const mockChartData = [
  { time: '09:00', volume: 400 },
  { time: '10:00', volume: 300 },
  { time: '11:00', volume: 550 },
  { time: '12:00', volume: 450 },
  { time: '13:00', volume: 700 },
  { time: '14:00', volume: 600 },
  { time: '15:00', volume: 800 },
];

export default function DashboardPage() {
  const [totalBalance, setTotalBalance] = useState<string>('0.00');
  const [totalTransactions, setTotalTransactions] = useState<number>(0);
  const [totalAccounts, setTotalAccounts] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        // 1. Fetch System Reconcile Summary
        const recData = await reconcileRequester.triggerManualAudit();
        if (recData?.totalAccountBalances) {
          setTotalBalance(recData.totalAccountBalances.toFixed(2));
        }

        // 2. Fetch Accounts count
        const accData = await accountRequester.getAccounts(0, 1);
        setTotalAccounts(accData.totalElements || 0);

        // 3. Fetch Transactions count
        const txData = await transactionRequester.getHistory(0, 1);
        setTotalTransactions(txData.totalElements || 0);

        setIsOnline(true);
      } catch (e) {
        setIsOnline(false);
        toast.error('Service temporarily unavailable. Please try again.');
        console.error('Fetch error', e);
      }
    };

    fetchOverview();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground mt-2">
          Welcome back. Here is the daily summary of your ledger system.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total System Balance"
          value={`${totalBalance} THB`}
          description="Across all ledgers"
          icon={DollarSign}
        />

        <StatCard
          title="Total Transactions"
          value={totalTransactions}
          description="Processed successfully"
          icon={ArrowRightLeft}
        />

        <StatCard
          title="Active Accounts"
          value={totalAccounts}
          description="Total registered users"
          icon={CreditCard}
          iconClassName="text-blue-600"
        />

        <SystemHealthStatus isOnline={isOnline} />
      </div>

      <TransactionVolumeChart data={mockChartData} />
    </div>
  );
}
