'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Wallet, 
  ShieldAlert, 
  ShieldCheck,
  MoreHorizontal,
  ArrowRight
} from 'lucide-react';
import { walletRequester } from '@/lib/requesters';
import { WalletDto } from '@repo/dto';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function WalletAccountsPage() {
  const [wallets, setWallets] = useState<WalletDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userRole, setUserRole] = useState('SUPPORT_STAFF');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const role = document.cookie
      .split('; ')
      .find((row) => row.startsWith('user_role='))
      ?.split('=')[1];
    if (role) setUserRole(role);
  }, []);

  const fetchWallets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await walletRequester.getWallets({
        page: page - 1,
        size: 10
      });
      
      // Filter client-side if search is used (since Java search is simplified)
      let filteredData = response.data;
      if (searchQuery) {
        filteredData = filteredData.filter(w => 
          w.walletId.toLowerCase().includes(searchQuery.toLowerCase()) || 
          w.userId.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      if (statusFilter !== 'ALL') {
        filteredData = filteredData.filter(w => w.status === statusFilter);
      }

      setWallets(filteredData);
      setTotal(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('[WALLET_ACCOUNTS] Fetch error:', error);
      toast.error('Failed to fetch wallet accounts');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchWallets();
  };

  const handleReset = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setPage(1);
  };

  const handleToggleFreeze = async (wallet: WalletDto) => {
    const isFrozen = wallet.status === 'FROZEN';
    const action = isFrozen ? 'unfreeze' : 'freeze';
    
    try {
      if (isFrozen) {
        await walletRequester.unfreezeWallet(wallet.userId);
        toast.success(`Wallet ${wallet.walletId} has been unfrozen`);
      } else {
        await walletRequester.freezeWallet(wallet.userId);
        toast.error(`Wallet ${wallet.walletId} has been frozen`, {
          icon: <ShieldAlert className="w-4 h-4 text-rose-500" />
        });
      }
      fetchWallets();
    } catch (error) {
      toast.error(`Failed to ${action} wallet`);
    }
  };

  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  return (
    <div className="space-y-6 pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-indigo-50 rounded-lg">
              <Wallet className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Wallet Accounts</h2>
          </div>
          <p className="text-slate-500">
            Monitor and manage all user wallets and their financial states.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
            Total Wallets: {total}
          </Badge>
        </div>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden bg-white">
        {/* Filter Toolbar */}
        <div className="p-4 bg-white border-b border-slate-100">
          <form onSubmit={handleApplyFilter} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Search Wallet / User
              </label>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <Input 
                  placeholder="W-XXXXXX or UUID" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 !h-10 w-full text-sm border-slate-200 focus:ring-indigo-500 rounded-xl bg-slate-50/50 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Account Status
              </label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || 'ALL')}>
                <SelectTrigger className="w-full bg-slate-50/50 border-slate-200 !h-10 rounded-xl font-medium text-sm focus:bg-white transition-all">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="FROZEN">FROZEN</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 md:col-span-2">
              <Button 
                type="button"
                variant="ghost" 
                onClick={handleReset}
                className="flex-1 !h-10 font-bold text-xs uppercase tracking-wider text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-2" />
                Reset
              </Button>
              <Button 
                type="submit"
                className="flex-[2] !h-10 font-bold text-xs uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-100"
              >
                <Filter className="w-3.5 h-3.5 mr-2" />
                Apply Filters
              </Button>
            </div>
          </form>
        </div>

        {/* Table Content */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="w-[180px] text-[11px] font-bold text-slate-500 uppercase tracking-wider">Wallet ID</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Owner (User ID)</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Balance</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Last Updated</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse border-slate-50">
                      <TableCell colSpan={6} className="h-16 bg-slate-50/20" />
                    </TableRow>
                  ))
                ) : wallets.length > 0 ? (
                  wallets.map((wallet) => (
                    <TableRow key={wallet.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors group">
                      <TableCell className="font-mono text-xs font-bold text-indigo-600">
                        {wallet.walletId}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-mono text-slate-400 truncate w-40" title={wallet.userId}>
                            {wallet.userId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          "font-bold tabular-nums",
                          wallet.balance > 0 ? "text-emerald-600" : "text-slate-900"
                        )}>
                          {wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="ml-1 text-[10px] font-bold text-slate-400">{wallet.currency}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          className={cn(
                            "rounded-lg px-2 py-0.5 text-[10px] font-bold border-none",
                            wallet.status === 'ACTIVE' && "bg-emerald-50 text-emerald-600 hover:bg-emerald-50",
                            wallet.status === 'FROZEN' && "bg-rose-50 text-rose-600 hover:bg-rose-50",
                            wallet.status === 'INACTIVE' && "bg-slate-100 text-slate-500 hover:bg-slate-100"
                          )}
                        >
                          {wallet.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-slate-400">
                        {new Date(wallet.updatedAt).toLocaleDateString()} {new Date(wallet.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <Popover>
                            <PopoverTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                              <MoreHorizontal className="h-4 w-4" />
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-48 p-2 rounded-xl border-slate-100 shadow-xl bg-white">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-2">Management</div>
                              <div className="h-px bg-slate-50 my-1" />
                              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                                <Search className="w-4 h-4 mr-2 text-slate-400" /> View History
                              </button>
                              
                              {isSuperAdmin && (
                                <>
                                  <div className="h-px bg-slate-50 my-1" />
                                  <button 
                                    className={cn(
                                      "flex items-center w-full px-3 py-2 text-sm font-bold rounded-lg transition-colors",
                                      wallet.status === 'FROZEN' ? "text-emerald-600 hover:bg-emerald-50" : "text-rose-600 hover:bg-rose-50"
                                    )}
                                    onClick={() => handleToggleFreeze(wallet)}
                                  >
                                    {wallet.status === 'FROZEN' ? (
                                      <><ShieldCheck className="w-4 h-4 mr-2" /> Unfreeze Wallet</>
                                    ) : (
                                      <><ShieldAlert className="w-4 h-4 mr-2" /> Freeze Wallet</>
                                    )}
                                  </button>
                                </>
                              )}
                            </PopoverContent>
                          </Popover>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Wallet className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-sm font-medium">No wallet accounts found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs font-medium text-slate-500">
              Showing page <span className="text-slate-900">{page}</span> of <span className="text-slate-900">{totalPages}</span> 
              <span className="mx-2 text-slate-200">|</span> 
              Total <span className="text-slate-900">{total}</span> records
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="!h-9 rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-bold text-xs"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  const pageNum = i + 1; // Simplified pagination for now
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      className={cn(
                        "w-9 h-9 rounded-xl text-xs font-bold",
                        page === pageNum ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-400"
                      )}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="!h-9 rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-bold text-xs"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
