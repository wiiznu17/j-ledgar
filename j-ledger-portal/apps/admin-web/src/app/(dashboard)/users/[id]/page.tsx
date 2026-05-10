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
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
  Fingerprint,
  ArrowRight,
  ExternalLink,
  Search,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { userRequester } from '@/lib/requesters';
import { WalletUser, UserStatus } from '@repo/dto';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { UserControlActions } from '@/components/users/UserControlActions';
import Link from 'next/link';
import { getUserStatusConfig } from '@/lib/status-utils';

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
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-4 w-48 bg-slate-100 rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="h-64 bg-slate-50 rounded-3xl" />
            <div className="h-96 bg-slate-50 rounded-3xl" />
          </div>
          <div className="space-y-8">
            <div className="h-48 bg-slate-50 rounded-3xl" />
            <div className="h-64 bg-slate-50 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-10 bg-white rounded-3xl border border-dashed border-slate-200">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">User Not Found</h2>
        <p className="text-slate-500 mt-2 max-w-xs">
          The user you are looking for might have been deleted or the ID is
          incorrect.
        </p>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mt-8 rounded-xl px-8 border-slate-200"
        >
          Go Back to List
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10 max-w-6xl mx-auto">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest gap-2">
          <Link
            href="/users"
            className="hover:text-indigo-600 transition-colors font-bold"
          >
            Users
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900">Profile Details</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Identity Profile
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <UserControlActions
              userId={user.id}
              email={user.email || ''}
              status={user.status || ''}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3 items-stretch">
        {/* Left Column: Core Info & Devices */}
        <div className="lg:col-span-2">
          {/* USER HERO CARD */}
          <Card className="h-full border-none shadow-sm ring-1 ring-slate-100 bg-white overflow-hidden rounded-[2rem]">
            <div className="h-32 bg-gradient-to-r from-indigo-600 to-violet-600 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            </div>
            <CardHeader className="relative pb-0">
              <div className="absolute -top-16 left-8 p-1.5 bg-white rounded-[2rem] shadow-xl">
                <div className="w-24 h-24 rounded-[1.6rem] bg-slate-900 flex items-center justify-center text-white overflow-hidden border-4 border-slate-900">
                  <User className="w-12 h-12 text-slate-200" />
                </div>
              </div>
              <div className="pl-36 pt-2 pb-6 flex justify-between items-start">
                <div>
                  <h3
                    className={cn(
                      'text-2xl font-black text-slate-900',
                      !user.email && 'text-slate-400 italic',
                    )}
                  >
                    {user.email || 'Email Not Set'}
                  </h3>
                  <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mt-1.5">
                    <Badge
                      className={cn(
                        'px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border-none flex items-center gap-1.5',
                        getUserStatusConfig(user.status).color,
                      )}
                    >
                      {(() => {
                        const config = getUserStatusConfig(user.status);
                        const Icon = config.icon;
                        return <Icon className="w-2.5 h-2.5" />;
                      })()}
                      {user.status}
                    </Badge>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        KYC:
                      </span>
                      <Badge className="bg-emerald-50 text-emerald-600 border-none text-[10px] font-black rounded-lg px-2 py-0.5 uppercase tracking-tighter">
                        Verified
                      </Badge>
                      <Link href={`/kyc/${user.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>

                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase">
                      <Calendar className="w-3 h-3" />
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-10 p-10 pt-6">
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Phone className="w-3 h-3" /> Contact Verification
                </h4>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Phone Number
                    </span>
                    <span className="text-lg font-bold text-slate-900 tracking-tight">
                      {user.phoneNumber}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Primary Email
                    </span>
                    <span
                      className={cn(
                        'text-sm font-bold',
                        user.email ? 'text-slate-700' : 'text-slate-400 italic',
                      )}
                    >
                      {user.email || 'not set'}
                    </span>
                  </div>
                  <div className="pt-2">
                    <Badge
                      variant="secondary"
                      className="bg-slate-100 text-slate-600 font-bold text-[10px] rounded-lg px-2.5 py-1"
                    >
                      STATE: {user.registrationState}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Wallet className="w-3 h-3" /> Linked Ledger
                </h4>
                {account ? (
                  <div className="p-6 rounded-[1.5rem] bg-slate-50 ring-1 ring-slate-100 space-y-4 relative group hover:ring-indigo-200 transition-all cursor-pointer overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center">
                          <Wallet className="w-3 h-3 text-indigo-600" />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                          Balance Available
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-white border-slate-200 text-[9px] font-black text-slate-500 rounded-md"
                      >
                        {account.status}
                      </Badge>
                    </div>
                    <div className="relative z-10 flex items-baseline gap-2">
                      <span className="text-4xl font-black text-slate-900 tracking-tighter">
                        {account.balance.toLocaleString()}
                      </span>
                      <span className="text-xs font-black text-slate-400 uppercase">
                        {account.currency}
                      </span>
                    </div>
                    <Link
                      href={`/wallets/${account.id}`}
                      className="relative z-10 flex items-center gap-1.5 text-[10px] font-black text-indigo-600 uppercase hover:gap-2 transition-all"
                    >
                      View Wallet Details <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ) : (
                  <div className="p-6 rounded-[1.5rem] bg-amber-50 ring-1 ring-amber-100 flex flex-col items-center justify-center text-center gap-2 border border-dashed border-amber-200">
                    <AlertCircle className="w-6 h-6 text-amber-500" />
                    <p className="text-[10px] text-amber-700 font-black uppercase tracking-tight">
                      No linked wallet found
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Security & Summary */}
        <div className="space-y-5">
          <Card className="border-none shadow-sm ring-1 ring-slate-100 bg-white rounded-[2rem] overflow-hidden">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">
                Identity Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-6">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">
                        Account Age
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {(() => {
                          const days = Math.floor(
                            (new Date().getTime() -
                              new Date(user.createdAt).getTime()) /
                              (1000 * 60 * 60 * 24),
                          );
                          return days === 0 ? 'Today' : `${days} Days`;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">
                        Trust Summary
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {activity?.devices?.length || 0} Authorized Node(s)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">
                        Activity Pulse
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {activity?.lastLoginAt
                          ? new Date(activity.lastLoginAt).toLocaleTimeString(
                              [],
                              { hour: '2-digit', minute: '2-digit' },
                            ) + ' Today'
                          : 'No recent activity'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-50">
                  <Link
                    href={`/users/activity?userId=${user.id}`}
                    className="block"
                  >
                    <Button
                      variant="outline"
                      className="w-full justify-between h-10 rounded-xl text-slate-600 border-slate-100 hover:bg-slate-50 group font-bold text-[10px] uppercase tracking-wider"
                    >
                      <div className="flex items-center">
                        <Activity className="w-3.5 h-3.5 mr-2 text-slate-400 group-hover:text-indigo-600" />
                        View Security Activity
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm ring-1 ring-slate-100 bg-white rounded-[2rem] overflow-hidden">
            <CardHeader className="p-6 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">
                  Authorized Devices
                </CardTitle>
                <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[9px] rounded-lg">
                  {activity?.devices?.length || 0} SECURE
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50 px-4">
                {activity?.devices?.map((device: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors rounded-xl my-1 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                        <Smartphone className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">
                          {device.deviceName || 'Unknown'}
                        </p>
                        <p className="text-[8px] font-mono text-slate-400 uppercase tracking-tighter">
                          UID: {device.deviceIdentifier.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                        {device.trustLevel}
                      </span>
                      <Dialog>
                        <DialogTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"
                            />
                          }
                        >
                          <Search className="w-3 h-3" />
                        </DialogTrigger>
                        <DialogContent className="rounded-[2rem] border-none shadow-2xl max-w-sm">
                          <DialogHeader>
                            <DialogTitle className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                              <Smartphone className="w-5 h-5 text-indigo-600" />
                              Device Fingerprint
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6 pt-4">
                            <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase">
                                  Hardware Model
                                </span>
                                <span className="text-sm font-bold text-slate-900">
                                  {device.deviceName || 'Unknown Hardware'}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase">
                                  Platform / OS
                                </span>
                                <span className="text-sm font-bold text-slate-700">
                                  {device.osVersion || 'Unknown OS'}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase">
                                  Device Identifier (UID)
                                </span>
                                <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 p-2 rounded-lg break-all">
                                  {device.deviceIdentifier}
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 border border-slate-100 rounded-xl">
                                <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">
                                  Security Level
                                </span>
                                <Badge className="bg-emerald-500 text-white border-none text-[9px] font-black rounded-md">
                                  {device.trustLevel}
                                </Badge>
                              </div>
                              <div className="p-3 border border-slate-100 rounded-xl">
                                <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">
                                  Last Seen
                                </span>
                                <span className="text-[10px] font-bold text-slate-700">
                                  {new Date(
                                    device.lastSeenAt,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
                {(!activity?.devices || activity.devices.length === 0) && (
                  <div className="p-10 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      No active devices
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
