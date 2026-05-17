'use client';

import {
  Activity,
  DollarSign,
  ArrowRightLeft,
  CreditCard,
  ShieldCheck,
  Users,
  TrendingUp,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { StatCard } from '@/components/dashboard/StatCard';
import { TransactionVolumeChart } from '@/components/dashboard/TransactionVolumeChart';
import { TransactionDistributionChart } from '@/components/dashboard/TransactionDistributionChart';
import { SystemHealthStatus } from '@/components/dashboard/SystemHealthStatus';
import { KycPendingQueue } from '@/components/dashboard/KycPendingQueue';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import {
  accountRequester,
  transactionRequester,
  reconcileRequester,
  kycRequester,
  dashboardRequester,
} from '@/lib/requesters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const [totalTransactions, setTotalTransactions] = useState<number>(0);
  const [totalAccounts, setTotalAccounts] = useState<number>(0);
  const [kycStats, setKycStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<string>('30d');

  const fetchOverview = async (range: string = dateRange) => {
    try {
      setLoading(true);

      let from: string | undefined;
      let to: string | undefined;

      const now = new Date();
      if (range === 'today') {
        from = startOfDay(now).toISOString();
        to = endOfDay(now).toISOString();
      } else if (range === '30d') {
        from = startOfDay(subDays(now, 30)).toISOString();
        to = endOfDay(now).toISOString();
      } else if (range === '1y') {
        from = startOfDay(subDays(now, 365)).toISOString();
        to = endOfDay(now).toISOString();
      } else if (range === 'all') {
        from = undefined;
        to = undefined;
      }

      const [txData, dashStats] = await Promise.all([
        transactionRequester
          .getHistory({ page: 0, size: 1, from, to })
          .catch(() => ({ pagination: { total: 0 } })),
        dashboardRequester.getStats({ from, to }).catch(() => null),
      ]);

      if (dashStats) {
        setKycStats(dashStats);
        setChartData(dashStats.chartData);
        setTotalTransactions(txData?.pagination?.total || 0);
        if (dashStats.totalActiveUsers !== undefined) {
          setTotalAccounts(dashStats.totalActiveUsers);
        }
      }

      setIsOnline(true);
    } catch (e) {
      setIsOnline(false);
      toast.error('Some services are temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [dateRange]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
           <SystemHealthStatus isOnline={isOnline} />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchOverview()}
            disabled={loading}
            className="h-11 w-11 rounded-lg border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 transition-all duration-300 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Section 1: System Treasury & User Base (Static/Cumulative) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-slate-900 rounded-full" />
          <h2 className="text-lg font-bold text-slate-900">System Treasury</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-4">
          <StatCard
            title="Total System Liquidity"
            value={(kycStats?.financial?.totalSystemBalance || 0).toLocaleString()}
            description="Total funds circulating across all ledgers"
            icon={DollarSign}
            className="bg-white border-none ring-0 md:col-span-2"
          />
          <StatCard
            title="Active Users"
            value={totalAccounts.toLocaleString()}
            description="Verified registered accounts"
            icon={Users}
            className="bg-white border-none ring-0"
          />
          <StatCard
            title="VAT Payable"
            value={(kycStats?.financial?.totalVatPayable || 0).toLocaleString()}
            description="Accumulated tax settlement"
            icon={CreditCard}
            className="bg-white border-none ring-0"
          />
        </div>
      </section>

      {/* Section 2: Performance Overview (Filtered by Date) */}
      <section className="p-6 bg-slate-50/50 rounded-xl border border-slate-300 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-indigo-500 rounded-full" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Performance Overview</h2>
              <p className="text-xs text-slate-500 font-medium">Metrics based on selected time range</p>
            </div>
          </div>

          <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1 shadow-sm hover:border-slate-300 transition-colors">
            <Select value={dateRange} onValueChange={(val) => val && setDateRange(val)}>
              <SelectTrigger className="w-[160px] border-none focus:ring-0 shadow-none h-9 text-slate-700 font-medium">
                <CalendarIcon className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Select Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="1y">Last 1 Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Revenue Collected"
            value={(kycStats?.financial?.totalRevenue || 0).toLocaleString()}
            description="Fees earned in this period"
            icon={TrendingUp}
            className="bg-white border-none ring-0"
          />
          <StatCard
            title="Transactions Processed"
            value={totalTransactions.toLocaleString()}
            description="Activity count in this period"
            icon={ArrowRightLeft}
            className="bg-white border-none ring-0"
          />
          <StatCard
            title="KYC Approved"
            value={kycStats?.kyc?.approvedToday || 0}
            description="Success rate this period"
            icon={ShieldCheck}
            className="bg-white border-none ring-0"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          <div className="lg:col-span-2">
            <TransactionVolumeChart data={chartData} />
          </div>
          <div>
            <TransactionDistributionChart data={kycStats?.distribution || []} />
          </div>
        </div>
      </section>

      {/* Section 3: Operations & Queues (Live/Real-time) */}
      <section className="grid gap-4 lg:grid-cols-3 items-stretch">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-6 bg-emerald-500 rounded-full" />
            <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
          </div>
          <RecentTransactions className="h-full bg-white border-none ring-0 shadow-lg shadow-slate-200/50 rounded-xl" />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-6 bg-amber-500 rounded-full" />
            <h2 className="text-lg font-bold text-slate-900">KYC Queue</h2>
          </div>
          <KycPendingQueue />
        </div>
      </section>
    </div>
  );
}
