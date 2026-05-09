'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  User,
  Wallet,
  Activity,
  Shield,
  Clock,
  Smartphone,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { userRequester } from '@/lib/requesters';
import { WalletUser } from '@repo/dto';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<WalletUser | null>(null);
  const [account, setAccount] = useState<any>(null);
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userData, accountData, activityData] = await Promise.all([
          userRequester.getUserDetail(userId),
          userRequester.getUserAccount(userId).catch(() => ({ data: null })),
          userRequester.getUserActivity(userId).catch(() => ({ data: null })),
        ]);

        setUser((userData as any).data);
        setAccount((accountData as any)?.data);
        setActivity((activityData as any)?.data);
      } catch (error) {
        console.error('Error fetching user details', error);
        toast.error('Failed to load user information');
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchData();
  }, [userId]);

  const handleToggleStatus = async () => {
    if (!user) return;
    const isSuspended = user.status === 'SUSPENDED';
    try {
      if (isSuspended) {
        await userRequester.unsuspendWalletUser(userId);
        toast.success('User has been activated');
      } else {
        await userRequester.suspendWalletUser(userId);
        toast.success('User has been suspended');
      }
      // Refresh user data
      const updated = await userRequester.getUserDetail(userId);
      setUser((updated as any).data);
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium">Loading user profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center p-10">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold">User Not Found</h2>
        <Button variant="link" onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">User Profile</h2>
          <p className="text-slate-500">In-depth overview and control for wallet user identity.</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Core Info & Wallet */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm ring-1 ring-slate-100 bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-8 pt-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{user.email}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge
                        className={
                          user.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : user.status === 'SUSPENDED'
                              ? 'bg-orange-50 text-orange-700 border-orange-100'
                              : 'bg-rose-50 text-rose-700 border-rose-100'
                        }
                      >
                        {user.status}
                      </Badge>
                      <span className="text-slate-400 text-sm">•</span>
                      <span className="text-slate-500 text-sm font-medium">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant={user.status === 'SUSPENDED' ? 'default' : 'outline'}
                    onClick={handleToggleStatus}
                    className={
                      user.status === 'SUSPENDED'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'text-orange-600 border-orange-200 hover:bg-orange-50'
                    }
                  >
                    {user.status === 'SUSPENDED' ? (
                      <>
                        <Unlock className="w-4 h-4 mr-2" /> Unsuspend User
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" /> Suspend Account
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8 p-8">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Contact Details
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-slate-50">
                    <span className="text-sm text-slate-500 font-medium">Phone Number</span>
                    <span className="text-sm text-slate-900 font-bold">{user.phoneNumber}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-50">
                    <span className="text-sm text-slate-500 font-medium">Email Address</span>
                    <span className="text-sm text-slate-900 font-bold">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-500 font-medium">Registration State</span>
                    <Badge variant="secondary" className="font-bold">
                      {user.registrationState}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Wallet Status
                </h4>
                {account ? (
                  <div className="p-5 rounded-2xl bg-slate-50 ring-1 ring-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-500 uppercase">
                          Available Balance
                        </span>
                      </div>
                      <Badge variant="outline" className="bg-white border-slate-200">
                        {account.status}
                      </Badge>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900">
                        {account.balance.toLocaleString()}
                      </span>
                      <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                        THB
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      LEDGER_ID: {account.id}
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-amber-50 ring-1 ring-amber-100 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    <p className="text-sm text-amber-700 font-medium">
                      No ledger account linked to this user.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-slate-100 bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-indigo-600" />
                  Authorized Devices
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {activity?.devices?.length || 0} Registered
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {activity?.devices?.map((device: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {device.deviceName || 'Unknown Device'}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">
                          {device.deviceIdentifier}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span className="text-xs font-bold text-emerald-600">
                          {device.trustLevel}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Last seen {new Date(device.lastSeenAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {(!activity?.devices || activity.devices.length === 0) && (
                  <div className="p-8 text-center text-slate-400">
                    No devices registered for this user.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Timeline & Security */}
        <div className="space-y-8">
          <Card className="border-none shadow-sm ring-1 ring-slate-100 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start text-slate-600 border-slate-100 hover:bg-slate-50"
                disabled
              >
                <Shield className="w-4 h-4 mr-3" />
                Trigger AML Review
              </Button>
              <a
                href={`/users/activity?userId=${user.id}`}
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'w-full justify-start text-slate-600 border-slate-100 hover:bg-slate-50',
                )}
              >
                <Activity className="w-4 h-4 mr-3" />
                View Security Logs
              </a>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-slate-100 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Profile Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">First Seen</span>
                  <span className="text-xs font-bold text-slate-900">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Last Activity</span>
                  <span className="text-xs font-bold text-slate-900">
                    {activity?.lastLoginAt
                      ? new Date(activity.lastLoginAt).toLocaleDateString()
                      : 'Never'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">KYC Status</span>
                  <Badge className="bg-emerald-500 text-white border-none text-[10px] font-black">
                    VERIFIED
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
