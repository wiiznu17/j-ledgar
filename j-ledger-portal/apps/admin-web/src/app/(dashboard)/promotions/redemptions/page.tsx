'use client';

import React, { useState, useEffect } from 'react';
import { RedemptionsTable } from '@/components/promotions/RedemptionsTable';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { promotionsRequester } from '@/lib/requesters';
import { Loader2 } from 'lucide-react';
import {
  FilterSearchInput,
  FilterSelect,
  FilterActions,
} from '@/components/common/FilterElements';
import { TablePagination } from '@/components/common/TablePagination';

export default function RedemptionsPage() {
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', status: 'ALL' });

  const fetchRedemptions = async (pageOverride?: number, filterOverride?: any) => {
    setLoading(true);
    try {
      const currentPage = pageOverride || page;
      const currentFilters = filterOverride || appliedFilters;
      
      const response = await promotionsRequester.getRedemptions({
        params: {
          page: currentPage,
          limit: 10,
          search: currentFilters.search || undefined,
          status: currentFilters.status === 'ALL' ? undefined : currentFilters.status,
        },
      });
      setRedemptions(response.data || []);
      
      if (response.pagination) {
        setTotalPages(response.pagination.totalPages || 1);
        setTotalItems(response.pagination.total || 0);
        setPage(response.pagination.page || 1);
      }
    } catch (error) {
      console.error('[REDEMPTIONS_PAGE] Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchRedemptions(newPage);
  };

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const newFilters = { search, status };
    setAppliedFilters(newFilters);
    setPage(1);
    fetchRedemptions(1, newFilters);
  };

  const handleClearFilter = () => {
    setSearch('');
    setStatus('ALL');
    const cleared = { search: '', status: 'ALL' };
    setAppliedFilters(cleared);
    setPage(1);
    fetchRedemptions(1, cleared);
  };

  useEffect(() => {
    fetchRedemptions();
  }, []);

  return (
    <div className="space-y-6 text-foreground">
      <Card className="border border-border bg-card text-card-foreground shadow-xs overflow-hidden">
        {/* Filter Toolbar */}
        <div className="p-4 bg-muted/30 border-b border-border">
          <form onSubmit={handleApplyFilter} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <FilterSearchInput
              label="User or Deal Search"
              placeholder="Email, Phone, or Deal..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="md:col-span-2 text-foreground"
            />
            
            <FilterSelect
              label="Claim Status"
              value={status}
              onValueChange={(val: string) => setStatus(val)}
              options={[
                { label: 'ALL STATUSES', value: 'ALL' },
                { label: 'REDEEMED', value: 'REDEEMED' },
                { label: 'USED', value: 'USED' },
                { label: 'EXPIRED', value: 'EXPIRED' },
              ]}
            />

            <FilterActions
              searchLabel="Filter"
              isLoading={loading}
              onReset={handleClearFilter}
            />
          </form>
        </div>

        <CardContent className="p-0">
          {loading && redemptions.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
            </div>
          ) : (
            <>
              <RedemptionsTable redemptions={redemptions} />
              <div className="p-4 border-t border-border bg-card">
                <TablePagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  onPageChange={handlePageChange}
                  isLoading={loading}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
