'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WalletUsersTable } from '@/components/users/WalletUsersTable';
import { userRequester } from '@/lib/requesters';
import { WalletUser, AdminPaginatedResponse } from '@repo/dto';
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
import { Search, X, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function UsersPage() {
  const [users, setUsers] = useState<WalletUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
  }, [fetchUsers]);

  const handleFilter = () => {
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

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">User Registry</h2>
          <p className="text-slate-500 mt-1">
            Manage and monitor all wallet users within the J-Ledger ecosystem.
          </p>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="border-none shadow-sm ring-1 ring-slate-100 bg-white">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Email Address
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <Input
                  id="email"
                  placeholder="search by email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-50/50 border-slate-100 focus:bg-white pl-9 transition-all h-10 text-sm"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Phone Number
              </Label>
              <Input
                id="phone"
                placeholder="search by phone..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-slate-50/50 border-slate-100 focus:bg-white transition-all h-10 text-sm"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="status" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Account Status
              </Label>
              <Select value={status} onValueChange={(val) => setStatus(val || 'ALL')}>
                <SelectTrigger id="status" className="bg-slate-50/50 border-slate-100 focus:bg-white !h-10 w-full text-sm flex items-center justify-between">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              {/* Empty label to match height of other columns */}
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-0 pointer-events-none block">
                Actions
              </Label>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  onClick={handleClearFilters}
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 h-10 px-4 flex-shrink-0 font-bold text-xs uppercase tracking-wider"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
                <Button 
                  onClick={handleFilter}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1 h-10 font-bold text-xs uppercase tracking-wider shadow-sm shadow-indigo-100"
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden bg-white">
        <CardHeader className="border-b border-slate-50 bg-slate-50/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Wallet Users</CardTitle>
              <CardDescription className="text-slate-500">
                Found {total} registered users in the system.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <WalletUsersTable users={users} loading={loading} />
          
          {/* Pagination */}
          <div className="flex items-center justify-between p-4 bg-slate-50/30 border-t border-slate-50">
            <p className="text-sm font-medium text-slate-500">
              Showing page <span className="text-slate-900">{page}</span> of <span className="text-slate-900">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="border-slate-200 text-slate-600 hover:bg-white"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="border-slate-200 text-slate-600 hover:bg-white"
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
