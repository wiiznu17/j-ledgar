'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WalletUsersTable } from '@/components/users/WalletUsersTable';
import { userRequester } from '@/lib/requesters';
import { WalletUser } from '@repo/dto';
import { useEffect, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, RotateCcw, Filter, ChevronLeft, ChevronRight, Users, UserCheck, UserPlus, History } from 'lucide-react';
import { toast } from 'sonner';
import { FilterSearchInput, FilterSelect, FilterActions } from '@/components/common/FilterElements';

export default function UsersPage() {
  const [users, setUsers] = useState<WalletUser[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, blocked: 0 });
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchStats = useCallback(async () => {
    try {
      const response = await userRequester.getWalletUserStats();
      setStats(response.data || response || { total: 0, active: 0, pending: 0, blocked: 0 });
    } catch (error) {
      console.error('[USERS_PAGE] Stats error:', error);
    }
  }, []);

  // Draft Filters (Values in inputs)
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<string>('ALL');

  // Applied Filters (Values used for API calls)
  const [filters, setFilters] = useState({
    email: '',
    phone: '',
    status: 'ALL'
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await userRequester.getWalletUsers({
        params: {
          page,
          limit: 10,
          email: filters.email || undefined,
          phone: filters.phone || undefined,
          status: filters.status === 'ALL' ? undefined : filters.status,
        }
      });
      setUsers(response.data);
      setTotal(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('[USERS_PAGE] Fetch error:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers, fetchStats]);

  const handleFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPage(1);
    setFilters({
      email: email,
      phone: phone,
      status: status
    });
  };

  const handleClearFilters = () => {
    setEmail('');
    setPhone('');
    setStatus('ALL');
    setPage(1);
    setFilters({
      email: '',
      phone: '',
      status: 'ALL'
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  return (
    <div className="space-y-4 pb-10">
      {/* Header & Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">User Registry</h2>
        <p className="text-sm text-slate-500 mt-1">
          Monitor and manage e-wallet participants across the ecosystem.
        </p>
      </div>

      {/* Compact Overview Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-bold text-slate-700">Registry Snapshot</span>
        </div>

        <div className="flex items-center flex-wrap gap-4 md:gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-slate-500 font-medium">Total Users: <strong className="text-slate-800">{stats.total}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-500 font-medium">Active: <strong className="text-slate-800">{stats.active}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-slate-500 font-medium">Pending: <strong className="text-slate-800">{stats.pending}</strong></span>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden bg-white">
        {/* Filter Toolbar - KYC Style */}
        <div className="p-3 bg-white border-b border-slate-100">
          <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <FilterSearchInput 
              label="Email Address"
              placeholder="search by email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <FilterSearchInput 
              label="Phone Number"
              placeholder="search by phone..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <FilterSelect 
              label="Account Status"
              value={status}
              onValueChange={(val) => setStatus(val || 'ALL')}
              options={[
                { label: 'ALL STATUSES', value: 'ALL' },
                { label: 'ACTIVE', value: 'ACTIVE' },
                { label: 'PENDING APPROVAL', value: 'PENDING_APPROVAL' },
                { label: 'SUSPENDED', value: 'SUSPENDED' },
                { label: 'BLOCKED', value: 'BLOCKED' },
              ]}
            />

            <FilterActions 
              searchLabel="Search"
              isLoading={loading}
              onReset={handleClearFilters}
              className="md:col-span-2"
            />
          </form>
        </div>

        <CardContent className="p-0">
          <WalletUsersTable users={users} loading={loading} />
          
          {/* Pagination UI - KYC Style */}
          {totalPages > 0 && (
            <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500 font-medium">
                Showing page <strong className="text-slate-800">{page}</strong> of <strong className="text-slate-800">{totalPages}</strong> 
                <span className="hidden sm:inline"> ({total} total records)</span>
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1 || loading}
                  className="h-8 px-3 text-xs font-bold rounded-lg border-slate-200 text-slate-600"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages || loading}
                  className="h-8 px-3 text-xs font-bold rounded-lg border-slate-200 text-slate-600"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

