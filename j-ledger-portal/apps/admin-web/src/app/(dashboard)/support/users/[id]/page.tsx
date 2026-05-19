'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Wallet,
  Activity,
  Shield,
  Clock,
  Smartphone,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
  ArrowRight,
  ExternalLink,
  Search,
  Coins,
  Copy,
  Check,
  Fingerprint,
  FileCheck,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { userRequester } from '@/lib/requesters';
import { WalletUser } from '@repo/dto';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { getUserStatusConfig, getKycStatusConfig } from '@/lib/status-utils';

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: userId } = use(params);
  const router = useRouter();

  const [user, setUser] = useState<WalletUser | null>(null);
  const [account, setAccount] = useState<any>(null);
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userData, walletData, activityData] = await Promise.all([
        userRequester.getUserDetail(userId),
        userRequester.getUserWallet(userId).catch(() => ({ data: null })),
        userRequester.getUserActivity(userId).catch(() => ({ data: null })),
      ]);

      setUser((userData as any).data);
      setAccount((walletData as any)?.data);
      setActivity((activityData as any)?.data);
    } catch (error) {
      console.error('Error fetching user details', error);
      toast.error('Failed to load user information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse text-foreground">
        <div className="h-4 w-48 bg-muted rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 bg-muted/30 rounded-3xl" />
            <div className="h-56 bg-muted/30 rounded-3xl" />
          </div>
          <div className="space-y-6">
            <div className="h-48 bg-muted/30 rounded-3xl" />
            <div className="h-64 bg-muted/30 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-10 bg-card text-card-foreground rounded-3xl border border-dashed border-border">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">User Not Found</h2>
        <p className="text-muted-foreground mt-2 max-w-xs">
          The user you are looking for might have been deleted or the ID is incorrect.
        </p>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mt-8 rounded-xl px-8 border-border"
        >
          Go Back to List
        </Button>
      </div>
    );
  }

  const statusConfig = getUserStatusConfig(user.status);
  const StatusIcon = statusConfig.icon;
  const kycStatus = (user as any).kycStatus || 'NOT_SUBMITTED';
  const kycConfig = getKycStatusConfig(kycStatus);
  const KycIcon = kycConfig.icon;

  const accountAge = Math.floor(
    (new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24),
  );

  return (
    <div className="space-y-5 pb-10 max-w-6xl mx-auto text-foreground">
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest gap-2">
          <Link href="/support/users" className="hover:text-indigo-600 transition-colors">
            Users
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">{user.email || user.phoneNumber || userId.slice(0, 8)}</span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3 items-start">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Identity Card */}
          <Card className="border-none shadow-xs bg-card text-card-foreground rounded-[2rem] overflow-hidden">
            <CardContent className="p-7">
              <div className="flex items-start gap-5">
                {/* Avatar */}
                <div className="shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
                  <User className="w-8 h-8 text-white" />
                </div>

                {/* Name + badges */}
                <div className="flex-1 min-w-0">
                  <h2
                    className={cn(
                      'text-xl font-black text-foreground truncate',
                      !user.email && 'text-muted-foreground italic',
                    )}
                  >
                    {user.email || 'No Email'}
                  </h2>

                  {/* User ID row */}
                  <div className="flex items-center gap-1.5 mt-1 mb-3">
                    <Fingerprint className="w-3 h-3 text-muted-foreground/50" />
                    <span className="font-mono text-[10px] text-muted-foreground tracking-tight">
                      {userId}
                    </span>
                    <button
                      onClick={() => handleCopy(userId)}
                      className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground/50 hover:text-muted-foreground"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Status badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn('text-[10px] font-black uppercase tracking-wider flex items-center gap-1 px-2.5 py-0.5', statusConfig.color)}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {user.status}
                    </Badge>

                    <Badge
                      variant="outline"
                      className={cn('text-[10px] font-black uppercase tracking-wider flex items-center gap-1 px-2.5 py-0.5', kycConfig.color)}
                    >
                      <KycIcon className="w-3 h-3" />
                      KYC: {kycStatus.replace('_', ' ')}
                    </Badge>

                    {(user as any).loyaltyPoints !== undefined && (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border-amber-200"
                      >
                        <Coins className="w-3 h-3" />
                        {(user as any).loyaltyPoints?.toLocaleString() || 0} pts
                      </Badge>
                    )}

                    <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Joined {new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* KYC link */}
                <Link href={`/risk/kyc/${user.id}`} className="shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-xl border-border text-[10px] font-black uppercase tracking-wider gap-1.5 text-muted-foreground hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                  >
                    <ExternalLink className="w-3 h-3" />
                    KYC Record
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Contact + Wallet */}
          <div className="grid md:grid-cols-2 gap-5">
            {/* Contact Info */}
            <Card className="border-none shadow-xs bg-card text-card-foreground rounded-[2rem]">
              <CardHeader className="p-6 pb-3">
                <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                  <Phone className="w-3 h-3" /> Contact Info
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phone Number</p>
                  <p className="text-lg font-black text-foreground tracking-tight font-mono">
                    {user.phoneNumber || '—'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</p>
                  <p className={cn('text-sm font-bold', user.email ? 'text-foreground' : 'text-muted-foreground italic')}>
                    {user.email || 'Not set'}
                  </p>
                </div>
                <div className="pt-1">
                  <Badge
                    variant="secondary"
                    className="bg-muted text-muted-foreground font-bold text-[10px] rounded-lg px-2.5 py-1"
                  >
                    STATE: {user.registrationState || '—'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Wallet */}
            <Card className="border-none shadow-xs bg-card text-card-foreground rounded-[2rem]">
              <CardHeader className="p-6 pb-3">
                <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                  <Wallet className="w-3 h-3" /> Wallet
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {account ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Balance</span>
                      <Badge
                        variant="outline"
                        className="text-[9px] font-black border-border text-muted-foreground"
                      >
                        {account.status}
                      </Badge>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-foreground tabular-nums">
                        {account.balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-xs font-black text-muted-foreground uppercase">
                        {account.currency}
                      </span>
                    </div>
                    {account.walletId && (
                      <p className="text-[10px] font-mono text-muted-foreground">{account.walletId}</p>
                    )}
                    <Link
                      href={`/finance/wallets/${account.id}`}
                      className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase hover:gap-2.5 transition-all mt-2"
                    >
                      View Wallet Details <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                    <AlertCircle className="w-6 h-6 text-amber-500" />
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 font-black uppercase tracking-tight">
                      No linked wallet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5">
          {/* Account Summary */}
          <Card className="border-none shadow-xs bg-card text-card-foreground rounded-[2rem]">
            <CardHeader className="p-6 pb-3">
              <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                Account Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tight">Account Age</p>
                  <p className="text-sm font-bold text-foreground">
                    {accountAge === 0 ? 'Today' : `${accountAge} days`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tight">Trusted Devices</p>
                  <p className="text-sm font-bold text-foreground">
                    {activity?.devices?.length || 0} device{(activity?.devices?.length || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tight">Last Active</p>
                  <p className="text-sm font-bold text-foreground">
                    {activity?.lastLoginAt
                      ? new Date(activity.lastLoginAt).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })
                      : 'No activity'}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <Link href={`/support/user-activity?userId=${user.id}`}>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-10 rounded-xl text-muted-foreground border-border hover:bg-muted group font-bold text-[10px] uppercase tracking-wider bg-card"
                  >
                    <div className="flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 group-hover:text-indigo-500 transition-colors" />
                      View Activity Logs
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Devices */}
          <Card className="border-none shadow-xs bg-card text-card-foreground rounded-[2rem] overflow-hidden">
            <CardHeader className="p-6 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                  Authorized Devices
                </CardTitle>
                <Badge className="bg-muted text-muted-foreground border-none font-black text-[9px] rounded-lg">
                  {activity?.devices?.length || 0}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {activity?.devices?.map((device: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-xl group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center border border-border group-hover:bg-card transition-all">
                      <Smartphone className="w-4 h-4 text-muted-foreground group-hover:text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-foreground uppercase tracking-tight">
                        {device.deviceName || 'Unknown'}
                      </p>
                      <p className="text-[9px] font-mono text-muted-foreground">
                        {device.deviceIdentifier?.slice(0, 12)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                      {device.trustLevel}
                    </span>
                    <Dialog>
                      <DialogTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground/50 hover:text-indigo-600 hover:bg-indigo-500/10 rounded-md"
                          />
                        }
                      >
                        <Search className="w-3 h-3" />
                      </DialogTrigger>
                      <DialogContent className="rounded-[2rem] border-none bg-card text-card-foreground shadow-2xl max-w-sm">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
                            <Smartphone className="w-5 h-5 text-indigo-600" />
                            Device Fingerprint
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-2">
                          <div className="p-4 bg-muted/50 rounded-2xl space-y-3">
                            {[
                              { label: 'Hardware Model', value: device.deviceName || 'Unknown' },
                              { label: 'Platform / OS', value: device.osVersion || 'Unknown' },
                            ].map(({ label, value }) => (
                              <div key={label}>
                                <p className="text-[10px] font-black text-muted-foreground uppercase mb-0.5">{label}</p>
                                <p className="text-sm font-bold text-foreground">{value}</p>
                              </div>
                            ))}
                            <div>
                              <p className="text-[10px] font-black text-muted-foreground uppercase mb-0.5">Device UID</p>
                              <p className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 p-2 rounded-lg break-all">
                                {device.deviceIdentifier}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 border border-border rounded-xl">
                              <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Trust Level</p>
                              <Badge className="bg-emerald-500 text-white border-none text-[9px] font-black rounded-md">
                                {device.trustLevel}
                              </Badge>
                            </div>
                            <div className="p-3 border border-border rounded-xl">
                              <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Last Seen</p>
                              <p className="text-[10px] font-bold text-foreground">
                                {new Date(device.lastSeenAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
              {(!activity?.devices || activity.devices.length === 0) && (
                <div className="py-10 text-center">
                  <Smartphone className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    No active devices
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
