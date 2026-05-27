'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/admin-api';
import {
  ChevronLeft,
  RefreshCw,
  TrendingUp,
  Percent,
  Coins,
  History,
  Activity,
  User,
  CheckCircle,
  AlertCircle,
  FileText,
  X,
  Compass,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { TablePagination } from '@/components/common/TablePagination';
import {
  FilterSearchInput,
  FilterSelect,
  FilterActions,
} from '@/components/common/FilterElements';

interface PartnerRecord {
  id: string;
  name: string;
  taxId: string;
  feeRate: number;
  status: string;
  financeAccounts?: {
    available?: string;
    pending?: string;
    fee?: string;
    vat?: string;
  };
}

export default function SettlementPage() {
  const [activeTab, setActiveTab] = useState<'history' | 'partners'>('history');

  // History Audit logs (backend-driven)
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  
  // History Pagination, Search & Sorting
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [historySearch, setHistorySearch] = useState('');
  const [historySortBy, setHistorySortBy] = useState('createdAt');
  const [historySortOrder, setHistorySortOrder] = useState('desc');
  const [historyLimit, setHistoryLimit] = useState(10);

  // History Applied Filters
  const [appliedHistorySearch, setAppliedHistorySearch] = useState('');
  const [appliedHistorySortBy, setAppliedHistorySortBy] = useState('createdAt');
  const [appliedHistorySortOrder, setAppliedHistorySortOrder] = useState('desc');

  // Real stats computed from backend or database
  const [stats, setStats] = useState({ volume: 0, fees: 0, count: 0 });

  // Partner list for individual sweeps (backend-driven)
  const [partners, setPartners] = useState<PartnerRecord[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [clearingPartnerId, setClearingPartnerId] = useState<string | null>(null);

  // Partners Pagination, Search, Sorting & Filter
  const [partnerSearch, setPartnerSearch] = useState('');
  const [partnerPage, setPartnerPage] = useState(1);
  const [partnersTotalPages, setPartnerTotalPages] = useState(1);
  const [partnersTotal, setPartnerTotal] = useState(0);
  const [partnerSortBy, setPartnerSortBy] = useState('createdAt');
  const [partnerSortOrder, setPartnerSortOrder] = useState('desc');
  const [partnerStatus, setPartnerStatus] = useState('ALL');
  const [partnerLimit, setPartnerLimit] = useState(10);

  // Partners Applied Filters
  const [appliedPartnerSearch, setAppliedPartnerSearch] = useState('');
  const [appliedPartnerStatus, setAppliedPartnerStatus] = useState('ALL');
  const [appliedPartnerSortBy, setAppliedPartnerSortBy] = useState('createdAt');
  const [appliedPartnerSortOrder, setAppliedPartnerSortOrder] = useState('desc');

  // Detail Modal for specific slip
  const [selectedSlip, setSelectedSlip] = useState<any | null>(null);

  // 1. Fetch Clearing Audit logs (Backend-driven)
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const response: any = await adminApi.settlements.findHistory({
        page,
        limit: historyLimit,
        search: appliedHistorySearch,
        sortBy: appliedHistorySortBy,
        sortOrder: appliedHistorySortOrder,
      });
      setHistory(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotal(response.pagination?.total || 0);

      if (response.stats) {
        setStats({
          volume: Number(response.stats.totalVolume) || 0,
          fees: Number(response.stats.totalFees) || 0,
          count: Number(response.stats.totalCount) || 0,
        });
      }
    } catch (error) {
      console.error('[SETTLEMENT] Fetch history error:', error);
      toast.error('Failed to load settlement history');
    } finally {
      setLoading(false);
    }
  }, [page, historyLimit, appliedHistorySearch, appliedHistorySortBy, appliedHistorySortOrder]);

  // 2. Fetch Merchant partners list (Backend-driven)
  const fetchPartners = useCallback(async () => {
    setPartnersLoading(true);
    try {
      const response: any = await adminApi.settlements.findPartners({
        page: partnerPage,
        limit: partnerLimit,
        search: appliedPartnerSearch,
        status: appliedPartnerStatus,
        sortBy: appliedPartnerSortBy,
        sortOrder: appliedPartnerSortOrder,
      });
      setPartners(response.data || []);
      setPartnerTotalPages(response.pagination?.totalPages || 1);
      setPartnerTotal(response.pagination?.total || 0);
    } catch (e) {
      console.error('[SETTLEMENT] Fetch partners error:', e);
      setPartners([]);
      setPartnerTotalPages(1);
      setPartnerTotal(0);
    } finally {
      setPartnersLoading(false);
    }
  }, [partnerPage, partnerLimit, appliedPartnerSearch, appliedPartnerStatus, appliedPartnerSortBy, appliedPartnerSortOrder]);

  // Apply & Reset Handlers for History
  const handleApplyHistoryFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedHistorySearch(historySearch);
    setAppliedHistorySortBy(historySortBy);
    setAppliedHistorySortOrder(historySortOrder);
    setPage(1);
  };

  const handleResetHistoryFilter = () => {
    setHistorySearch('');
    setHistorySortBy('createdAt');
    setHistorySortOrder('desc');
    setAppliedHistorySearch('');
    setAppliedHistorySortBy('createdAt');
    setAppliedHistorySortOrder('desc');
    setPage(1);
  };

  // Apply & Reset Handlers for Partners
  const handleApplyPartnerFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedPartnerSearch(partnerSearch);
    setAppliedPartnerStatus(partnerStatus);
    setAppliedPartnerSortBy(partnerSortBy);
    setAppliedPartnerSortOrder(partnerSortOrder);
    setPartnerPage(1);
  };

  const handleResetPartnerFilter = () => {
    setPartnerSearch('');
    setPartnerStatus('ALL');
    setPartnerSortBy('createdAt');
    setPartnerSortOrder('desc');
    setAppliedPartnerSearch('');
    setAppliedPartnerStatus('ALL');
    setAppliedPartnerSortBy('createdAt');
    setAppliedPartnerSortOrder('desc');
    setPartnerPage(1);
  };

  useEffect(() => {
    fetchHistory();
  }, [page, historyLimit, appliedHistorySearch, appliedHistorySortBy, appliedHistorySortOrder]);

  useEffect(() => {
    fetchPartners();
  }, [partnerPage, partnerLimit, appliedPartnerSearch, appliedPartnerStatus, appliedPartnerSortBy, appliedPartnerSortOrder]);

  // Global manual sweep cleared
  const handleTriggerSettlement = async () => {
    setTriggering(true);
    try {
      const res = await adminApi.settlements.run();
      toast.success(res.message || 'Settlement processed successfully across all partners!');
      setPage(1);
      fetchHistory();
      fetchPartners();
    } catch (error: any) {
      console.error('[SETTLEMENT] Trigger error:', error);
      toast.error(error.response?.data?.message || 'Failed to trigger settlement run');
    } finally {
      setTriggering(false);
    }
  };

  // Partner-specific manual sweep
  const handlePartnerSweep = async (partnerId: string, partnerName: string) => {
    setClearingPartnerId(partnerId);
    try {
      const res = await adminApi.settlements.runForPartner(partnerId);
      toast.success(`Settlement successfully cleared for ${partnerName}!`);
      setPage(1);
      fetchHistory();
      fetchPartners();
    } catch (error: any) {
      console.error('[SETTLEMENT] Partner trigger error:', error);
      toast.error(error.response?.data?.message || `No pending balance to clear for ${partnerName}`);
    } finally {
      setClearingPartnerId(null);
    }
  };

  return (
    <div className="space-y-6 pb-10 text-foreground animate-in fade-in duration-500">
      {/* Unified Stats + Actions Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-muted/20 dark:bg-muted/10 p-4 rounded-[2rem] border border-border/50">
        {/* Compact Summary Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          <Card className="rounded-2xl border border-border bg-card hover:border-indigo-500/30 transition-all shadow-xs">
            <CardContent className="p-2.5 px-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Cleared Volume
                  </span>
                  <span className="text-sm font-black text-foreground font-mono mt-0.5">
                    {new Intl.NumberFormat('th-TH', {
                      style: 'currency',
                      currency: 'THB',
                    }).format(stats.volume)}
                  </span>
                </div>
              </div>
              <span className="text-[8px] text-emerald-500 font-bold bg-emerald-500/5 px-1.5 py-0.5 rounded-full uppercase tracking-tight hidden sm:inline">
                Gross
              </span>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card hover:border-indigo-500/30 transition-all shadow-xs">
            <CardContent className="p-2.5 px-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 rounded-xl">
                  <Percent className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    MDR Revenue (3%)
                  </span>
                  <span className="text-sm font-black text-foreground font-mono mt-0.5">
                    {new Intl.NumberFormat('th-TH', {
                      style: 'currency',
                      currency: 'THB',
                    }).format(stats.fees)}
                  </span>
                </div>
              </div>
              <span className="text-[8px] text-indigo-500 font-bold bg-indigo-500/5 px-1.5 py-0.5 rounded-full uppercase tracking-tight hidden sm:inline">
                MDR
              </span>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card hover:border-indigo-500/30 transition-all shadow-xs">
            <CardContent className="p-2.5 px-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 rounded-xl">
                  <History className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Total Runs
                  </span>
                  <span className="text-sm font-black text-foreground font-mono mt-0.5">
                    {stats.count} Runs
                  </span>
                </div>
              </div>
              <span className="text-[8px] text-amber-500 font-bold bg-amber-500/5 px-1.5 py-0.5 rounded-full uppercase tracking-tight hidden sm:inline">
                Sweeps
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons Group */}
        <div className="flex items-center gap-3 self-end lg:self-center shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              fetchHistory();
              fetchPartners();
              toast.success('Real-time balances refreshed.');
            }}
            disabled={loading}
            className="rounded-xl border-border bg-card hover:bg-muted h-10 w-10"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={handleTriggerSettlement}
            disabled={triggering}
            className="px-5 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 active:scale-95 transition-all text-xs flex items-center gap-2 h-10"
          >
            <Activity className="w-4 h-4" />
            {triggering ? 'Processing Clears...' : 'Trigger Global Settlement'}
          </Button>
        </div>
      </div>

      {/* Tabs Menu Navigation */}
      <div className="flex border-b border-border gap-6 pt-2">
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-4 text-xs font-bold tracking-tight uppercase relative transition-all duration-300 ${
            activeTab === 'history'
              ? 'text-indigo-500'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Settlement Clearing Runs
          {activeTab === 'history' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('partners')}
          className={`pb-4 text-xs font-bold tracking-tight uppercase relative transition-all duration-300 ${
            activeTab === 'partners'
              ? 'text-indigo-500'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Granular Partner Clears
          {activeTab === 'partners' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500 rounded-full" />
          )}
        </button>
      </div>

      <div className="space-y-6">
        {activeTab === 'history' ? (
          /* ==================== TAB 1: SETTLEMENT HISTORICAL RUNS ==================== */
          <Card className="rounded-[2rem] border border-border shadow-xs overflow-hidden bg-card animate-in fade-in duration-300">
            <CardHeader className="p-6 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wider">
                Settlement Clearing Runs
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">Audit log records of manual and automated midnight batch runs. Click a row to view slips.</CardDescription>
            </CardHeader>

            {/* Standardized Filter Toolbar */}
            <div className="p-4 bg-card border-b border-border">
              <form onSubmit={handleApplyHistoryFilter} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-card text-foreground">
                <FilterSearchInput
                  label="Search Reference"
                  placeholder="Search log by partner name or tax ID..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                />

                <FilterSelect
                  label="Sort By Date"
                  value={`${historySortBy}:${historySortOrder}`}
                  onValueChange={(val) => {
                    const [by, order] = val.split(':');
                    setHistorySortBy(by || 'createdAt');
                    setHistorySortOrder(order || 'desc');
                  }}
                  options={[
                    { label: 'Newest First', value: 'createdAt:desc' },
                    { label: 'Oldest First', value: 'createdAt:asc' },
                  ]}
                />

                <FilterActions
                  searchLabel="Search"
                  isLoading={loading}
                  onReset={handleResetHistoryFilter}
                />
              </form>
            </div>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <th className="py-4 px-6">ID / Batch Ref</th>
                      <th className="py-4 px-6">Execution Date</th>
                      <th className="py-4 px-6">Trigger Type</th>
                      <th className="py-4 px-6 text-right">Gross Cleared</th>
                      <th className="py-4 px-6 text-right">Service Fee (MDR)</th>
                      <th className="py-4 px-6 text-right">Net Payout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-xs font-medium">
                    {loading && history.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-muted-foreground">
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                            <span>Loading historical runs...</span>
                          </div>
                        </td>
                      </tr>
                    ) : history.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-muted-foreground">
                          No settlement clearing logs found.
                        </td>
                      </tr>
                    ) : (
                      history.map((item) => {
                        const gross = Number(item.payload?.pendingAmount) || 0;
                        const fee = Number(item.payload?.mdrFee) || 0;
                        const net = Number(item.payload?.netAmount) || 0;
                        return (
                          <tr
                            key={item.id}
                            onClick={() => setSelectedSlip(item)}
                            className="hover:bg-muted/40 cursor-pointer transition-colors"
                          >
                            <td className="py-4 px-6 font-mono text-[10px] text-muted-foreground">
                              {item.id.substring(0, 13)}...
                            </td>
                            <td className="py-4 px-6">
                              {new Date(item.createdAt).toLocaleString('th-TH')}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-tight ${item.payload?.manual ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                {item.payload?.manual ? 'MANUAL CLEAR' : 'SYSTEM CRON'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right font-mono font-bold text-foreground">
                              ฿{gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-4 px-6 text-right font-mono text-rose-500 font-bold">
                              -฿{fee.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-4 px-6 text-right font-mono text-emerald-500 font-bold">
                              ฿{net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Standardized Table Pagination */}
              <TablePagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                onPageChange={(p) => setPage(p)}
                limit={historyLimit}
                onLimitChange={(l) => setHistoryLimit(l)}
                isLoading={loading}
                itemName="settlements"
              />
            </CardContent>
          </Card>
        ) : (
          /* ==================== TAB 2: GRANULAR PARTNER DIRECTORY ==================== */
          <Card className="rounded-[2rem] border border-border shadow-xs bg-card overflow-hidden animate-in fade-in duration-300">
            <CardHeader className="p-6 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-500" />
                Granular Partner Clears
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">Select and manually clear pending balance for individual merchant partners.</CardDescription>
            </CardHeader>

            {/* Standardized Filter Toolbar */}
            <div className="p-4 bg-card border-b border-border">
              <form onSubmit={handleApplyPartnerFilter} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-card text-foreground">
                <FilterSearchInput
                  label="Search Partner"
                  placeholder="Search partner by name or tax ID..."
                  value={partnerSearch}
                  onChange={(e) => setPartnerSearch(e.target.value)}
                />

                <FilterSelect
                  label="Status"
                  value={partnerStatus}
                  onValueChange={(val) => setPartnerStatus(val || 'ALL')}
                  options={[
                    { label: 'All Status', value: 'ALL' },
                    { label: 'Active Only', value: 'ACTIVE' },
                    { label: 'Suspended Only', value: 'SUSPENDED' },
                  ]}
                />

                <FilterSelect
                  label="Sort By"
                  value={`${partnerSortBy}:${partnerSortOrder}`}
                  onValueChange={(val) => {
                    const [by, order] = val.split(':');
                    setPartnerSortBy(by || 'createdAt');
                    setPartnerSortOrder(order || 'desc');
                  }}
                  options={[
                    { label: 'Newest Registered', value: 'createdAt:desc' },
                    { label: 'Oldest Registered', value: 'createdAt:asc' },
                    { label: 'Name (A-Z)', value: 'name:asc' },
                    { label: 'Name (Z-A)', value: 'name:desc' },
                  ]}
                />

                <FilterActions
                  searchLabel="Search"
                  isLoading={partnersLoading}
                  onReset={handleResetPartnerFilter}
                />
              </form>
            </div>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <th className="py-4 px-6">Partner Name</th>
                      <th className="py-4 px-6">Partner ID</th>
                      <th className="py-4 px-6">Tax / Registration ID</th>
                      <th className="py-4 px-6 text-center">MDR Service Rate</th>
                      <th className="py-4 px-6 text-center">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-xs font-medium">
                    {partnersLoading && partners.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-muted-foreground">
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                            <span>Loading partners directory...</span>
                          </div>
                        </td>
                      </tr>
                    ) : partners.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-muted-foreground">
                          No merchant partners found matching search criteria.
                        </td>
                      </tr>
                    ) : (
                      partners.map((partner) => {
                        const feeRatePercentage = (partner.feeRate ? Number(partner.feeRate) : 0.03) * 100;
                        const isClearingThis = clearingPartnerId === partner.id;
                        const isActive = partner.status === 'ACTIVE';
                        return (
                          <tr key={partner.id} className="hover:bg-muted/40 transition-colors">
                            <td className="py-4 px-6 font-bold text-foreground">
                              {partner.name}
                            </td>
                            <td className="py-4 px-6 font-mono text-muted-foreground text-[10px]">
                              {partner.id}
                            </td>
                            <td className="py-4 px-6 font-mono text-muted-foreground">
                              {partner.taxId}
                            </td>
                            <td className="py-4 px-6 text-center font-bold text-indigo-600">
                              {feeRatePercentage.toFixed(1)}%
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-tight ${isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                                {partner.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <Button
                                size="sm"
                                onClick={() => handlePartnerSweep(partner.id, partner.name)}
                                disabled={isClearingThis || !isActive}
                                className="h-8 rounded-xl bg-muted hover:bg-indigo-600 hover:text-white text-foreground text-[10px] font-bold active:scale-95 transition-all px-4"
                              >
                                {isClearingThis ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  'Clear Payout'
                                )}
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Standardized Table Pagination */}
              <TablePagination
                currentPage={partnerPage}
                totalPages={partnersTotalPages}
                totalItems={partnersTotal}
                onPageChange={(p) => setPartnerPage(p)}
                limit={partnerLimit}
                onLimitChange={(l) => setPartnerLimit(l)}
                isLoading={partnersLoading}
                itemName="partners"
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed Settlement slip modal showing Withholding Tax (WHT 3%) */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="max-w-md w-full border border-border bg-card shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-6 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wider">Settlement Clearing Slip</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1">Transaction record breakdown details.</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedSlip(null)}
                className="rounded-full h-8 w-8 hover:bg-muted"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </Button>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              {/* Receipt Visual layout */}
              <div className="bg-white text-slate-900 p-6 rounded-2xl border border-slate-200 font-mono text-xs space-y-4 leading-normal shadow-xs">
                <div className="text-center border-b border-dashed border-slate-400 pb-3">
                  <h4 className="font-black text-sm">*** J-LEDGER SETTLEMENT ***</h4>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Midnight sweep payout receipt</span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span>Batch Ref:</span>
                    <span className="font-bold">{selectedSlip.id.substring(0, 15)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Execution date:</span>
                    <span className="font-bold">{new Date(selectedSlip.createdAt).toLocaleDateString('th-TH')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MDR Rate:</span>
                    <span className="font-bold text-indigo-600">{(selectedSlip.payload?.feeRate * 100 || 3).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="h-[1px] bg-slate-300 border-b border-dashed border-slate-300"></div>

                <div className="space-y-2">
                  <div className="flex justify-between text-slate-600 font-bold">
                    <span>Gross Cleared Balance:</span>
                    <span>฿{(Number(selectedSlip.payload?.pendingAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>MDR Service Fee:</span>
                    <span>-฿{(Number(selectedSlip.payload?.mdrFee) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Withholding Tax (WHT 3% of fee):</span>
                    <span>฿{(Number(selectedSlip.payload?.mdrFee || 0) * 0.03).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="h-[1px] bg-slate-300 border-b border-dashed border-slate-300"></div>

                <div className="flex justify-between text-sm font-black text-emerald-600">
                  <span>Net Payout Cash Flow:</span>
                  <span>฿{(Number(selectedSlip.payload?.netAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="text-center text-[9px] text-slate-400 border-t border-dashed border-slate-400 pt-3">
                  <span>SOLVENCY INDEX AUDITED & STABLE</span>
                </div>
              </div>

              <Button
                onClick={() => setSelectedSlip(null)}
                className="w-full py-2.5 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white text-xs mt-2"
              >
                Close Receipt
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
