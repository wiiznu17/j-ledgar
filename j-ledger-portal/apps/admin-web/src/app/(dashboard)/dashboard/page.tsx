'use client';

import { Activity, DollarSign, ArrowRightLeft, CreditCard, ShieldCheck, Users, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { StatCard } from '@/components/dashboard/StatCard';
import { TransactionVolumeChart } from '@/components/dashboard/TransactionVolumeChart';
import { SystemHealthStatus } from '@/components/dashboard/SystemHealthStatus';
import { KycPendingQueue } from '@/components/dashboard/KycPendingQueue';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { accountRequester, transactionRequester, reconcileRequester, kycRequester, dashboardRequester } from '@/lib/requesters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DashboardPage() {
  const [totalBalance, setTotalBalance] = useState<string>('0.00');
  const [totalTransactions, setTotalTransactions] = useState<number>(0);
  const [totalAccounts, setTotalAccounts] = useState<number>(0);
  const [kycStats, setKycStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [growthStats, setGrowthStats] = useState<any>({ approvalRate: 0, volumeGoal: 0 });
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        const [recData, accData, txData, dashStats] = await Promise.all([
          reconcileRequester.triggerManualAudit().catch(() => null),
          accountRequester.getAccounts(0, 1).catch(() => ({ totalElements: 0 })),
          transactionRequester.getHistory(0, 1).catch(() => ({ totalElements: 0 })),
          dashboardRequester.getAggregatedStats().catch(() => null)
        ]);

        if (recData?.totalAccountBalances) {
          setTotalBalance(recData.totalAccountBalances.toFixed(2));
        }

        setTotalAccounts(accData?.totalElements || 0);
        setTotalTransactions(txData?.totalElements || 0);
        
        if (dashStats) {
          setKycStats(dashStats.kyc);
          setChartData(dashStats.chartData);
          setGrowthStats(dashStats.growth);
        }
        
        setIsOnline(true);
      } catch (e) {
        setIsOnline(false);
        toast.error('Some services are temporarily unavailable.');
        console.error('Fetch error', e);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Command Center</h2>
          <p className="text-slate-500 mt-1 font-medium">
            Real-time overview of your ledger ecosystem and user verification queue.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total System Balance"
          value={`${totalBalance} THB`}
          description="Total funds across all ledgers"
          icon={DollarSign}
          className="bg-white border-none shadow-sm ring-1 ring-slate-100"
        />

        <StatCard
          title="Total Transactions"
          value={totalTransactions}
          description="Successfully processed"
          icon={ArrowRightLeft}
          className="bg-white border-none shadow-sm ring-1 ring-slate-100"
        />

        <StatCard
          title="Active Accounts"
          value={totalAccounts}
          description="Verified registered users"
          icon={Users}
          className="bg-white border-none shadow-sm ring-1 ring-slate-100"
        />

        <StatCard
          title="KYC Pending"
          value={kycStats?.pending || 0}
          description="Waiting for verification"
          icon={ShieldCheck}
          iconClassName={kycStats?.pending > 0 ? "text-amber-500" : "text-slate-400"}
          className={`border-none shadow-sm ring-1 ${kycStats?.pending > 0 ? 'ring-amber-100 bg-amber-50/30' : 'ring-slate-100 bg-white'}`}
        />

        <SystemHealthStatus 
          isOnline={isOnline} 
          className="bg-white border-none shadow-sm ring-1 ring-slate-100"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3 items-stretch">
        {/* Left Column: Chart & Transactions */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <TransactionVolumeChart data={chartData} />
          <div className="flex-1">
            <RecentTransactions className="h-full" />
          </div>
        </div>

        {/* Right Column: KYC Queue & Health */}
        <div className="flex flex-col gap-8">
          <KycPendingQueue />
          <div className="mt-auto">
            <div className="bg-white p-6 rounded-xl border-none shadow-sm ring-1 ring-slate-100">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              Growth Summary
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">KYC Approval Rate</span>
                <span className="text-xs font-bold text-emerald-600">{growthStats.approvalRate}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-1000" 
                  style={{ width: `${growthStats.approvalRate}%` }} 
                />
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-medium text-slate-500">Daily Volume Goal</span>
                <span className="text-xs font-bold text-indigo-600">{growthStats.volumeGoal}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full transition-all duration-1000" 
                  style={{ width: `${growthStats.volumeGoal}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
