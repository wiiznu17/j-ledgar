'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Smartphone,
  ShieldCheck,
  Ban,
  HelpCircle,
  RefreshCw,
  LogOut,
  Compass,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/admin-api';
import {
  FilterActions,
  FilterSearchInput,
  FilterSelect,
} from '@/components/common/FilterElements';
import { TablePagination } from '@/components/common/TablePagination';
import { cn } from '@/lib/utils';

interface DeviceRecord {
  id: string;
  userId: string;
  email?: string | null;
  phoneNumber?: string | null;
  deviceName?: string | null;
  deviceIdentifier: string;
  deviceType?: string | null;
  osVersion?: string | null;
  appVersion?: string | null;
  trustLevel: 'UNKNOWN' | 'TRUSTED' | 'UNTRUSTED';
  lastSeenAt?: string | null;
  createdAt: string;
  lastIp?: string | null;
  lastLocation?: string | null;
  sessionRevokedAt?: string | null;
}

interface DeviceStats {
  total: number;
  trusted: number;
  untrusted: number;
  unknown: number;
}

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Never seen';

  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusLabel = (trustLevel: DeviceRecord['trustLevel']) => {
  if (trustLevel === 'TRUSTED') return 'ACTIVE';
  if (trustLevel === 'UNTRUSTED') return 'REVOKED';
  return 'UNKNOWN';
};

const getOsLabel = (device: DeviceRecord) => {
  return device.osVersion || device.deviceType || 'Unknown OS';
};

