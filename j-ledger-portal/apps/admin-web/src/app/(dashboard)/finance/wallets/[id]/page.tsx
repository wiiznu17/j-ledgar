'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Wallet,
  User as UserIcon,
  History,
  ShieldAlert,
  ShieldCheck,
  CreditCard,
  Calendar,
  TrendingUp,
  RefreshCcw,
  ExternalLink,
  ChevronRight,
  Fingerprint,
  Info,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import {
  walletRequester,
  userRequester,
  transactionRequester,
} from '@/lib/requesters';
import {
  WalletDto,
  WalletUser,
  Transaction,
  TransactionStatus,
} from '@repo/dto';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function WalletDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [user, setUser] = useState<WalletUser | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWalletData = async (isSync = false) => {
    if (!isSync) setLoading(true);
    try {
      const walletResponse = await walletRequester.getWalletById(id);
      const walletData = walletResponse.data;
      setWallet(walletData);

      if (walletData?.userId) {
        try {
          const userResponse = await userRequester.getUserDetail(
            walletData.userId,
          );
          setUser(userResponse.data);
        } catch (e) {
          console.error('Failed to fetch user info', e);
        }
      }

      const txResponse = await transactionRequester.getHistory({
        size: 10,
        userId: walletData.userId,
      });

      // AdminPaginatedResponse has a 'data' field containing the items array
      setTransactions(txResponse.data || []);

      if (isSync) toast.success('Data synced successfully');
    } catch (error) {
      toast.error('Failed to load wallet details');
    } finally {
      if (!isSync) setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [id]);

  const handleToggleFreeze = async () => {
    if (!wallet) return;
    const isFrozen = wallet.status === 'FROZEN';
    try {
      if (isFrozen) {
        await walletRequester.unfreezeWallet(wallet.userId);
        toast.success('Wallet unfrozen successfully');
      } else {
        await walletRequester.freezeWallet(wallet.userId);
        toast.error('Wallet frozen successfully');
      }
      const updatedResponse = await walletRequester.getWalletById(id);
      setWallet(updatedResponse.data);
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse text-foreground">
        <div className="h-8 w-64 bg-muted rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="h-64 bg-muted/30 rounded-3xl" />
            <div className="h-96 bg-muted/30 rounded-3xl" />
          </div>
          <div className="space-y-8">
            <div className="h-48 bg-muted/30 rounded-3xl" />
            <div className="h-64 bg-muted/30 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!wallet)
    return (
      <div className="p-20 text-center text-muted-foreground bg-card rounded-2xl">
        Wallet not found
      </div>
    );

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10 text-foreground">
      {/* Header with Breadcrumbs */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest gap-2">
          <button
            onClick={() => router.push('/finance/wallets')}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase tracking-widest font-bold text-[10px]"
          >
            Customer Wallets
          </button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">Wallet Details</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4" />
          <div className="flex items-center gap-2">
            <Button
              onClick={() => fetchWalletData(true)}
              variant="outline"
              className="rounded-lg border-border font-semibold text-xs h-9 px-4 text-muted-foreground hover:text-foreground hover:bg-muted bg-card"
            >
              <RefreshCcw className="w-3.5 h-3.5 mr-2" /> Sync Data
            </Button>
            <Button
              onClick={handleToggleFreeze}
              variant={wallet.status === 'FROZEN' ? 'default' : 'destructive'}
              className={cn(
                'rounded-lg font-semibold text-xs h-9 px-4 shadow-xs',
                wallet.status === 'FROZEN'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600'
                  : '',
              )}
            >
              {wallet.status === 'FROZEN' ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 mr-2" /> Activate Wallet
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 mr-2" /> Freeze Wallet
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Main Info & History */}
        <div className="lg:col-span-2 space-y-6">
          {/* PREMIUM BALANCE CARD */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 p-6 text-white shadow-md border border-slate-850">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-300">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    Master Wallet Account
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold tracking-tight tabular-nums">
                    {wallet.balance.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <span className="text-sm text-indigo-300 font-medium">
                    {wallet.currency}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge
                  className={cn(
                    'px-3 py-1 rounded-lg font-bold text-[10px] tracking-widest uppercase border-none',
                    wallet.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400',
                  )}
                >
                  {wallet.status}
                </Badge>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                    Wallet Number
                  </p>
                  <p className="text-sm font-mono text-slate-200 tracking-wider">
                    {wallet.walletId}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Type
                </p>
                <p className="text-xs font-medium text-slate-200">
                  Standard Savings
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Daily Limit
                </p>
                <p className="text-xs font-medium text-slate-200">
                  {wallet.dailyLimit.toLocaleString()} THB
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Monthly Limit
                </p>
                <p className="text-xs font-medium text-slate-200">
                  {wallet.monthlyLimit.toLocaleString()} THB
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Security
                </p>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <p className="text-xs font-medium text-emerald-400">
                    Encrypted
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* TRANSACTION HISTORY */}
          <Card className="border-none shadow-xs rounded-2xl overflow-hidden bg-card text-card-foreground">
            <CardHeader className="p-5 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600" /> Transaction
                  Logs
                </CardTitle>
              </div>
              <Link href={`/transactions?userId=${wallet.userId}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10"
                >
                  View All <ExternalLink className="w-3 h-3 ml-1.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="px-5 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">
                        Amount
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {transactions.map((tx) => {
                      const description = (tx.description || '').toLowerCase();
                      const isTopup =
                        tx.transactionType === 'TOPUP' ||
                        description.includes('top-up') ||
                        description.includes('topup') ||
                        description.includes('credit');
                      const isWithdraw =
                        tx.transactionType === 'WITHDRAW' ||
                        description.includes('withdraw');

                      // Check both UUID and numeric ID
                      const isReceiver =
                        tx.receiverId === wallet.userId ||
                        tx.toWalletId === wallet.id;

                      // If it's a top-up keyword or we are the receiver, it's an IN
                      const isIn = isTopup || (isReceiver && !isWithdraw);

                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-muted/50 transition-colors group"
                        >
                          <td className="px-5 py-3">
                            {isIn ? (
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                  <ArrowDownLeft className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-[10px] font-bold uppercase text-emerald-600">
                                  In
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-rose-5050 bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-[10px] font-bold uppercase text-rose-600">
                                  Out
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <div className="space-y-0.5">
                              <p className="text-xs font-semibold text-foreground">
                                {tx.description ||
                                  (isTopup
                                    ? 'Wallet Top-up'
                                    : isWithdraw
                                      ? 'Wallet Withdrawal'
                                      : 'Transfer')}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                <span>
                                  {new Date(tx.createdAt).toLocaleDateString()}
                                </span>
                                <span>•</span>
                                <span className="font-mono">
                                  Ref:{' '}
                                  {String(tx.transactionId || tx.id)
                                    .slice(-8)
                                    .toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <p
                              className={cn(
                                'text-sm font-bold tabular-nums',
                                isIn
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-foreground',
                              )}
                            >
                              {isIn ? '+' : '-'}
                              {tx.amount.toLocaleString()}
                            </p>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <Badge
                              variant="outline"
                              className={cn(
                                'rounded-md px-2 py-0.5 text-[9px] font-bold uppercase border-none',
                                tx.status === TransactionStatus.COMPLETED
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
                              )}
                            >
                              {tx.status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                    {transactions.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-8 text-center text-muted-foreground text-xs"
                        >
                          No recent transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: User & Actions */}
        <div className="space-y-6">
          {/* USER CARD */}
          <Card className="border-none shadow-xs rounded-2xl bg-card text-card-foreground">
            <CardHeader className="p-5 border-b border-border">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-indigo-500" /> Account Owner
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {user ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        {user.phoneNumber.slice(-2)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {user.phoneNumber}
                      </p>
                      <Badge
                        variant="outline"
                        className="rounded-md px-1.5 py-0 text-[9px] font-semibold border-indigo-500/20 text-indigo-600 dark:text-indigo-400 uppercase mt-1"
                      >
                        Verified User
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-muted-foreground">
                        Status
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {user.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-muted-foreground">
                        Joined
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/support/users/${user.id}`}
                    className="block pt-2"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 rounded-lg text-xs font-semibold border-border text-muted-foreground hover:bg-muted hover:text-indigo-600 dark:hover:text-indigo-400 bg-card"
                    >
                      View User Profile{' '}
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8 space-y-2">
                  <Info className="w-6 h-6 text-muted-foreground/30 mx-auto" />
                  <p className="text-xs font-medium text-muted-foreground">
                    Profile data unavailable
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ADMIN ACTIONS */}
          <Card className="border-none shadow-xs rounded-2xl bg-card text-card-foreground relative overflow-hidden">
            <CardHeader className="p-5 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground/50" /> Fund
                Management
              </CardTitle>
              <Badge className="bg-muted text-muted-foreground border-none font-black text-[9px] uppercase">
                Soon
              </Badge>
            </CardHeader>
            <CardContent className="p-5">
              <Button
                disabled
                variant="outline"
                className="w-full rounded-lg font-semibold text-xs border-border text-muted-foreground/50 bg-muted/50 cursor-not-allowed"
              >
                Manual Adjustment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
