'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Store, 
  History, 
  Search, 
  RotateCcw, 
  Plus, 
  ClipboardCheck, 
  ClipboardList
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

import { merchantRequester } from '@/lib/requesters';
import { MerchantTable } from '@/components/merchants/MerchantTable';
import { TablePagination } from '@/components/common/TablePagination';
import {
  FilterSearchInput,
  FilterSelect,
  FilterActions,
} from '@/components/common/FilterElements';

export default function MerchantsPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Draft Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<string>('ALL');

  // Applied Filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
  });

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const response = await merchantRequester.getPartners({
        page,
        limit: 10,
        search: filters.search || undefined,
        status: filters.status !== 'ALL' ? filters.status : undefined,
      });
      
      setPartners(response.data || []);
      setTotal(response.pagination?.total || 0);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error('[MERCHANTS_PAGE] Fetch error:', error);
      toast.error('Failed to fetch merchant partners');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPage(1);
    setFilters({
      search: searchTerm,
      status: status,
    });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatus('ALL');
    setPage(1);
    setFilters({
      search: '',
      status: 'ALL',
    });
  };

  return (
    <div className="space-y-4 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Merchant Partners
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage your network of merchants, terminals, and business partners.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/merchants/applications">
            <Button variant="outline" size="sm" className="h-9 gap-1.5">
              <ClipboardList className="w-4 h-4" />
              Approval Queue
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-bold text-slate-700">
            Merchant Ecosystem
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-4 md:gap-6 text-sm">
          <div className="flex items-center gap-2 text-slate-500">
            Total Partners: <strong className="text-slate-800">{total}</strong>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden bg-white">
        <div className="p-3 bg-white border-b border-slate-100">
          <form
            onSubmit={handleFilter}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
          >
            <FilterSearchInput
              label="Search Partner"
              placeholder="name, tax id..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:col-span-2"
            />

            <FilterSelect
              label="Status"
              value={status}
              onValueChange={(val: string) => setStatus(val || 'ALL')}
              options={[
                { label: 'ALL STATUSES', value: 'ALL' },
                { label: 'PENDING REVIEW', value: 'PENDING_REVIEW' },
                { label: 'ACTIVE', value: 'ACTIVE' },
                { label: 'INACTIVE', value: 'INACTIVE' },
                { label: 'SUSPENDED', value: 'SUSPENDED' },
              ]}
            />

            <FilterActions
              searchLabel="Filter"
              isLoading={loading}
              onReset={handleClearFilters}
            />
          </form>
        </div>

        <CardContent className="p-0">
          <MerchantTable partners={partners} loading={loading} />

          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            onPageChange={(p) => setPage(p)}
            isLoading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
