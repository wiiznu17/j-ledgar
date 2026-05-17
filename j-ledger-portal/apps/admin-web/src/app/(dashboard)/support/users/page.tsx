'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {
  Search,
  RotateCcw,
  Filter,
  ChevronLeft,
  ChevronRight,
  Users,
  UserCheck,
  UserPlus,
  History,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  FilterSearchInput,
  FilterSelect,
  FilterActions,
} from '@/components/common/FilterElements';
import { TablePagination } from '@/components/common/TablePagination';

export default function UsersPage() {
  const [users, setUsers] = useState<WalletUser[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    blocked: 0,
  });
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchStats = useCallback(async () => {
    try {
      const response = await userRequester.getWalletUserStats();
      setStats(
        response.data ||
          response || { total: 0, active: 0, pending: 0, blocked: 0 },
      );
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
    status: 'ALL',
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
        },
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
      status: status,
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
      status: 'ALL',
    });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="space-y-4 pb-10 text-foreground">
      {/* Compact Overview Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-xl shadow-xs border border-border text-card-foreground">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-bold text-foreground">
            Registry Snapshot
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-4 md:gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-muted-foreground font-medium">
              Total Users:{' '}
              <strong className="text-foreground">{stats.total}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground font-medium">
              Active: <strong className="text-foreground">{stats.active}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-muted-foreground font-medium">
              Pending:{' '}
              <strong className="text-foreground">{stats.pending}</strong>
            </span>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-xs rounded-xl overflow-hidden bg-card text-card-foreground">
        {/* Filter Toolbar - KYC Style */}
        <div className="p-3 bg-card border-b border-border">
          <form
            onSubmit={handleFilter}
            className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
          >
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
              onValueChange={(val: string) => setStatus(val || 'ALL')}
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

          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            onPageChange={handlePageChange}
            isLoading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
