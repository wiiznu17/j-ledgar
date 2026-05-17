'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Landmark,
  Wallet,
  ShieldCheck,
  ArrowUpRight,
  RefreshCcw,
  History,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronRight,
  Info
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TreasurySummary, TreasuryPayout, TreasuryBankAccount } from '@repo/dto';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { treasuryRequester } from '@/lib/requesters';

export default function TreasuryPage() {
  const [summary, setSummary] = useState<TreasurySummary | null>(null);
  const [payouts, setPayouts] = useState<TreasuryPayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [summaryRes, payoutsRes] = await Promise.all([
        treasuryRequester.getSummary(),
        treasuryRequester.getPayoutHistory()
      ]);
      setSummary(summaryRes);
      setPayouts(payoutsRes);
    } catch (err) {
      console.error('[TREASURY_PAGE] Fetch error:', err);
      toast.error('Failed to fetch treasury data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getReserveStatus = (ratio: number) => {
    if (ratio >= 100) return { label: 'Healthy', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: ShieldCheck };
    if (ratio >= 90) return { label: 'Warning', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle };
    return { label: 'Critical', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: AlertTriangle };
  };

  const status = summary ? getReserveStatus(summary.reserveRatio) : null;

  return (
    <div className="space-y-8 pb-10 text-foreground">
      <div className="flex flex-col gap-3">
        {/* Breadcrumbs */}
        <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest gap-2">
          <span className="opacity-60">Finance</span>
          <ChevronRight className="w-3 h-3 opacity-60" />
          <span className="text-foreground">Treasury Dashboard</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-foreground">Treasury Management</h2>
            <p className="text-muted-foreground mt-1">Monitor company liquidity and manage financial reserves.</p>
          </div>
          <Button 
            onClick={fetchData} 
            variant="outline" 
            size="sm" 
            className="h-9 rounded-xl border-border bg-card shadow-xs hover:bg-muted text-card-foreground font-bold text-xs"
            disabled={isLoading}
          >
            <RefreshCcw className={`w-3.5 h-3.5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-xs bg-card text-card-foreground relative group/card overflow-visible">
          <CardContent className="p-6">
            {/* Top Right Info Icon */}
            <div className="absolute top-4 right-4 group/info">
              <Info className="w-4 h-4 text-muted-foreground/40 hover:text-indigo-500 transition-colors cursor-help" />
              <div className="absolute bottom-full right-0 mb-2 w-56 p-3 bg-popover text-popover-foreground border border-border text-[10px] font-medium leading-relaxed rounded-xl shadow-2xl opacity-0 group-hover/info:opacity-100 transition-all transform translate-y-1 group-hover/info:translate-y-0 pointer-events-none z-50">
                <p className="font-bold border-b border-border pb-1.5 mb-1.5 flex items-center gap-1.5">
                  <Info className="w-3 h-3" />
                  Stripe Balance
                </p>
                เงินที่ลูกค้าฝากเข้ามาผ่าน Stripe แต่ยังไม่ได้ทำการ Payout เข้าบัญชีธนาคารบริษัท (ยอดเงินคงค้างในระบบ Stripe)
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <RefreshCcw className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Stripe Balance (Real-time)</p>
              <div className="group relative">
                <Info className="w-3 h-3 text-muted-foreground/40 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-popover text-popover-foreground border border-border text-[10px] font-medium leading-relaxed rounded-xl shadow-2xl opacity-0 group-hover/info:opacity-100 transition-all transform translate-y-1 group-hover/info:translate-y-0 pointer-events-none z-50">
                  <p className="font-bold border-b border-border pb-1.5 mb-1.5">Balance Breakdown</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ledger (Gross):</span>
                      <span className="font-bold">฿{summary?.stripeBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Actual (Net):</span>
                      <span className="font-bold text-emerald-400">฿{((summary?.stripeAvailableBalance || 0) + (summary?.stripePendingBalance || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-1.5 mt-1">
                      <span className="text-rose-400 font-bold">Total Fees:</span>
                      <span className="text-rose-400 font-bold">฿{Math.max(0, (summary?.stripeBalance || 0) - ((summary?.stripeAvailableBalance || 0) + (summary?.stripePendingBalance || 0))).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="text-2xl font-black text-foreground tabular-nums">
              ฿{((summary?.stripeAvailableBalance || 0) + (summary?.stripePendingBalance || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <div className="mt-2 flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground font-medium">Available: ฿{(summary?.stripeAvailableBalance || 0).toLocaleString()}</span>
              <span className="text-amber-500 font-bold">Incoming: ฿{(summary?.stripePendingBalance || 0).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xs bg-card text-card-foreground relative group/card overflow-visible">
          <CardContent className="p-6">
            <div className="absolute top-4 right-4 group/info">
              <Info className="w-4 h-4 text-muted-foreground/40 hover:text-emerald-500 transition-colors cursor-help" />
              <div className="absolute bottom-full right-0 mb-2 w-56 p-3 bg-popover text-popover-foreground border border-border text-[10px] font-medium leading-relaxed rounded-xl shadow-2xl opacity-0 group-hover/info:opacity-100 transition-all transform translate-y-1 group-hover/info:translate-y-0 pointer-events-none z-50">
                <p className="font-bold border-b border-border pb-1.5 mb-1.5 flex items-center gap-1.5">
                  <Info className="w-3 h-3" />
                  Total Bank Balance
                </p>
                ยอดเงินสดรวมที่มีอยู่ในบัญชีธนาคารบริษัททั้งหมด (SCB, KBank) ซึ่งพร้อมสำหรับการเบิกจ่ายหรือลูกค้าถอนเงิน
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Landmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Bank Balance</p>
            </div>
            <h3 className="text-2xl font-black text-foreground tabular-nums">
              ฿{summary?.totalBankBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-emerald-500 mt-2 font-bold flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              เงินสดสำรองพร้อมใช้
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xs bg-card text-card-foreground relative group/card overflow-visible">
          <CardContent className="p-6">
            <div className="absolute top-4 right-4 group/info">
              <Info className="w-4 h-4 text-muted-foreground/40 hover:text-rose-500 transition-colors cursor-help" />
              <div className="absolute bottom-full right-0 mb-2 w-56 p-3 bg-popover text-popover-foreground border border-border text-[10px] font-medium leading-relaxed rounded-xl shadow-2xl opacity-0 group-hover/info:opacity-100 transition-all transform translate-y-1 group-hover/info:translate-y-0 pointer-events-none z-50">
                <p className="font-bold border-b border-border pb-1.5 mb-1.5 flex items-center gap-1.5">
                  <Info className="w-3 h-3" />
                  Customer Liability
                </p>
                ภาระหนี้สินรวม คือยอดเงินที่ลูกค้าฝากไว้ในระบบทั้งหมด บริษัทมีหน้าที่ต้องเตรียมเงินให้เพียงพอต่อการถอน
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Customer Liability</p>
            </div>
            <h3 className="text-2xl font-black text-foreground tabular-nums">
              ฿{summary?.totalCustomerLiability.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-rose-400 mt-2 font-medium italic">ยอดเงินลูกค้ารวมในระบบ</p>
          </CardContent>
        </Card>

        <Card className={`border-none shadow-xs bg-card text-card-foreground relative group/card overflow-visible`}>
          <div className={`h-1 ${status?.bg || 'bg-muted'}`} />
          <CardContent className="p-6">
            <div className="absolute top-4 right-4 group/info">
              <Info className="w-4 h-4 text-muted-foreground/40 hover:text-foreground transition-colors cursor-help" />
              <div className="absolute bottom-full right-0 mb-2 w-56 p-3 bg-popover text-popover-foreground border border-border text-[10px] font-medium leading-relaxed rounded-xl shadow-2xl opacity-0 group-hover/info:opacity-100 transition-all transform translate-y-1 group-hover/info:translate-y-0 pointer-events-none z-50">
                <p className="font-bold border-b border-border pb-1.5 mb-1.5 flex items-center gap-1.5">
                  <Info className="w-3 h-3" />
                  Reserve Ratio
                </p>
                ดัชนีความมั่นคงทางการเงิน คำนวณจาก (เงินสด + เงินที่ Stripe) / หนี้สินลูกค้า ค่าที่ปลอดภัยคือ 100% ขึ้นไป
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${status?.bg || 'bg-muted'} flex items-center justify-center`}>
                {status && <status.icon className={`w-5 h-5 ${status.color}`} />}
              </div>
              {status && (
                <div className={`px-2 py-0.5 rounded-md border ${status.bg} ${status.border} ${status.color} text-[10px] font-black uppercase tracking-wider`}>
                  {status.label}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Reserve Ratio</p>
            </div>
            <h3 className={`text-2xl font-black ${status?.color || 'text-foreground'} tabular-nums`}>
              {summary?.reserveRatio}%
            </h3>
            <p className="text-[10px] text-muted-foreground mt-2 font-medium italic">ความมั่นคงของระบบ</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bank Accounts Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Landmark className="w-5 h-5 text-indigo-600" />
              Company Bank Accounts
            </h3>
          </div>
          <Card className="border-none shadow-xs bg-card text-card-foreground overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    <th className="px-6 py-4">Account Name / Number</th>
                    <th className="px-6 py-4">Bank / Provider</th>
                    <th className="px-6 py-4 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {summary?.bankAccounts.map((acc: TreasuryBankAccount, i: number) => (
                    <tr key={i} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-foreground">{acc.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono tracking-tighter">{acc.accountNumber}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] font-black uppercase border-indigo-500/20 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10">{acc.provider}</Badge>
                          <span className="text-xs font-medium text-muted-foreground">{acc.bankName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-black text-foreground tabular-nums">
                          ฿{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Payout History / Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              Recent Payouts
            </h3>
          </div>
          <Card className="border-none shadow-xs bg-card text-card-foreground overflow-hidden">
            <div className="p-0">
              {payouts.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <History className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No Payout Records</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {payouts.map((payout) => (
                    <div key={payout.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${payout.status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                            {payout.stripePayoutId ? payout.stripePayoutId.slice(0, 10) : 'Manual'}
                          </span>
                        </div>
                        <span className="text-xs font-black text-foreground tabular-nums">
                          ฿{Number(payout.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-muted-foreground font-medium">
                          {payout.arrivalDate ? format(new Date(payout.arrivalDate), 'MMM d, yyyy') : 'Processing...'}
                        </p>
                        <Badge className="text-[9px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10">
                          {payout.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 bg-muted/30 border-t border-border">
              <Button variant="ghost" size="sm" className="w-full text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 gap-2">
                View All Activity
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
