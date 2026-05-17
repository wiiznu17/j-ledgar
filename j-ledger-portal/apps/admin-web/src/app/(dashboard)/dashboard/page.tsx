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
    <div className="space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-12 text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
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
            className="h-10 w-10 md:h-11 md:w-11 rounded-lg border-border text-muted-foreground hover:text-indigo-600 hover:border-indigo-500/20 hover:bg-indigo-500/10 transition-all duration-300 shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Section 1: System Treasury & User Base (Static/Cumulative) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-primary rounded-full" />
          <h2 className="text-lg font-bold text-foreground">System Treasury</h2>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total System Liquidity"
            value={(kycStats?.financial?.totalSystemBalance || 0).toLocaleString()}
            description="Total funds circulating across all ledgers"
            icon={DollarSign}
            className="bg-card text-card-foreground border-none ring-0 sm:col-span-2"
          />
          <StatCard
            title="Active Users"
            value={totalAccounts.toLocaleString()}
            description="Verified registered accounts"
            icon={Users}
            className="bg-card text-card-foreground border-none ring-0"
          />
          <StatCard
            title="VAT Payable"
            value={(kycStats?.financial?.totalVatPayable || 0).toLocaleString()}
            description="Accumulated tax settlement"
            icon={CreditCard}
            className="bg-card text-card-foreground border-none ring-0"
          />
        </div>
      </section>

      {/* Section 2: Performance Overview (Filtered by Date) */}
      <section className="p-4 md:p-6 bg-muted/20 dark:bg-muted/10 rounded-xl border border-border space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-indigo-500 rounded-full" />
            <div>
              <h2 className="text-lg font-bold text-foreground">Performance Overview</h2>
              <p className="text-xs text-muted-foreground font-medium">Metrics based on selected time range</p>
            </div>
          </div>

          <div className="flex items-center bg-card rounded-lg border border-border p-1 shadow-xs hover:border-muted-foreground/30 transition-colors self-start sm:self-auto">
            <Select value={dateRange} onValueChange={(val) => val && setDateRange(val)}>
              <SelectTrigger className="w-[160px] border-none focus:ring-0 focus:outline-hidden focus-visible:ring-0 shadow-none h-9 text-foreground font-medium bg-transparent">
                <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
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

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Revenue Collected"
            value={(kycStats?.financial?.totalRevenue || 0).toLocaleString()}
            description="Fees earned in this period"
            icon={TrendingUp}
            className="bg-card text-card-foreground border-none ring-0"
          />
          <StatCard
            title="Transactions Processed"
            value={totalTransactions.toLocaleString()}
            description="Activity count in this period"
            icon={ArrowRightLeft}
            className="bg-card text-card-foreground border-none ring-0"
          />
          <StatCard
            title="KYC Approved"
            value={kycStats?.kyc?.approvedToday || 0}
            description="Success rate this period"
            icon={ShieldCheck}
            className="bg-card text-card-foreground border-none ring-0"
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
      <section className="grid gap-6 grid-cols-1 lg:grid-cols-3 items-stretch">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-6 bg-emerald-500 rounded-full" />
            <h2 className="text-lg font-bold text-foreground">Recent Activity</h2>
          </div>
          <RecentTransactions className="h-full bg-card text-card-foreground border-none ring-0 shadow-xs rounded-xl" />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-6 bg-amber-500 rounded-full" />
            <h2 className="text-lg font-bold text-foreground">KYC Queue</h2>
          </div>
          <KycPendingQueue />
        </div>
      </section>
    </div>
  );
}
