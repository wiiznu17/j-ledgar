'use client';

import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Calendar as CalendarIcon,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { kycRequester } from '@/lib/requesters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import {
  FilterSearchInput,
  FilterSelect,
  FilterActions,
  FilterDatePicker,
} from '@/components/common/FilterElements';
import { TablePagination } from '@/components/common/TablePagination';

interface KycDocument {
  id: string;
  userId: string;
  documentType: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  user: {
    id: string;
    email: string | null;
    phoneNumber: string | null;
    status: string;
  } | null;
}

export default function KycListPage() {
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<
    'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'ALL'
  >('PENDING_APPROVAL');
  const [stats, setStats] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Values that will be used for the actual fetch
  const [activeFilters, setActiveFilters] = useState<{
    status: 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'ALL';
    phoneNumber: string;
    startDate: string;
    endDate: string;
    page: number;
  }>({
    status: 'PENDING_APPROVAL',
    phoneNumber: '',
    startDate: '',
    endDate: '',
    page: 1,
  });

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await kycRequester.getList({
        status: activeFilters.status,
        phoneNumber: activeFilters.phoneNumber,
        startDate: activeFilters.startDate,
        endDate: activeFilters.endDate,
        page: activeFilters.page,
        limit: 10,
      });

      const safeData = Array.isArray(res?.data) ? res.data : [];
      const safePagination = res?.pagination ?? {
        page: activeFilters.page,
        total: safeData.length,
        totalPages: 1,
      };

      setDocuments(safeData);
      setStats(res?.stats ?? null);
      setTotalPages(
        typeof safePagination.totalPages === 'number' &&
          safePagination.totalPages > 0
          ? safePagination.totalPages
          : 1,
      );
      setTotalItems(
        typeof safePagination.total === 'number'
          ? safePagination.total
          : safeData.length,
      );
      setCurrentPage(
        typeof safePagination.page === 'number' && safePagination.page > 0
          ? safePagination.page
          : 1,
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [activeFilters]);

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setActiveFilters({
      status,
      phoneNumber,
      startDate,
      endDate,
      page: 1,
    });
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    setActiveFilters((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div className="space-y-4 text-foreground">
      {/* Compact Stats Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-xl shadow-xs border border-border text-card-foreground">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-bold text-foreground">
            Today's Overview
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-4 md:gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-muted-foreground font-medium">
              Pending:{' '}
              <strong className="text-foreground">{stats?.pending || 0}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground font-medium">
              Approved Today:{' '}
              <strong className="text-foreground">
                {stats?.approvedToday || 0}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-muted-foreground font-medium">
              Rejected Today:{' '}
              <strong className="text-foreground">
                {stats?.rejectedToday || 0}
              </strong>
            </span>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-xs rounded-xl overflow-hidden bg-card text-card-foreground">
        {/* Filter Toolbar */}
        <div className="p-3 bg-card border-b border-border">
          <form
            onSubmit={handleApplyFilter}
            className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
          >
            <FilterSelect
              label="Account Status (Filter)"
              value={status}
              onValueChange={(val: any) => setStatus(val)}
              options={[
                { label: 'ALL STATUS', value: 'ALL' },
                { label: 'PENDING', value: 'PENDING_APPROVAL' },
                { label: 'ACTIVE', value: 'ACTIVE' },
                { label: 'REJECTED', value: 'REJECTED' },
              ]}
            />

            <FilterSearchInput
              label="Phone Number"
              placeholder="08x-xxx-xxxx"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />

            <FilterDatePicker
              label="Date From"
              value={startDate}
              onChange={setStartDate}
            />

            <FilterDatePicker
              label="Date To"
              value={endDate}
              onChange={setEndDate}
            />

            <FilterActions
              searchLabel="Search"
              isLoading={isLoading}
              onReset={() => {
                setPhoneNumber('');
                setStartDate('');
                setEndDate('');
                setStatus('PENDING_APPROVAL');
                setActiveFilters({
                  status: 'PENDING_APPROVAL',
                  phoneNumber: '',
                  startDate: '',
                  endDate: '',
                  page: 1,
                });
                setCurrentPage(1);
              }}
            />
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground text-[10px] uppercase font-bold tracking-widest">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">User Status</th>
                <th className="px-6 py-4">KYC Status</th>
                <th className="px-6 py-4">Date Submitted</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8 h-20 bg-muted/20" />
                  </tr>
                ))
              ) : documents.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="w-12 h-12 text-muted-foreground/30" />
                      <span>No records found for this status.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {doc.user?.email ||
                              doc.user?.phoneNumber ||
                              'Unknown User'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className="bg-muted text-muted-foreground border-none font-bold text-[10px] uppercase"
                      >
                        {doc.documentType}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={`
                          font-bold text-[10px] uppercase border-none
                          ${
                            doc.user?.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : doc.user?.status === 'REJECTED'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }
                        `}
                      >
                        {doc.user?.status || 'UNKNOWN'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {doc.status === 'APPROVED' ? (
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                          <CheckCircle2 className="w-4 h-4" />
                          Approved
                        </div>
                      ) : doc.status === 'REJECTED' ? (
                        <div className="flex items-center gap-2 text-rose-500 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
                          <XCircle className="w-4 h-4" />
                          Rejected
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                          <Clock className="w-4 h-4" />
                          Pending
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {format(new Date(doc.createdAt), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/risk/kyc/${doc.userId}`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      </Card>
    </div>
  );
}
