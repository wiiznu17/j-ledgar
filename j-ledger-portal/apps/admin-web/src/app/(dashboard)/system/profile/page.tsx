'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Lock,
  Mail,
  ShieldCheck,
  Save,
  RefreshCcw,
  History,
  Activity,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { authRequester } from '@/lib/requesters';
import { showSuccess, showError } from '@/lib/swal';
import { AdminUser } from '@repo/dto';

export default function ProfilePage() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Profile fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await authRequester.getMe();
      setAdmin(data);
      setFirstName(data.firstName);
      setLastName(data.lastName);
    } catch (e) {
      showError('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await authRequester.updateMe({ firstName, lastName });
      showSuccess(
        'Profile Updated',
        'Your personal information has been saved.',
      );
      fetchProfile();
    } catch (e) {
      showError('Failed', 'Could not update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
        <RefreshCcw className="w-8 h-8 animate-spin" />
        <p className="font-medium animate-pulse">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Personal Settings
        </h1>
        <p className="text-sm text-slate-500">
          Manage your profile information and security preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card className="border-none shadow-lg rounded-2xl overflow-hidden bg-white flex-1 flex flex-col">
            <div className="h-24 bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-500" />
            <CardContent className="pt-0 -mt-12 text-center pb-8 px-6 flex-1 flex flex-col">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white shadow-xl mb-4 border-4 border-white overflow-hidden self-center">
                <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                  <User className="w-10 h-10 text-indigo-300" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                {admin?.firstName} {admin?.lastName}
              </h2>
              <p className="text-sm text-slate-500 mb-4">{admin?.email}</p>
              <Badge
                variant="outline"
                className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold text-xs px-3 py-1 self-center"
              >
                {admin?.role}
              </Badge>

              <div className="mt-8 pt-8 border-t border-slate-50 flex flex-col gap-5 text-left">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Account Status
                    </p>
                    <p className="text-xs font-bold text-emerald-600 uppercase truncate">
                      Verified Active
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Login ID
                    </p>
                    <p className="text-xs font-bold text-slate-700 truncate">
                      {admin?.username}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Navigation Menu */}
              <div className="mt-auto pt-8">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 text-left">
                  Quick Navigation
                </h4>
                <div className="space-y-2">
                  <Link
                    href={`/audit?adminUserId=${admin?.id}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 group transition-all border border-transparent hover:border-indigo-100"
                  >
                    <div className="flex items-center gap-3">
                      <History className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                      <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-700">
                        My Audit Logs
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                  <Link
                    href={`/audit?adminUserId=${admin?.id}&resourceType=ADMIN_USER`}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 group transition-all border border-transparent hover:border-indigo-100"
                  >
                    <div className="flex items-center gap-3">
                      <Activity className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                      <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-700">
                        Security Activity
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-2 flex flex-col">
          {/* Profile Form */}
          <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-white flex-1 flex flex-col">
            <CardHeader className="py-5 px-8 bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-base font-bold">
                Profile Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 flex-1">
              <form
                onSubmit={handleUpdateProfile}
                className="h-full flex flex-col space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="text-sm font-semibold text-slate-700"
                    >
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="rounded-xl border-slate-200 h-12 text-sm focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="rounded-xl border-slate-200 h-12 text-sm focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">
                    Email Address
                  </Label>
                  <Input
                    value={admin?.email}
                    disabled
                    className="rounded-xl bg-slate-50 border-slate-200 h-12 text-sm text-slate-400 font-medium"
                  />
                </div>

                <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100/50 flex flex-col gap-2 mt-auto">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> Identity & Privacy
                  </h4>
                  <p className="text-xs text-indigo-700/70 leading-relaxed font-medium">
                    Your profile information is visible to other system
                    administrators. For security reasons, sensitive data like
                    your email and system role can only be modified by a Super
                    Administrator.
                  </p>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 px-8 text-sm transition-all active:scale-95 shadow-lg shadow-indigo-100"
                  >
                    {isUpdatingProfile ? (
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" /> Save Profile Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
