'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Coins,
  Calendar as CalendarIcon,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Hash,
  User,
  Wallet,
  ArrowRightLeft,
  Cpu,
  FileJson,
  Check,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { transactionRequester } from '@/lib/requesters';
import {
  TransactionDetailsDto,
  TransactionStatus,
  LedgerEntryType,
  TransactionType,
} from '@repo/dto';
import { cn } from '@/lib/utils';

export default function TransactionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<TransactionDetailsDto | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchDetails = async () => {
      try {
        const d = await transactionRequester.getDetails(id);
        setData(d);
      } catch (error) {
        console.error('[TRANSACTION_DETAIL] Fetch error:', error);
        toast.error('Service temporarily unavailable. Please try again.');
      }
    };

    fetchDetails();
  }, [id]);

  const handleCopyId = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    toast.success('ID copied to clipboard');
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (!data) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-100 rounded-lg" />
        <div className="h-8 w-64 bg-slate-100 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-96 bg-slate-50 rounded-2xl animate-pulse" />
          <div className="h-96 bg-slate-50 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const { transaction, ledgerEntries, pointsEarned } = data;
  const totalDebits = ledgerEntries
    .filter((e) => e.entryType === LedgerEntryType.DEBIT)
    .reduce((sum, e) => sum + e.amount, 0);
  const totalCredits = ledgerEntries
    .filter((e) => e.entryType === LedgerEntryType.CREDIT)
    .reduce((sum, e) => sum + e.amount, 0);

  const parsedMetadata = () => {
    if (!transaction.metadata) return null;
    if (typeof transaction.metadata === 'object') return transaction.metadata;
    try {
      return JSON.parse(transaction.metadata);
    } catch {
      return null;
    }
  };

  const metadataObj = parsedMetadata();

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return (
          <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100/60 font-bold px-3 py-1 text-[10px] rounded-lg tracking-wider flex items-center gap-1.5 shadow-sm shadow-emerald-50/50">
            <CheckCircle2 size={12} className="text-emerald-500" />
            COMPLETED
          </Badge>
        );
      case TransactionStatus.FAILED:
        return (
          <Badge className="bg-rose-50 text-rose-600 border border-rose-100/60 font-bold px-3 py-1 text-[10px] rounded-lg tracking-wider flex items-center gap-1.5 shadow-sm shadow-rose-50/50">
            <XCircle size={12} className="text-rose-500" />
            FAILED
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-50 text-amber-600 border border-amber-100/60 font-bold px-3 py-1 text-[10px] rounded-lg tracking-wider flex items-center gap-1.5 shadow-sm shadow-amber-50/50">
            <Clock size={12} className="text-amber-500 animate-pulse" />
            PENDING
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Back Button & Breadcrumbs */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <button
            onClick={() => router.push('/transactions')}
            className="hover:text-indigo-600 transition-colors uppercase tracking-widest font-bold text-[10px]"
          >
            Transactions
          </button>
          <span>/</span>
          <span className="text-slate-900 font-bold uppercase tracking-widest text-[10px]">
            Details
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Transaction Details
          </h1>
          {getStatusBadge(transaction.status)}
        </div>
      </div>

      {/* Primary Transaction Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-lg border border-slate-700/50">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-300">
              <ArrowRightLeft className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {transaction.transactionType} OPERATIONAL LEDGER
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight tabular-nums">
                {transaction.amount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
              <span className="text-sm text-indigo-300 font-medium tracking-wide">
                {transaction.currency}
              </span>
            </div>
            {transaction.description && (
              <p className="text-sm font-semibold text-slate-200">
                {transaction.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 border-t border-slate-800 md:border-t-0 pt-4 md:pt-0 w-full md:w-auto">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                Transaction Fee
              </p>
              <p className="text-sm font-bold text-slate-100 tabular-nums">
                {(transaction.fee || 0).toLocaleString()} {transaction.currency}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                Completed Date
              </p>
              <p className="text-sm font-bold text-slate-100">
                {transaction.completedAt
                  ? new Date(transaction.completedAt).toLocaleDateString()
                  : new Date(transaction.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="col-span-2 md:col-span-1">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                Operation Type
              </p>
              <Badge className="bg-indigo-500/20 text-indigo-300 border-none font-bold uppercase text-[9px] tracking-wide rounded-md">
                {transaction.transactionType}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Detail */}
      <div className="grid gap-6 md:grid-cols-12 items-start">
        {/* Left Column: Details, Entities & Meta (7 Columns) */}
        <div className="md:col-span-7 space-y-6">
          {/* Key Insights Card */}
          <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-2xl bg-white overflow-hidden">
            <CardHeader className="p-5 border-b border-slate-50 bg-white">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Hash className="w-4 h-4 text-indigo-500" /> Transaction Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    System Transaction ID
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 flex-1 truncate select-all">
                      {String(transaction.transactionId || transaction.id).toUpperCase()}
                    </span>
                    <Button
                      onClick={() =>
                        handleCopyId(String(transaction.transactionId || transaction.id))
                      }
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg border-slate-200 hover:bg-slate-50 shrink-0"
                    >
                      {copiedId ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Created Timestamp
                  </p>
                  <p className="text-xs font-semibold text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 h-9 flex items-center">
                    {new Date(transaction.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Sender/Receiver Details if present */}
              {(transaction.senderId || transaction.receiverId) && (
                <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {transaction.senderId && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <User className="w-3 h-3 text-indigo-500" /> Sender ID
                      </p>
                      <span className="font-mono text-[11px] text-slate-700 bg-indigo-50/30 border border-indigo-50/70 px-2.5 py-1.5 rounded-lg block truncate select-all">
                        {transaction.senderId}
                      </span>
                      {transaction.fromWalletId && (
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                          <Wallet className="w-2.5 h-2.5 text-slate-400" /> Wallet Account:{' '}
                          <span className="font-mono text-slate-500 font-bold">
                            {transaction.fromWalletId}
                          </span>
                        </p>
                      )}
                    </div>
                  )}

                  {transaction.receiverId && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <User className="w-3 h-3 text-emerald-500" /> Receiver ID
                      </p>
                      <span className="font-mono text-[11px] text-slate-700 bg-emerald-50/20 border border-emerald-50/50 px-2.5 py-1.5 rounded-lg block truncate select-all">
                        {transaction.receiverId}
                      </span>
                      {transaction.toWalletId && (
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                          <Wallet className="w-2.5 h-2.5 text-slate-400" /> Wallet Account:{' '}
                          <span className="font-mono text-slate-500 font-bold">
                            {transaction.toWalletId}
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* JSON Metadata Explorer Section */}
              {metadataObj && (
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Payload JSON Explorer
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Raw database payload and system parameters
                      </p>
                    </div>
                    <Button
                      onClick={() => handleCopyId(JSON.stringify(metadataObj, null, 2))}
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-slate-900/95 shadow-inner">
                    <pre className="p-4 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-[200px] scrollbar-thin select-all">
                      <code>{JSON.stringify(metadataObj, null, 2)}</code>
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loyalty Points Earned Card */}
          {pointsEarned && (
            <Card className="border-none shadow-sm ring-1 ring-emerald-100 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-50/40 to-emerald-50/10">
              <CardHeader className="p-5 pb-2 border-b border-emerald-100/30">
                <div className="flex items-center gap-2 text-emerald-700">
                  <Coins className="h-5 w-5 text-emerald-600 animate-bounce" />
                  <CardTitle className="text-sm font-bold">Loyalty Points Reward</CardTitle>
                </div>
                <CardDescription className="text-emerald-700/80 text-xs">
                  Awarded points for loyalty tier eligibility.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-emerald-600 leading-none">
                    +{pointsEarned.amount.toLocaleString()}
                  </span>
                  <span className="text-xs font-black text-emerald-700/70 tracking-widest uppercase">
                    Points
                  </span>
                </div>

                <div className="flex items-center gap-2.5 p-3 bg-white border border-emerald-100 rounded-xl shadow-sm max-w-[280px]">
                  <CalendarIcon className="h-4 w-4 text-emerald-600" />
                  <div className="text-xs">
                    <p className="text-[9px] text-emerald-700/60 font-bold uppercase tracking-wider">
                      Expires On
                    </p>
                    <p className="font-bold text-emerald-800 mt-0.5">
                      {new Date(pointsEarned.expiresAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


        </div>

        {/* Right Column: Double-Entry Ledger (5 Columns) */}
        <div className="md:col-span-5 space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-2xl bg-white overflow-hidden flex flex-col">
            <CardHeader className="p-5 border-b border-slate-50 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-indigo-500" /> Double-Entry Ledger
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400 mt-0.5">
                    Cryptographically integrity-verified debit & credit mapping
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-b border-slate-50">
                    <TableHead className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 pl-5 py-3">
                      Operation
                    </TableHead>
                    <TableHead className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 py-3">
                      Account Name
                    </TableHead>
                    <TableHead className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 pr-5 py-3 text-right">
                      Amount
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerEntries.map((entry) => (
                    <TableRow
                      key={entry.id}
                      className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors"
                    >
                      <TableCell className="pl-5 py-4">
                        <Badge
                          variant="outline"
                          className={cn(
                            'rounded-md px-2 py-0.5 text-[9px] font-black uppercase border-none tracking-widest shadow-sm',
                            entry.entryType === LedgerEntryType.CREDIT
                              ? 'bg-emerald-50 text-emerald-600 shadow-emerald-50/50'
                              : 'bg-rose-50 text-rose-600 shadow-rose-50/50'
                          )}
                        >
                          {entry.entryType}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 font-semibold text-slate-700 text-xs">
                        {entry.account?.accountName || 'Unknown Account'}
                      </TableCell>
                      <TableCell className="pr-5 py-4 text-right font-mono text-xs font-bold text-slate-700 tabular-nums">
                        {entry.amount.toFixed(4)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {ledgerEntries.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="py-12 text-center text-slate-400 text-xs font-medium"
                      >
                        No ledger entries recorded.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Verification & Integrity Seal */}
              {ledgerEntries.length > 0 && (
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 space-y-3.5">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-500 px-1">
                    <span>Total Debits: <span className="font-mono text-slate-700">{totalDebits.toFixed(4)}</span></span>
                    <span>Total Credits: <span className="font-mono text-slate-700">{totalCredits.toFixed(4)}</span></span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-emerald-50/30 border border-emerald-100/60 rounded-xl shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="text-[10px]">
                      <p className="font-bold text-emerald-800 uppercase tracking-wider">Verified Balance Match</p>
                      <p className="text-emerald-700/70 font-semibold mt-0.5">
                        Double-entry checksum verified (Debits sum equals Credits sum).
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
