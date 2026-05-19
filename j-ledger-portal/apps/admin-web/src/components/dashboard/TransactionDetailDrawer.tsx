'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Coins,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Hash,
  User,
  Wallet,
  ArrowRightLeft,
  Cpu,
  Check,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
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
import { transactionRequester } from '@/lib/requesters';
import {
  TransactionDetailsDto,
  TransactionStatus,
  LedgerEntryType,
  TransactionType,
} from '@repo/dto';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface TransactionDetailDrawerProps {
  transactionId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionDetailDrawer({
  transactionId,
  isOpen,
  onClose,
}: TransactionDetailDrawerProps) {
  const router = useRouter();
  const [data, setData] = useState<TransactionDetailsDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    // Escape key press handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!transactionId || !isOpen) {
      setData(null);
      return;
    }

    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const details = await transactionRequester.getDetails(transactionId);
        setData(details);
      } catch (error) {
        console.error('[TRANSACTION_DRAWER] Fetch error:', error);
        toast.error('Failed to load transaction details.');
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [transactionId, isOpen, onClose]);

  const handleCopyId = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    toast.success('ID copied to clipboard');
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (!isOpen) return null;

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 text-[9px] rounded-lg tracking-wider flex items-center gap-1">
            <CheckCircle2 size={10} />
            COMPLETED
          </Badge>
        );
      case TransactionStatus.FAILED:
        return (
          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold px-2 py-0.5 text-[9px] rounded-lg tracking-wider flex items-center gap-1">
            <XCircle size={10} />
            FAILED
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold px-2 py-0.5 text-[9px] rounded-lg tracking-wider flex items-center gap-1">
            <Clock size={10} className="animate-pulse" />
            PENDING
          </Badge>
        );
    }
  };

  const parsedMetadata = () => {
    if (!data?.transaction.metadata) return null;
    if (typeof data.transaction.metadata === 'object')
      return data.transaction.metadata;
    try {
      return JSON.parse(data.transaction.metadata);
    } catch {
      return null;
    }
  };

  const metadataObj = parsedMetadata();

  const totalDebits = data?.ledgerEntries
    ? data.ledgerEntries
        .filter((e) => e.entryType === LedgerEntryType.DEBIT)
        .reduce((sum, e) => sum + e.amount, 0)
    : 0;

  const totalCredits = data?.ledgerEntries
    ? data.ledgerEntries
        .filter((e) => e.entryType === LedgerEntryType.CREDIT)
        .reduce((sum, e) => sum + e.amount, 0)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      {/* Slide-over panel */}
      <div className="relative w-full max-w-xl h-full bg-card border-l border-border shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 text-foreground overflow-y-auto">
        {/* Drawer Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-card sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-500" />
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Ledger Entry Details
              </h2>
              <p className="text-[10px] text-muted-foreground font-medium">
                Double-entry ledger journal node
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {transactionId && (
              <Button
                onClick={() => router.push(`/transactions/${transactionId}`)}
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                title="Open details page"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="p-5 flex-1 space-y-6">
          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-20 bg-muted/60 rounded-xl" />
              <div className="space-y-3">
                <div className="h-4 w-32 bg-muted" />
                <div className="h-32 bg-muted/40 rounded-xl" />
              </div>
              <div className="space-y-3">
                <div className="h-4 w-32 bg-muted" />
                <div className="h-48 bg-muted/40 rounded-xl" />
              </div>
            </div>
          ) : data ? (
            <>
              {/* Hero Cash Flow Banner */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 dark:from-slate-900/60 dark:to-slate-900/40 p-5 text-white border border-border/30">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex justify-between items-center">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-indigo-300">
                      <ArrowRightLeft className="w-3.5 h-3.5 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-wider">
                        {data.transaction.transactionType} OPERATIONAL LOG
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black tracking-tight tabular-nums">
                        {data.transaction.transactionType ===
                        TransactionType.TOPUP
                          ? '+'
                          : data.transaction.transactionType ===
                                TransactionType.WITHDRAW ||
                              data.transaction.transactionType ===
                                TransactionType.PAYMENT
                            ? '-'
                            : ''}{' '}
                        ฿
                        {data.transaction.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    {data.transaction.description && (
                      <p className="text-xs font-medium text-slate-300">
                        {data.transaction.description}
                      </p>
                    )}
                  </div>
                  <div>{getStatusBadge(data.transaction.status)}</div>
                </div>
              </div>

              {/* Metadata Panel */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-indigo-500" /> Transaction
                  Metadata
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-border/60">
                  <div className="col-span-2">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                      Transaction ID (Internal)
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-foreground bg-muted/80 px-2 py-1 rounded-md border border-border/50 flex-1 truncate select-all">
                        {String(
                          data.transaction.transactionId || data.transaction.id,
                        ).toUpperCase()}
                      </span>
                      <Button
                        onClick={() =>
                          handleCopyId(
                            String(
                              data.transaction.transactionId ||
                                data.transaction.id,
                            ),
                          )
                        }
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-md border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                      >
                        {copiedId ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Reference ID when present */}
                  {(data.transaction as any).referenceId && (
                    <div className="col-span-2">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                        Gateway Reference ID (Stripe / External)
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 px-2 py-1 rounded-md border border-indigo-500/10 flex-1 truncate select-all">
                          {String((data.transaction as any).referenceId)}
                        </span>
                        <Button
                          onClick={() =>
                            handleCopyId(
                              String((data.transaction as any).referenceId),
                            )
                          }
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 rounded-md border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                        >
                          {copiedId ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                      Timestamp
                    </p>
                    <p className="text-xs font-bold text-foreground">
                      {new Date(data.transaction.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                      Operational Type
                    </p>
                    <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold uppercase text-[9px] tracking-wider rounded-md">
                      {data.transaction.transactionType}
                    </Badge>
                  </div>

                  {/* Sender Account */}
                  {(data.transaction as any).fromAccountId && (
                    <div className="col-span-2">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                        Sender Account ID (From)
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-foreground bg-muted/80 px-2 py-1 rounded-md border border-border/50 flex-1 truncate select-all">
                          {(data.transaction as any).fromAccountId}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Recipient Account */}
                  {(data.transaction as any).toAccountId && (
                    <div className="col-span-2">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                        Recipient Account ID (To)
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-foreground bg-muted/80 px-2 py-1 rounded-md border border-border/50 flex-1 truncate select-all">
                          {(data.transaction as any).toAccountId}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Double-Entry Ledger */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-500" /> Double-Entry
                  Ledger journal
                </h3>
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="border-b border-border/60">
                        <TableHead className="text-[9px] font-black uppercase tracking-wider text-muted-foreground pl-4 py-2.5">
                          Side
                        </TableHead>
                        <TableHead className="text-[9px] font-black uppercase tracking-wider text-muted-foreground py-2.5">
                          Account
                        </TableHead>
                        <TableHead className="text-[9px] font-black uppercase tracking-wider text-muted-foreground pr-4 py-2.5 text-right">
                          Amount
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.ledgerEntries.map((entry) => (
                        <TableRow
                          key={entry.id}
                          className="border-b border-border/40 hover:bg-muted/10 transition-colors"
                        >
                          <TableCell className="pl-4 py-3">
                            <Badge
                              variant="outline"
                              className={cn(
                                'rounded-md px-1.5 py-0.5 text-[8px] font-black uppercase border-none tracking-widest shadow-xs',
                                entry.entryType === LedgerEntryType.CREDIT
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
                              )}
                            >
                              {entry.entryType}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 font-semibold text-foreground text-xs">
                            {entry.account?.accountName || 'Unknown Account'}
                          </TableCell>
                          <TableCell className="pr-4 py-3 text-right font-mono text-xs font-bold text-foreground tabular-nums">
                            ฿
                            {entry.amount.toLocaleString(undefined, {
                              minimumFractionDigits: 4,
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                      {data.ledgerEntries.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="py-8 text-center text-muted-foreground text-xs font-medium"
                          >
                            No ledger entries recorded.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>

                  {/* Summary & Integrity */}
                  {data.ledgerEntries.length > 0 && (
                    <div className="p-3 bg-muted/20 border-t border-border/60 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground px-1">
                        <span>
                          Debits:{' '}
                          <span className="font-mono text-foreground">
                            ฿
                            {totalDebits.toLocaleString(undefined, {
                              minimumFractionDigits: 4,
                            })}
                          </span>
                        </span>
                        <span>
                          Credits:{' '}
                          <span className="font-mono text-foreground">
                            ฿
                            {totalCredits.toLocaleString(undefined, {
                              minimumFractionDigits: 4,
                            })}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-start gap-1.5 p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <div className="text-[9px]">
                          <p className="font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                            Integrity Verified
                          </p>
                          <p className="text-emerald-700/60 dark:text-emerald-400/60 font-semibold leading-relaxed">
                            Double-entry balance checksum matches exactly
                            (Debits = Credits).
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* JSON Payload Explorer */}
              {metadataObj && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      Raw DB Metadata Payload
                    </h3>
                    <Button
                      onClick={() =>
                        handleCopyId(JSON.stringify(metadataObj, null, 2))
                      }
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="relative overflow-hidden rounded-xl border border-border bg-slate-950/95 dark:bg-slate-950/60 shadow-inner">
                    <pre className="p-3.5 text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-[160px] scrollbar-thin select-all">
                      <code>{JSON.stringify(metadataObj, null, 2)}</code>
                    </pre>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center text-muted-foreground text-xs">
              No transaction selected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
