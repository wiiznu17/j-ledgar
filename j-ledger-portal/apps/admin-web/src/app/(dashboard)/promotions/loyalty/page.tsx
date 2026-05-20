'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { StatCard } from '@/components/dashboard/StatCard';
import {
  Coins,
  Users,
  Settings,
  Calendar,
  AlertCircle,
  Gift,
  XCircle,
} from 'lucide-react';
import { loyaltyRequester } from '@/lib/requesters';
import { RulesTable } from '@/components/promotions/RulesTable';
import { ExpirySchedule } from '@/components/promotions/ExpirySchedule';
// Removed missing Alert imports

export default function LoyaltyPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [expiryData, setExpiryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rulesRes, statsRes, expiryRes] = await Promise.all([
        loyaltyRequester.getRules(),
        loyaltyRequester.getStats(),
        loyaltyRequester.getExpirySchedule(),
      ]);
      setRules(rulesRes);
      setStats(statsRes);
      setExpiryData(expiryRes);
    } catch (error) {
      console.error('Failed to fetch loyalty data', error);
      toast.error('Could not load loyalty data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-8 pb-10 text-foreground">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Active Points"
          value={(stats?.totalActivePoints ?? 0).toLocaleString()}
          description="Current points in user wallets"
          icon={Coins}
          className="bg-card text-card-foreground border border-border shadow-xs"
        />

        <StatCard
          title="Lifetime Earned"
          value={(stats?.totalLifetimePoints ?? 0).toLocaleString()}
          description="Total points awarded since launch"
          icon={Calendar}
          className="bg-card text-card-foreground border border-border shadow-xs"
        />

        <StatCard
          title="Redeemed Points"
          value={stats?.totalRedeemedPoints?.toLocaleString() || '0'}
          description="Total points used for rewards/deals"
          icon={Gift}
          className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs"
        />

        <StatCard
          title="Expired Points"
          value={stats?.totalExpiredPoints?.toLocaleString() || '0'}
          description="Points removed due to expiry"
          icon={XCircle}
          className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs"
        />

        <StatCard
          title="Point Holders"
          value={stats?.totalUsersWithPoints || 0}
          description="Active users with point balance"
          icon={Users}
          className="bg-card text-card-foreground border border-border shadow-xs"
        />

        <StatCard
          title="Active Rules"
          value={stats?.activeRules || 0}
          description="Currently enabled earning rules"
          icon={Settings}
          className="bg-card text-card-foreground border border-border shadow-xs"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-foreground">Earning Rules</h3>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-blue-900 dark:text-blue-300 text-sm">
                Maintenance Mode Notice
              </h4>
              <p className="text-blue-800 dark:text-blue-400 text-xs mt-1 leading-relaxed">
                Rules can only be modified when <strong>Unlocked</strong>.
                Unlocking a rule enables maintenance mode for that specific
                event trigger.
              </p>
            </div>
          </div>

          <RulesTable rules={rules} onRefresh={fetchData} />
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold text-foreground">Expiry Outlook</h3>
          <ExpirySchedule data={expiryData} />

          <div className="bg-amber-500/10 p-6 rounded-xl border border-amber-500/20 shadow-xs">
            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" />
              Monthly Cycle Info
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
              Points earned are valid for 1 year, expiring at the end of the
              same month of the following year. The cleanup job runs
              automatically every day at midnight to process any expired
              balances.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
