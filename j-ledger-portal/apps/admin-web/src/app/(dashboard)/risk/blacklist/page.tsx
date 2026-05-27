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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Ban,
  ShieldAlert,
  Search,
  Plus,
  CheckCircle,
  Lock,
  Unlock,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { walletRequester } from '@/lib/requesters/walletRequester';
import { adminApi } from '@/lib/admin-api';
import {
  FilterSearchInput,
  FilterSelect,
  FilterActions,
  FilterLabel,
} from '@/components/common/FilterElements';
import { TablePagination } from '@/components/common/TablePagination';
import { cn } from '@/lib/utils';

interface BlacklistRecord {
  id: string;
  type: 'WALLET' | 'IP' | 'HARDWARE';
  target: string;
  userId?: string;
  reason: string;
  severity: 'HIGH' | 'CRITICAL';
  blacklistedAt: string;
  enforcedBy: string;
  status: 'ACTIVE' | 'RELEASED';
}

export default function BlacklistPage() {
  const [frozenWallets, setFrozenWallets] = useState<any[]>([]);
  const [simulatedBlocks, setSimulatedBlocks] = useState<BlacklistRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTarget, setNewTarget] = useState('');
  const [newType, setNewType] = useState<'WALLET' | 'IP' | 'HARDWARE'>('WALLET');
  const [newReason, setNewReason] = useState('');
  const [newSeverity, setNewSeverity] = useState<'HIGH' | 'CRITICAL'>('HIGH');
  const [submittingBlock, setSubmittingBlock] = useState(false);

  // Filter Inputs (Temporary states)
  const [searchTarget, setSearchTarget] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Applied Filters
  const [appliedTarget, setAppliedTarget] = useState('');
  const [appliedType, setAppliedType] = useState('ALL');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success('Copied Target ID to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Fetch real frozen wallets and blocked nodes from database
  const fetchFrozenWallets = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch frozen wallets from Core Database
      const response = await walletRequester.getWallets({
        page: 0,
        size: 200, // Fetch top active wallets to capture frozen ones
      });
      const safeData = Array.isArray(response?.data) ? response.data : [];
      const frozen = safeData.filter((w: any) => w.status === 'FROZEN' || w.status === 'INACTIVE');
      setFrozenWallets(frozen);

      // 2. Fetch IP/Hardware nodes from Redis via BFF
      const nodesResponse = await adminApi.blacklist.findNodes();
      const safeNodes = Array.isArray(nodesResponse?.data) ? nodesResponse.data : [];
      setSimulatedBlocks(safeNodes);
    } catch (error) {
      console.error('[BLACKLIST] Fetch data error:', error);
      toast.error('Failed to load active restricted wallets and nodes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFrozenWallets();
  }, [fetchFrozenWallets]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedTarget(searchTarget);
    setAppliedType(typeFilter);
    setPage(1);
  };

  const handleReset = () => {
    setSearchTarget('');
    setTypeFilter('ALL');
    setAppliedTarget('');
    setAppliedType('ALL');
    setPage(1);
  };

  const handleToggleStatus = async (item: BlacklistRecord) => {
    setLoading(true);
    try {
      if (item.type === 'WALLET' && item.userId) {
        // WALLET triggers actual DB unfreeze / freeze
        if (item.status === 'ACTIVE') {
          await walletRequester.unfreezeWallet(item.userId);
          toast.success(`Wallet ${item.target.split(' ')[0]} whitelisted & released successfully.`);
        } else {
          await walletRequester.freezeWallet(item.userId);
          toast.error(`Wallet ${item.target.split(' ')[0]} re-blocked successfully.`);
        }
        fetchFrozenWallets();
      } else if (item.type === 'IP' || item.type === 'HARDWARE') {
        // IP/HARDWARE toggles via real BFF endpoints!
        if (item.status === 'ACTIVE') {
          await adminApi.blacklist.unblockNode({
            type: item.type,
            target: item.target,
          });
          toast.success(`${item.target} whitelisted & released.`);
        } else {
          await adminApi.blacklist.blockNode({
            type: item.type,
            target: item.target,
            reason: item.reason,
            severity: item.severity,
          });
          toast.error(`${item.target} has been re-blocked.`);
        }
        fetchFrozenWallets();
      }
    } catch (e) {
      toast.error(`Failed to modify block for ${item.target}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTarget.trim() || !newReason.trim()) {
      toast.error('Please fill in all fields.');
      return;
    }

    setSubmittingBlock(true);
    try {
      if (newType === 'WALLET') {
        // For wallets, newTarget should be the User ID or Wallet ID
        // Trigger actual database freeze transaction
        await walletRequester.freezeWallet(newTarget);
        toast.error(`User wallet ${newTarget} successfully frozen and restricted!`);
        fetchFrozenWallets();
      } else {
        // IP/HARDWARE added via real BFF endpoint!
        await adminApi.blacklist.blockNode({
          type: newType,
          target: newTarget,
          reason: newReason,
          severity: newSeverity,
        });
        toast.success(`Restriction on ${newTarget} successfully enforced!`);
        fetchFrozenWallets();
      }
      setShowAddModal(false);
      setNewTarget('');
      setNewReason('');
    } catch (error) {
      toast.error('Failed to enforce restriction. Verify Target Owner ID.');
    } finally {
      setSubmittingBlock(false);
    }
  };

  // Merge database and simulated lists
  const mergedList: BlacklistRecord[] = [
    ...frozenWallets.map((w) => ({
      id: `BLK-${w.walletId}`,
      type: 'WALLET' as const,
      target: `${w.walletId} (Owner: ${w.userId.substring(0, 8)}...)`,
      userId: w.userId,
      reason: 'Flagged AML structuring or freeze heuristic.',
      severity: 'CRITICAL' as const,
      blacklistedAt: new Date(w.updatedAt).toISOString().replace('T', ' ').substring(0, 16),
      enforcedBy: 'Auditor Patrol',
      status: w.status === 'FROZEN' ? ('ACTIVE' as const) : ('RELEASED' as const),
    })),
    ...simulatedBlocks,
  ];

  // Apply filters
  const filtered = mergedList.filter((item) => {
    const matchesSearch =
      item.target.toLowerCase().includes(appliedTarget.toLowerCase()) ||
      item.reason.toLowerCase().includes(appliedTarget.toLowerCase()) ||
      item.id.toLowerCase().includes(appliedTarget.toLowerCase());
    const matchesType = appliedType === 'ALL' || item.type === appliedType;
    return matchesSearch && matchesType;
  });

  // Paginated chunk
  const paginatedList = filtered.slice((page - 1) * limit, page * limit);
  const totalPagesCount = Math.max(1, Math.ceil(filtered.length / limit));

  return (
    <div className="space-y-6 pb-10 text-foreground">
      {/* Unified Stats + Actions Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-muted/20 dark:bg-muted/10 p-4 rounded-[2rem] border border-border/50">
        {/* Compact Summary Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          <Card className="rounded-2xl border border-border bg-card hover:border-rose-500/30 transition-all shadow-xs">
            <CardContent className="p-2.5 px-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/10 rounded-xl">
                  <Ban className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Active Blocks
                  </span>
                  <span className="text-sm font-black text-foreground font-mono mt-0.5">
                    {filtered.filter((i) => i.status === 'ACTIVE').length} Nodes
                  </span>
                </div>
              </div>
              <span className="text-[8px] text-rose-500 font-bold bg-rose-500/5 px-1.5 py-0.5 rounded-full uppercase tracking-tight hidden sm:inline">
                Restricted
              </span>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card hover:border-rose-500/30 transition-all shadow-xs">
            <CardContent className="p-2.5 px-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 rounded-xl">
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Critical Severity
                  </span>
                  <span className="text-sm font-black text-foreground font-mono mt-0.5">
                    {filtered.filter((i) => i.severity === 'CRITICAL' && i.status === 'ACTIVE').length} Blocked
                  </span>
                </div>
              </div>
              <span className="text-[8px] text-amber-500 font-bold bg-amber-500/5 px-1.5 py-0.5 rounded-full uppercase tracking-tight hidden sm:inline">
                Threats
              </span>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card hover:border-indigo-500/30 transition-all shadow-xs">
            <CardContent className="p-2.5 px-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Released Appeals
                  </span>
                  <span className="text-sm font-black text-foreground font-mono mt-0.5">
                    {filtered.filter((i) => i.status === 'RELEASED').length} Cleared
                  </span>
                </div>
              </div>
              <span className="text-[8px] text-emerald-500 font-bold bg-emerald-500/5 px-1.5 py-0.5 rounded-full uppercase tracking-tight hidden sm:inline">
                Whitelisted
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
              fetchFrozenWallets();
              toast.success('Live database restrictions scanned.');
            }}
            disabled={loading}
            className="rounded-xl border-border bg-card hover:bg-muted h-10 w-10"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 active:scale-95 transition-all text-xs flex items-center gap-2 h-10"
          >
            <Plus className="w-4 h-4" />
            Add Restriction
          </Button>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <Card className="border-none shadow-xs overflow-hidden bg-card text-card-foreground">
        <div className="p-4 bg-card border-b border-border">
          <form
            onSubmit={handleApplyFilter}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-card text-foreground"
          >
            <FilterSearchInput
              label="Target Node / UUID"
              placeholder="Search restricted wallet, IP address, hardware ID..."
              value={searchTarget}
              onChange={(e) => setSearchTarget(e.target.value)}
            />

            <FilterSelect
              label="Restriction Type"
              value={typeFilter}
              onValueChange={setTypeFilter}
              options={[
                { label: 'All Restrictions', value: 'ALL' },
                { label: 'Wallet Accounts', value: 'WALLET' },
                { label: 'IP Address Logs', value: 'IP' },
                { label: 'Hardware Key Revocations', value: 'HARDWARE' },
              ]}
            />

            <FilterActions searchLabel="Search" isLoading={loading} onReset={handleReset} />
          </form>
        </div>

        {/* Main Content Table */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[60px] text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-6">
                    No.
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Block Reference
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Target Address / Node
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Incident Justification & Reason
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Enforcement Date
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">
                    Severity
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">
                    Status
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right pr-6">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && paginatedList.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse border-border">
                      <TableCell colSpan={8} className="h-16 bg-muted/20" />
                    </TableRow>
                  ))
                ) : paginatedList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <Ban className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-sm font-medium">No restricted entities matching search criteria</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedList.map((item, index) => (
                    <TableRow
                      key={item.id}
                      className="border-border hover:bg-muted/50 transition-colors group"
                    >
                      <TableCell className="pl-6 text-xs font-bold text-muted-foreground tabular-nums">
                        {(page - 1) * limit + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-[10px] font-bold text-muted-foreground">
                            {item.id}
                          </span>
                          <span className="text-[8px] font-black text-rose-500 bg-rose-500/5 px-1.5 py-0.5 rounded-md w-fit uppercase tracking-tighter border border-rose-500/10">
                            {item.type}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 group/target">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {item.target}
                          </span>
                          <button
                            onClick={() => handleCopy(item.userId || item.target.split(' ')[0] || '')}
                            className="p-1 rounded-md hover:bg-muted text-muted-foreground/40 hover:text-foreground opacity-0 group-hover/target:opacity-100 transition-all outline-none"
                            title="Copy Target ID"
                          >
                            {copiedId === (item.userId || item.target.split(' ')[0] || '') ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                        {item.reason}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {item.blacklistedAt}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider ${item.severity === 'CRITICAL' ? 'bg-rose-600/10 text-rose-600 border border-rose-600/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'}`}
                        >
                          {item.severity}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase ${item.status === 'ACTIVE' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'}`}
                        >
                          {item.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(item)}
                          className={cn(
                            'rounded-xl h-8 text-[10px] font-bold gap-1.5 px-3 ml-auto flex items-center',
                            item.status === 'ACTIVE'
                              ? 'hover:bg-emerald-500/10 text-emerald-600'
                              : 'hover:bg-rose-500/10 text-rose-600'
                          )}
                        >
                          {item.status === 'ACTIVE' ? (
                            <>
                              <Unlock className="w-3.5 h-3.5" /> Whitelist
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" /> Re-Block
                            </>
                          )}
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
            totalPages={totalPagesCount}
            totalItems={filtered.length}
            onPageChange={setPage}
            limit={limit}
            onLimitChange={setLimit}
            isLoading={loading}
            itemName="restrictions"
          />
        </CardContent>
      </Card>

      {/* Add Restriction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="max-w-md w-full border border-border bg-card shadow-2xl rounded-[2rem] overflow-hidden">
            <CardHeader className="p-6 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-base font-bold text-foreground">Add Network Block</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">Restrict custom nodes immediately.</CardDescription>
            </CardHeader>
            <form onSubmit={handleAddBlacklist} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['WALLET', 'IP', 'HARDWARE'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewType(t)}
                      className={`py-2 text-xs font-bold rounded-xl border border-border uppercase tracking-tight transition-all ${newType === t ? 'bg-rose-600 text-white border-rose-600 shadow-sm' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {newType === 'WALLET' ? 'Target Owner ID (User UUID)' : 'Target Address / Node'}
                </label>
                <Input
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  placeholder={newType === 'WALLET' ? 'Enter User UUID...' : newType === 'IP' ? 'e.g. 192.168.1.1' : 'e.g. HW-8D3A20B'}
                  className="rounded-xl border-border bg-card dark:bg-zinc-950 text-xs w-full text-foreground h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Severity</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['HIGH', 'CRITICAL'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewSeverity(s)}
                      className={`py-2 text-xs font-bold rounded-xl border border-border uppercase tracking-tight transition-all ${newSeverity === s ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Incident Justification / Reason</label>
                <textarea
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="Justify blacklist enforcement action..."
                  className="rounded-xl border border-border bg-card dark:bg-zinc-950 text-xs w-full text-foreground p-3 h-24 focus:outline-hidden focus:ring-1 focus:ring-rose-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  variant="outline"
                  className="flex-1 rounded-xl h-10 text-xs font-bold border-border bg-card hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingBlock}
                  className="flex-1 rounded-xl h-10 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 active:scale-95 transition-all"
                >
                  {submittingBlock ? 'Enforcing...' : 'Enforce Restriction'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