export default function DevicesPage() {
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [stats, setStats] = useState<DeviceStats>({
    total: 0,
    trusted: 0,
    untrusted: 0,
    unknown: 0,
  });
  const [loading, setLoading] = useState(false);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filter Inputs (Temporary states)
  const [searchInput, setSearchInput] = useState('');
  const [osInput, setOsInput] = useState('ALL');
  const [trustInput, setTrustInput] = useState('ALL');

  // Applied Filters (Used for API calls)
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedOs, setAppliedOs] = useState('ALL');
  const [appliedTrust, setAppliedTrust] = useState('ALL');

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.users.findDevices({
        page,
        limit,
        search: appliedSearch || undefined,
        os: appliedOs !== 'ALL' ? appliedOs : undefined,
        trustLevel: appliedTrust !== 'ALL' ? appliedTrust : undefined,
      });

      const safeData = Array.isArray(response?.data) ? response.data : [];
      const safePagination = response?.pagination ?? {
        total: safeData.length,
        totalPages: 1,
      };

      setDevices(safeData);
      setStats(
        response?.stats ?? {
          total: safeData.length,
          trusted: safeData.filter((item) => item.trustLevel === 'TRUSTED').length,
          untrusted: safeData.filter((item) => item.trustLevel === 'UNTRUSTED').length,
          unknown: safeData.filter((item) => item.trustLevel === 'UNKNOWN').length,
        },
      );
      setTotal(safePagination.total || safeData.length);
      setTotalPages(safePagination.totalPages || 1);
    } catch (error) {
      console.error('[DEVICES_PAGE] Fetch error:', error);
      toast.error('Failed to load user devices from database');
    } finally {
      setLoading(false);
    }
  }, [page, limit, appliedSearch, appliedOs, appliedTrust]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchInput);
    setAppliedOs(osInput);
    setAppliedTrust(trustInput);
    setPage(1);
  };

  const handleReset = () => {
    setSearchInput('');
    setOsInput('ALL');
    setTrustInput('ALL');
    setAppliedSearch('');
    setAppliedOs('ALL');
    setAppliedTrust('ALL');
    setPage(1);
  };

  const handleRefresh = () => {
    fetchDevices();
    toast.success('Device registry refreshed from database.');
  };

  const handleRevoke = async (item: DeviceRecord) => {
    setMutatingId(item.id);
    try {
      await adminApi.users.revokeDevice(item.id);
      toast.success(`Session for ${item.deviceName || item.deviceIdentifier} revoked.`);
      fetchDevices();
    } catch (error) {
      console.error('[DEVICES_PAGE] Revoke error:', error);
      toast.error('Failed to revoke device session');
    } finally {
      setMutatingId(null);
    }
  };

  const handleReactivate = async (item: DeviceRecord) => {
    setMutatingId(item.id);
    try {
      await adminApi.users.reactivateDevice(item.id);
      toast.success(`Device ${item.deviceName || item.deviceIdentifier} restored.`);
      fetchDevices();
    } catch (error) {
      console.error('[DEVICES_PAGE] Reactivate error:', error);
      toast.error('Failed to reactivate device');
    } finally {
      setMutatingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-10 text-foreground">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-muted/20 dark:bg-muted/10 p-4 rounded-[2rem] border border-border/50">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          <Card className="rounded-2xl border border-border bg-card hover:border-emerald-500/30 transition-all shadow-xs">
            <CardContent className="p-2.5 px-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Active Sessions
                  </span>
                  <span className="text-sm font-black text-foreground font-mono mt-0.5">
                    {stats.trusted} Devices
                  </span>
                </div>
              </div>
              <span className="text-[8px] text-emerald-500 font-bold bg-emerald-500/5 px-1.5 py-0.5 rounded-full uppercase tracking-tight hidden sm:inline">
                Trusted
              </span>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card hover:border-rose-500/30 transition-all shadow-xs">
            <CardContent className="p-2.5 px-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/10 rounded-xl">
                  <Ban className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Revoked Terminals
                  </span>
                  <span className="text-sm font-black text-foreground font-mono mt-0.5">
                    {stats.untrusted} Sessions
                  </span>
                </div>
              </div>
              <span className="text-[8px] text-rose-500 font-bold bg-rose-500/5 px-1.5 py-0.5 rounded-full uppercase tracking-tight hidden sm:inline">
                Blocked
              </span>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card hover:border-indigo-500/30 transition-all shadow-xs">
            <CardContent className="p-2.5 px-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Registered Devices
                  </span>
                  <span className="text-sm font-black text-foreground font-mono mt-0.5">
                    {stats.total} Total
                  </span>
                </div>
              </div>
              <span className="text-[8px] text-indigo-500 font-bold bg-indigo-500/5 px-1.5 py-0.5 rounded-full uppercase tracking-tight hidden sm:inline">
                Registry
              </span>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-3 self-end lg:self-center shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={loading}
            className="rounded-xl border-border bg-card hover:bg-muted h-10 w-10"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-xs overflow-hidden bg-card text-card-foreground">
        <div className="p-4 bg-card border-b border-border">
          <form
            onSubmit={handleApplyFilter}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end bg-card text-foreground"
          >
            <FilterSearchInput
              label="User / Device"
              placeholder="Search email, phone, UUID, model, fingerprint..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />

            <FilterSelect
              label="Operating System"
              value={osInput}
              onValueChange={setOsInput}
              options={[
                { label: 'All Platforms', value: 'ALL' },
                { label: 'iOS', value: 'iOS' },
                { label: 'Android', value: 'Android' },
                { label: 'macOS', value: 'macOS' },
                { label: 'Windows', value: 'Windows' },
              ]}
            />

            <FilterSelect
              label="Trust Status"
              value={trustInput}
              onValueChange={setTrustInput}
              options={[
                { label: 'All Statuses', value: 'ALL' },
                { label: 'Trusted', value: 'TRUSTED' },
                { label: 'Untrusted / Revoked', value: 'UNTRUSTED' },
                { label: 'Unknown', value: 'UNKNOWN' },
              ]}
            />

            <FilterActions searchLabel="Search" isLoading={loading} onReset={handleReset} />
          </form>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[60px] text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-6">
                    No.
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    User Account
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Hardware Model / OS
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Device Fingerprint
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Network Details
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">
                    Last Seen
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
                {loading && devices.length === 0 ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index} className="animate-pulse border-border">
                      <TableCell colSpan={8} className="h-16 bg-muted/20" />
                    </TableRow>
                  ))
                ) : devices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <HelpCircle className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-sm font-medium">No user devices matching search criteria</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  devices.map((item, index) => {
                    const statusLabel = getStatusLabel(item.trustLevel);
                    const isRevoked = item.trustLevel === 'UNTRUSTED';
                    const isMutating = mutatingId === item.id;

                    return (
                      <TableRow
                        key={item.id}
                        className="border-border hover:bg-muted/50 transition-colors group"
                      >
                        <TableCell className="pl-6 text-xs font-bold text-muted-foreground tabular-nums">
                          {(page - 1) * limit + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-foreground">
                              {item.email || item.phoneNumber || 'Unknown user'}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {item.userId}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-muted rounded-lg">
                              <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-bold text-foreground">
                                {item.deviceName || 'Unknown device'}
                              </span>
                              <span className="text-[9px] text-muted-foreground font-mono">
                                {getOsLabel(item)}
                                {item.appVersion ? ` / ${item.appVersion}` : ''}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-[10px] text-muted-foreground break-all">
                            {item.deviceIdentifier}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-xs text-foreground font-bold">
                              {item.lastIp || 'No IP logged'}
                            </span>
                            <span className="text-[9px] text-muted-foreground flex items-center gap-1 font-bold">
                              <Compass className="w-3 h-3 text-indigo-500" />
                              {item.lastLocation || 'Unknown location'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground font-mono text-[10px]">
                          {formatDateTime(item.lastSeenAt)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border',
                              item.trustLevel === 'TRUSTED' &&
                                'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                              item.trustLevel === 'UNTRUSTED' &&
                                'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
                              item.trustLevel === 'UNKNOWN' &&
                                'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                            )}
                          >
                            {statusLabel}
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          {isRevoked ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReactivate(item)}
                              disabled={isMutating}
                              className="rounded-xl h-8 hover:bg-indigo-500/10 text-indigo-600 text-[10px] font-bold gap-1.5 px-3 ml-auto active:scale-95 transition-all"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Reactivate
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevoke(item)}
                              disabled={isMutating}
                              className="rounded-xl h-8 hover:bg-rose-500/10 text-rose-600 text-[10px] font-bold gap-1.5 px-3 ml-auto active:scale-95 transition-all"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              Revoke Key
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
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
            onLimitChange={(nextLimit) => {
              setLimit(nextLimit);
              setPage(1);
            }}
            isLoading={loading}
            itemName="devices"
          />
        </CardContent>
      </Card>
    </div>
  );
}
