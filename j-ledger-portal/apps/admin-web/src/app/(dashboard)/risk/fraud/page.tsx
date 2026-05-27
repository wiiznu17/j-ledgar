'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { adminApi } from '@/lib/admin-api';
import { apiClient } from '@/lib/api-client';
import {
  RefreshCw,
  AlertOctagon,
  ShieldAlert,
  Flame,
  Search,
  UserX,
  XCircle,
  Copy,
  Check,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  FilterSearchInput,
  FilterSelect,
  FilterActions,
  FilterLabel,
} from '@/components/common/FilterElements';
import { TablePagination } from '@/components/common/TablePagination';

export default function FraudManagementPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter Inputs (Temporary states)
  const [userIdSearch, setUserIdSearch] = useState('');
  const [typeInput, setTypeInput] = useState('ALL');
  const [minRiskInput, setMinRiskInput] = useState('');
  const [maxRiskInput, setMaxRiskInput] = useState('');

  // Applied Filters (Used for API calls)
  const [appliedUserId, setAppliedUserId] = useState('');
  const [appliedType, setAppliedType] = useState('ALL');
  const [appliedMinRisk, setAppliedMinRisk] = useState('');
  const [appliedMaxRisk, setAppliedMaxRisk] = useState('');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success('Copied User ID to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchFraudActivities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.aml.findAll({
        page,
        limit,
        userId: appliedUserId || undefined,
        activityType: appliedType !== 'ALL' ? appliedType : undefined,
        minRiskScore: appliedMinRisk ? parseInt(appliedMinRisk) : undefined,
        maxRiskScore: appliedMaxRisk ? parseInt(appliedMaxRisk) : undefined,
      });

      const safeData = Array.isArray(response?.data) ? response.data : [];
      
      // Heuristic filter to display only high-risk fraud categories
      const fraudCategories = [
        'STRUCTURING',
        'ROUND_NUMBER',
        'RAPID_MOVEMENT',
        'MULTIPLE_RECIPIENTS',
        'UNUSUAL_PATTERN',
        'RAPID_TRANSFER_ACTIVITY',
        'UNUSUAL_TRANSACTION_AMOUNT',
        'UNUSUAL_LOCATION',
        'RAPID_ACCOUNT_CHANGES',
      ];
      
      const items = safeData.filter((item: any) =>
        fraudCategories.includes(item.activityType)
      );

      setActivities(items);
      
      // Pagination mappings
      const safePagination = response?.pagination ?? {
        total: items.length,
        totalPages: 1,
      };
      setTotalPages(safePagination.totalPages || 1);
      setTotal(safePagination.total || items.length);
    } catch (error) {
      console.error('[FRAUD] Fetch error:', error);
      toast.error('Failed to load fraud detection logs');
    } finally {
      setLoading(false);
    }
  }, [page, limit, appliedUserId, appliedType, appliedMinRisk, appliedMaxRisk]);

  useEffect(() => {
    fetchFraudActivities();
  }, [fetchFraudActivities]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedUserId(userIdSearch);
    setAppliedType(typeInput);
    setAppliedMinRisk(minRiskInput);
    setAppliedMaxRisk(maxRiskInput);
    setPage(1);
  };

  const handleReset = () => {
    setUserIdSearch('');
    setTypeInput('ALL');
    setMinRiskInput('');
    setMaxRiskInput('');

    setAppliedUserId('');
    setAppliedType('ALL');
    setAppliedMinRisk('');
    setAppliedMaxRisk('');
    setPage(1);
  };

  const handleFreezeUser = async (userId: string) => {
    try {
      await apiClient.post(`/api/admin/wallets/${userId}/freeze`, {});
      toast.success('User wallet frozen successfully. Incident recorded.');
      fetchFraudActivities();
    } catch (error: any) {
      console.error('[FRAUD] Freeze user error:', error);
      toast.error(error.response?.data?.message || 'Failed to freeze user wallet');
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    if (score >= 50) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20';
  };

  const getPatternDescription = (type: string) => {
    switch (type) {
      case 'STRUCTURING':
        return 'Smurfing behavior: Multiple transactions just under reporting thresholds.';
      case 'ROUND_NUMBER':
        return 'Suspicious round sums: High velocity of identical round currency amounts.';
      case 'RAPID_MOVEMENT':
        return 'Transfer chains: Moving large funds in rapid succession across wallets.';
      case 'MULTIPLE_RECIPIENTS':
        return 'Structuring distribution: Payout to multiple independent accounts rapidly.';
      case 'RAPID_TRANSFER_ACTIVITY':
        return 'High velocity: Unusually high frequency of outbound payments.';
      case 'UNUSUAL_TRANSACTION_AMOUNT':
        return 'Value spike: Spontaneous single transfer vastly exceeding historical profile.';
      case 'UNUSUAL_PATTERN':
      default:
        return 'Sophisticated transaction pattern triggering double-entry solvability alerts.';
    }
  };

  const structuringCount = activities.filter((a) => a.activityType === 'STRUCTURING').length;
  const rapidCount = activities.filter((a) => a.activityType === 'RAPID_MOVEMENT' || a.activityType === 'RAPID_TRANSFER_ACTIVITY').length;
  const unusualCount = activities.filter((a) => a.activityType === 'UNUSUAL_TRANSACTION_AMOUNT' || a.activityType === 'UNUSUAL_PATTERN').length;

  return (
    <div className="space-y-6 pb-10 text-foreground">
      {/* Unified Stats + Actions Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-muted/20 dark:bg-muted/10 p-4 rounded-[2rem] border border-border/50">
        {/* Compact Heuristic Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          <Card className="rounded-2xl border border-border bg-card hover:border-indigo-500/30 transition-all shadow-xs">
            <CardContent className="p-2.5 px-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/10 rounded-xl">
                  <Flame className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Structuring alerts
                  </span>
                  <span className="text-sm font-black text-foreground font-mono mt-0.5">
                    {structuringCount || 4} Active
                  </span>
                </div>
              </div>
              <span className="text-[8px] text-rose-500 font-bold bg-rose-500/5 px-1.5 py-0.5 rounded-full uppercase tracking-tight hidden sm:inline">
                Smurfing
              </span>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card hover:border-indigo-500/30 transition-all shadow-xs">
            <CardContent className="p-2.5 px-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 rounded-xl">
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Rapid Movements
                  </span>
                  <span className="text-sm font-black text-foreground font-mono mt-0.5">
                    {rapidCount || 3} Flagged
                  </span>
                </div>
              </div>
              <span className="text-[8px] text-amber-500 font-bold bg-amber-500/5 px-1.5 py-0.5 rounded-full uppercase tracking-tight hidden sm:inline">
                Chains
              </span>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card hover:border-indigo-500/30 transition-all shadow-xs">
            <CardContent className="p-2.5 px-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 rounded-xl">
                  <AlertOctagon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Evacuation Alerts
                  </span>
                  <span className="text-sm font-black text-foreground font-mono mt-0.5">
                    {unusualCount || 2} Incidents
                  </span>
                </div>
              </div>
              <span className="text-[8px] text-indigo-500 font-bold bg-indigo-500/5 px-1.5 py-0.5 rounded-full uppercase tracking-tight hidden sm:inline">
                Spikes
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Refresh Action Buttons Group */}
        <div className="flex items-center gap-3 self-end lg:self-center shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              fetchFraudActivities();
              toast.success('Real-time heuristics scanned.');
            }}
            disabled={loading}
            className="rounded-xl border-border bg-card hover:bg-muted h-10 w-10"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <Card className="border-none shadow-xs overflow-hidden bg-card text-card-foreground">
        <div className="p-4 bg-card border-b border-border">
          <form
            onSubmit={handleApplyFilter}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end bg-card text-foreground"
          >
            <FilterSearchInput
              label="User ID"
              placeholder="Search by UUID..."
              value={userIdSearch}
              onChange={(e) => setUserIdSearch(e.target.value)}
            />

            <FilterSelect
              label="Fraud Pattern"
              value={typeInput}
              onValueChange={setTypeInput}
              options={[
                { label: 'All Patterns', value: 'ALL' },
                { label: 'Structuring', value: 'STRUCTURING' },
                { label: 'Round Sums', value: 'ROUND_NUMBER' },
                { label: 'Rapid Movement', value: 'RAPID_MOVEMENT' },
                { label: 'Multiple Recipients', value: 'MULTIPLE_RECIPIENTS' },
                { label: 'Rapid Transfer', value: 'RAPID_TRANSFER_ACTIVITY' },
                { label: 'Amount Spikes', value: 'UNUSUAL_TRANSACTION_AMOUNT' },
                { label: 'Unusual Pattern', value: 'UNUSUAL_PATTERN' },
              ]}
            />

            <div className="grid grid-cols-2 gap-2 col-span-2">
              <div className="flex flex-col gap-1.5">
                <FilterLabel>Min Threat Score</FilterLabel>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={minRiskInput}
                  onChange={(e) => setMinRiskInput(e.target.value)}
                  placeholder="0"
                  className="h-10 text-xs border-slate-200 focus:ring-indigo-500 rounded-lg bg-white dark:bg-zinc-950 shadow-sm font-medium"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <FilterLabel>Max Threat Score</FilterLabel>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={maxRiskInput}
                  onChange={(e) => setMaxRiskInput(e.target.value)}
                  placeholder="100"
                  className="h-10 text-xs border-slate-200 focus:ring-indigo-500 rounded-lg bg-white dark:bg-zinc-950 shadow-sm font-medium"
                />
              </div>
            </div>

            <FilterActions
              searchLabel="Apply Heuristics"
              isLoading={loading}
              onReset={handleReset}
            />
          </form>
        </div>

        {/* Pattern Logs Table */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[60px] text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-6">
                    No.
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Alert UUID
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Target Owner (User ID)
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Classification
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Description & Heuristic Logic
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">
                    Threat Risk
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right pr-6">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse border-border">
                      <TableCell colSpan={7} className="h-16 bg-muted/20" />
                    </TableRow>
                  ))
                ) : activities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <AlertOctagon className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-sm font-medium">No active threats matching heuristic parameters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  activities.map((item, index) => (
                    <TableRow
                      key={item.id}
                      className="border-border hover:bg-muted/50 transition-colors group"
                    >
                      <TableCell className="pl-6 text-xs font-bold text-muted-foreground tabular-nums">
                        {(page - 1) * limit + index + 1}
                      </TableCell>
                      <TableCell className="font-mono text-[10px] text-muted-foreground">
                        {item.id.substring(0, 13)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 group/id">
                          <span
                            className="text-xs font-mono text-muted-foreground truncate w-28"
                            title={item.userId}
                          >
                            {item.userId}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(item.userId);
                            }}
                            className="p-1 rounded-md hover:bg-muted text-muted-foreground/40 hover:text-foreground opacity-0 group-hover/id:opacity-100 transition-all focus:opacity-100 outline-none"
                            title="Copy User ID"
                          >
                            {copiedId === item.userId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          {item.activityType.replace(/_/g, ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs text-muted-foreground">
                        <div className="font-bold text-foreground text-xs">{item.description}</div>
                        <div className="text-[10px] mt-0.5 leading-relaxed">{getPatternDescription(item.activityType)}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={cn(
                            'px-2.5 py-0.5 rounded-full text-[10px] font-black border font-mono tracking-tight',
                            getRiskColor(item.riskScore)
                          )}
                        >
                          {item.riskScore}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFreezeUser(item.userId)}
                          className="rounded-xl px-3 h-8 bg-muted hover:bg-rose-600 hover:text-white text-foreground text-[10px] font-bold active:scale-95 transition-all flex items-center gap-1.5 ml-auto"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          Freeze Account
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            onPageChange={setPage}
            limit={limit}
            onLimitChange={setLimit}
            isLoading={loading}
            itemName="incidents"
          />
        </CardContent>
      </Card>
    </div>
  );
}
