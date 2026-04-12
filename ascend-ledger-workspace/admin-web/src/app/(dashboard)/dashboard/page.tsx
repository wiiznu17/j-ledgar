'use client';

import { Activity, DollarSign, ArrowRightLeft, CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api-config';
import { StatCard } from '@/components/dashboard/StatCard';
import { TransactionVolumeChart } from '@/components/dashboard/TransactionVolumeChart';
import { SystemHealthStatus } from '@/components/dashboard/SystemHealthStatus';

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
        // Fetch System Reconcile to get the total system balance
        const recRes = await fetch(`${API_BASE_URL}/api/v1/system/reconcile`, { method: 'POST' });
        if (recRes.ok) {
          const recData = await recRes.json();
          setTotalBalance(recData.totalAccountBalances.toFixed(2));
        }

        // Fetch Accounts to get count
        const accRes = await fetch(`${API_BASE_URL}/api/v1/accounts?size=1`);
        if (accRes.ok) {
          const accData = await accRes.json();
          setTotalAccounts(accData.totalElements);
        }

        // Fetch Transactions to get count
        const txRes = await fetch(`${API_BASE_URL}/api/v1/transactions?size=1`);
        if (txRes.ok) {
          const txData = await txRes.json();
          setTotalTransactions(txData.totalElements);
        }
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
        <p className="text-muted-foreground mt-2">Welcome back. Here is the daily summary of your ledger system.</p>
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
        />

        <SystemHealthStatus isOnline={isOnline} />
      </div>

      <TransactionVolumeChart data={mockChartData} />
    </div>
  );
}

