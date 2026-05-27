'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle,
  Download,
  Landmark,
  Percent,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  FilterActions,
  FilterDatePicker,
  FilterSelect,
} from '@/components/common/FilterElements';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { adminApi, ReportAnalyticsResponse } from '@/lib/admin-api';

const emptyReport: ReportAnalyticsResponse = {
  filters: {
    timeframe: '30D',
    startDate: '',
    endDate: '',
    label: '30D',
  },
  stats: {
    networkVolume: 0,
    volumeGrowth: 0,
    feeEarnings: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    solvencySurplus: 0,
    reconciledRatio: 0,
    totalTransactions: 0,
    completedTransactions: 0,
    failedTransactions: 0,
  },
  chartData: [],
  latestReconciliation: null,
};

const timeframeOptions = [
  { label: 'Last 7 Days', value: '7D' },
  { label: 'Last 30 Days', value: '30D' },
  { label: 'Last 90 Days', value: '90D' },
  { label: 'Year To Date', value: 'YTD' },
];

const currencyFormatter = new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
});

const numberFormatter = new Intl.NumberFormat('th-TH');

function formatCurrency(value: number) {
  return currencyFormatter.format(Number(value || 0));
}

function formatShortCurrency(value: number) {
  const amount = Number(value || 0);
  if (Math.abs(amount) >= 1_000_000) return `฿${(amount / 1_000_000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1_000) return `฿${(amount / 1_000).toFixed(0)}K`;
  return `฿${amount.toFixed(0)}`;
}

function formatPercent(value: number) {
  return `${Number(value || 0).toFixed(2)}%`;
}

function formatDateTime(value?: string | null) {
  if (!value) return 'No audit yet';
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function ReportsPage() {
  const [report, setReport] = useState<ReportAnalyticsResponse>(emptyReport);
  const [loading, setLoading] = useState(true);
  const [timeframeInput, setTimeframeInput] = useState('30D');
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    timeframe: '30D',
    startDate: '',
    endDate: '',
  });

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.reports.getAnalytics({
        timeframe: appliedFilters.timeframe,
        startDate: appliedFilters.startDate || undefined,
        endDate: appliedFilters.endDate || undefined,
      });
      setReport(response);
    } catch (error) {
      console.error('[REPORTS] Fetch error:', error);
      toast.error('Unable to load reports analytics from backend.');
      setReport(emptyReport);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleApplyFilter = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if ((startDateInput && !endDateInput) || (!startDateInput && endDateInput)) {
      toast.error('Please select both start and end dates for a custom range.');
      return;
    }

    setAppliedFilters({
      timeframe: timeframeInput,
      startDate: startDateInput,
      endDate: endDateInput,
    });
  };

  const handleReset = () => {
    setTimeframeInput('30D');
    setStartDateInput('');
    setEndDateInput('');
    setAppliedFilters({
      timeframe: '30D',
      startDate: '',
      endDate: '',
    });
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `admin-report-${report.filters.startDate || 'latest'}-${report.filters.endDate || 'latest'}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Reports analytics exported.');
  };

  const maxChartAmount = useMemo(
    () => Math.max(...report.chartData.map((item) => item.amount), 1),
    [report.chartData],
  );

  const latestAuditDate =
    report.latestReconciliation?.reportDate || report.latestReconciliation?.createdAt;
  const reconciliationStatus = report.latestReconciliation?.status || 'NO_DATA';
  const isDiscrepancy = reconciliationStatus === 'DISCREPANCY';

  return (
    <div className="space-y-6 pb-10 text-foreground animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1">
          <Card className="rounded-2xl border-border bg-card shadow-xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Network Volume
                </p>
                <p className="text-sm font-black text-foreground font-mono truncate">
                  {formatCurrency(report.stats.networkVolume)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border bg-card shadow-xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Percent className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Fee Earnings
                </p>
                <p className="text-sm font-black text-foreground font-mono truncate">
                  {formatCurrency(report.stats.feeEarnings)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border bg-card shadow-xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <Landmark className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Total Assets
                </p>
                <p className="text-sm font-black text-foreground font-mono truncate">
                  {formatCurrency(report.stats.totalAssets)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border bg-card shadow-xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Reconciled
                </p>
                <p className="text-sm font-black text-foreground font-mono truncate">
                  {formatPercent(report.stats.reconciledRatio)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-2 self-end lg:self-center">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchReport}
            disabled={loading}
            className="rounded-xl border-border bg-card hover:bg-muted h-10 w-10"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={handleExport}
            disabled={loading}
            className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-200"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-xs overflow-hidden bg-card text-card-foreground">
        <div className="p-4 bg-card border-b border-border">
          <form
            onSubmit={handleApplyFilter}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
          >
            <FilterSelect
              label="Timeframe"
              value={timeframeInput}
              onValueChange={setTimeframeInput}
              options={timeframeOptions}
            />
            <FilterDatePicker
              label="Start Date"
              value={startDateInput}
              onChange={setStartDateInput}
              placeholder="Optional custom start"
            />
            <FilterDatePicker
              label="End Date"
              value={endDateInput}
              onChange={setEndDateInput}
              placeholder="Optional custom end"
            />
            <FilterActions searchLabel="Apply" isLoading={loading} onReset={handleReset} />
          </form>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px]">
          <CardContent className="p-6 border-r border-border/60">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                  <BarChart3 className="w-4 h-4" />
                  Volume Trajectory
                </div>
                <h3 className="text-lg font-black text-foreground">
                  Backend-filtered financial analytics
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Showing {report.filters.startDate || '-'} to {report.filters.endDate || '-'} from live finance data.
                </p>
              </div>
              <div className="rounded-2xl bg-muted/40 border border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  {report.stats.volumeGrowth >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-rose-500" />
                  )}
                  <span
                    className={`text-sm font-black font-mono ${
                      report.stats.volumeGrowth >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {formatPercent(report.stats.volumeGrowth)}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                  vs previous cycle
                </p>
              </div>
            </div>

            <div className="h-72 flex items-end gap-3 pt-6 font-mono text-[9px] text-muted-foreground font-bold">
              {report.chartData.length ? (
                report.chartData.map((bucket, index) => {
                  const height = Math.max(10, (bucket.amount / maxChartAmount) * 100);
                  return (
                    <div
                      key={`${bucket.startDate}-${bucket.endDate}`}
                      className="flex-1 flex flex-col items-center gap-2 h-full justify-end min-w-[58px]"
                    >
                      <div
                        className={`w-full rounded-xl border transition-all cursor-pointer flex items-end justify-center pb-2 ${
                          index === report.chartData.length - 1
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20'
                            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20'
                        }`}
                        style={{ height: `${height}%` }}
                        title={`${bucket.startDate} - ${bucket.endDate}: ${formatCurrency(bucket.amount)}`}
                      >
                        <span className="font-black rotate-[-8deg]">
                          {formatShortCurrency(bucket.amount)}
                        </span>
                      </div>
                      <span>{bucket.label}</span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-full flex items-center justify-center rounded-3xl border border-dashed border-border bg-muted/20">
                  <div className="text-center">
                    <BarChart3 className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-xs text-muted-foreground font-bold">
                      No transaction volume for this range
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>

          <CardContent className="p-6 space-y-4 bg-muted/10">
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Ledger Balance Sheet
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Uses latest reconciliation snapshot alongside the selected report range.
              </CardDescription>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-card rounded-2xl border border-border">
                <div className="flex items-start gap-3">
                  <Landmark className="w-5 h-5 text-emerald-500 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                      Custodian Assets
                    </div>
                    <div className="font-mono text-sm font-black text-foreground truncate">
                      {formatCurrency(report.stats.totalAssets)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-card rounded-2xl border border-border">
                <div className="flex items-start gap-3">
                  <Wallet className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                      Wallet Liabilities
                    </div>
                    <div className="font-mono text-sm font-black text-foreground truncate">
                      {formatCurrency(report.stats.totalLiabilities)}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`p-4 rounded-2xl border ${
                  report.stats.solvencySurplus >= 0
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-rose-500/10 border-rose-500/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    className={`w-5 h-5 mt-0.5 ${
                      report.stats.solvencySurplus >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                      Solvency Surplus
                    </div>
                    <div
                      className={`font-mono text-sm font-black truncate ${
                        report.stats.solvencySurplus >= 0 ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {formatCurrency(report.stats.solvencySurplus)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-card rounded-2xl border border-border space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Latest Reconciliation
                </span>
                <span
                  className={`text-[10px] font-black px-2 py-1 rounded-full ${
                    isDiscrepancy
                      ? 'bg-rose-500/10 text-rose-500'
                      : 'bg-emerald-500/10 text-emerald-500'
                  }`}
                >
                  {reconciliationStatus}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Last audited: <span className="font-bold text-foreground">{formatDateTime(latestAuditDate)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-muted/40 p-3">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">
                    Total
                  </div>
                  <div className="text-sm font-black font-mono">
                    {numberFormatter.format(report.stats.totalTransactions)}
                  </div>
                </div>
                <div className="rounded-xl bg-muted/40 p-3">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">
                    Done
                  </div>
                  <div className="text-sm font-black font-mono text-emerald-500">
                    {numberFormatter.format(report.stats.completedTransactions)}
                  </div>
                </div>
                <div className="rounded-xl bg-muted/40 p-3">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">
                    Failed
                  </div>
                  <div className="text-sm font-black font-mono text-rose-500">
                    {numberFormatter.format(report.stats.failedTransactions)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
