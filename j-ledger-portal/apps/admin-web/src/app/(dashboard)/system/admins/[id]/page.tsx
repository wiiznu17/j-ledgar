'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldAlert,
  Mail,
  Activity,
  ArrowLeft,
  UserX,
  UserCheck,
  ChevronRight,
  RefreshCcw,
  Shield,
  Lock,
  History,
} from 'lucide-react';
import { showConfirm, showSuccess, showError } from '@/lib/swal';
import { AdminUser, AdminRole } from '@repo/dto';
import { userRequester, authRequester } from '@/lib/requesters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AdminDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [editedRole, setEditedRole] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  const isInvited = admin?.isInvited && admin?.isActive;
  const isExpired =
    isInvited &&
    admin?.inviteExpiry &&
    new Date(admin.inviteExpiry) < new Date();

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const response = await userRequester.getAdminDetail(id);
      setAdmin(response);
    } catch (e) {
      showError('Error', 'Failed to load admin details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await userRequester.getAllRoles();
      setAvailableRoles(response.data || []);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const data = await authRequester.getMe();
      setCurrentUser(data);
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  useEffect(() => {
    fetchAdminData();
    fetchRoles();
    fetchCurrentUser();
  }, [id]);

  useEffect(() => {
    if (admin) {
      setEditedRole(admin.role);
    }
  }, [admin]);

  const handleResetPassword = async () => {
    const result = await showConfirm(
      isInvited ? 'Resend Invitation?' : 'Send Password Reset?',
      isInvited
        ? `A new invitation link will be sent to ${admin?.email}. This will invalidate the previous link.`
        : `An email with a reset link will be sent to ${admin?.email}.`,
    );

    if (!result.isConfirmed) return;

    try {
      if (isInvited) {
        await userRequester.resendAdminInvite(id);
      } else {
        await userRequester.resetAdminPassword(id);
      }
      showSuccess(
        isInvited ? 'Invitation Resent' : 'Email Sent',
        isInvited
          ? `A new invitation link has been sent to ${admin?.email}`
          : `A password reset link was sent to ${admin?.email}`,
      );
    } catch (e) {
      showError('Failed', 'Could not send reset email. Please try again.');
    }
  };

  const handleToggleStatus = async () => {
    const isCurrentlyActive = admin?.isActive;
    const result = await showConfirm(
      isCurrentlyActive ? 'Suspend Admin?' : 'Activate Admin?',
      isCurrentlyActive
        ? 'This admin will lose access to the portal immediately.'
        : 'This admin will regain access to the portal.',
    );

    if (!result.isConfirmed) return;

    try {
      if (isCurrentlyActive) {
        await userRequester.deactivateAdmin(id);
        showSuccess('Suspended', 'Admin access has been suspended.');
      } else {
        await userRequester.reactivateAdmin(id);
        showSuccess('Activated', 'Admin access restored.');
      }
      fetchAdminData();
    } catch (e) {
      showError('Action Failed', 'Could not update admin status.');
    }
  };

  const handleUpdateRole = async () => {
    if (editedRole === admin?.role) {
      setIsEditingRole(false);
      return;
    }

    setIsUpdating(true);
    try {
      await userRequester.updateAdmin(id, { role: editedRole });

      showSuccess('Updated', 'Administrator role has been updated.');
      setIsEditingRole(false);
      fetchAdminData();
    } catch (e) {
      showError('Update Failed', 'Could not update the role.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 flex-col gap-4">
        <RefreshCcw className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
        <p className="text-muted-foreground text-sm font-medium animate-pulse">
          Loading administrator profile...
        </p>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2 text-destructive">
        <ShieldAlert className="w-10 h-10 animate-bounce" />
        <p className="font-bold text-sm">Administrator not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10 px-4 md:px-0 text-foreground">
      {/* Header with Breadcrumbs */}
      <div className="flex flex-col gap-4 bg-card p-6 rounded-[2rem] border border-border shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest gap-2">
            <Link
              href="/system/admins"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Admins
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">Admin Profile</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => fetchAdminData()}
              variant="outline"
              className="rounded-xl border-border font-bold text-xs uppercase tracking-wider h-10 px-4 text-muted-foreground hover:bg-muted/50 transition-all"
            >
              <RefreshCcw className="w-3.5 h-3.5 mr-2" /> Sync Profile
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <Card className="lg:col-span-2 border border-border shadow-xs bg-card text-card-foreground rounded-[2rem] overflow-hidden transition-all duration-300 hover:shadow-md">
          <CardHeader className="bg-muted/30 border-b border-border p-6">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
              Administrative Overview
              <Shield className="w-4 h-4 text-indigo-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
              <div>
                <h3 className="text-xl font-black text-foreground tracking-tight">
                  {admin.firstName} {admin.lastName}
                </h3>
                <p className="text-sm text-muted-foreground font-medium mt-0.5">
                  {admin.email}
                </p>
              </div>
              <Badge
                variant={
                  isInvited
                    ? 'outline'
                    : admin.isActive
                      ? 'default'
                      : 'destructive'
                }
                className={`text-[10px] font-black px-3 py-1 rounded-lg border-none ${
                  isInvited
                    ? isExpired
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : admin.isActive
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}
              >
                {isInvited
                  ? isExpired
                    ? 'EXPIRED INVITE'
                    : 'PENDING INVITE'
                  : admin.isActive
                    ? 'ACTIVE'
                    : 'SUSPENDED'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                    System Role
                  </p>
                  {!isEditingRole && admin.email !== 'admin@jledger.io' && (
                    <button
                      onClick={() => setIsEditingRole(true)}
                      className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 uppercase tracking-widest"
                    >
                      Change Role
                    </button>
                  )}
                </div>

                {isEditingRole ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Select
                      value={editedRole}
                      onValueChange={(val) => val && setEditedRole(val)}
                    >
                      <SelectTrigger className="h-10 bg-muted/20 border-border rounded-xl text-xs font-semibold text-foreground focus-visible:ring-indigo-500">
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border text-foreground rounded-xl">
                        {availableRoles.map((role) => (
                          <SelectItem key={role.id} value={role.name}>
                            {role.name}
                          </SelectItem>
                        ))}
                        {availableRoles.length === 0 && (
                          <>
                            <SelectItem value={AdminRole.SUPER_ADMIN}>
                              Super Admin
                            </SelectItem>
                            <SelectItem value={AdminRole.AUDITOR}>
                              Auditor
                            </SelectItem>
                            <SelectItem value={AdminRole.SUPPORT_AGENT}>
                              Support Agent
                            </SelectItem>
                            <SelectItem value={AdminRole.COMPLIANCE_OFFICER}>
                              Compliance Officer
                            </SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        onClick={handleUpdateRole}
                        disabled={isUpdating}
                        className="h-10 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white px-3 text-xs font-bold rounded-xl"
                      >
                        {isUpdating ? '...' : 'Save'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsEditingRole(false);
                          setEditedRole(admin.role);
                        }}
                        className="h-10 text-muted-foreground hover:text-foreground px-3 text-xs font-bold rounded-xl"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Badge
                    variant="outline"
                    className={
                      admin.role === AdminRole.SUPER_ADMIN
                        ? 'border-indigo-500/20 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 font-bold text-[10px] rounded-lg mt-0.5'
                        : admin.role === AdminRole.AUDITOR
                          ? 'border-purple-500/20 text-purple-600 dark:text-purple-400 bg-purple-500/10 font-bold text-[10px] rounded-lg mt-0.5'
                          : admin.role === AdminRole.COMPLIANCE_OFFICER
                            ? 'border-amber-500/20 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-bold text-[10px] rounded-lg mt-0.5'
                            : 'border-sky-500/20 text-sky-600 dark:text-sky-400 bg-sky-500/10 font-bold text-[10px] rounded-lg mt-0.5'
                    }
                  >
                    {admin.role || 'N/A'}
                  </Badge>
                )}
              </div>

              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-2">
                  Registration Date
                </p>
                <p className="text-sm font-bold text-foreground mt-0.5">
                  {admin.createdAt
                    ? new Date(admin.createdAt).toLocaleString()
                    : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          {/* Security & Access */}
          <Card className="border border-border shadow-xs bg-card text-card-foreground rounded-[2rem] overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardHeader className="bg-muted/30 border-b border-border p-5">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                Security & Access
                <Lock className="w-4 h-4 text-rose-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start text-foreground border-border hover:bg-muted/50 rounded-xl h-11 text-xs font-bold gap-2 px-4"
                onClick={handleResetPassword}
              >
                <Mail className="h-4 w-4 text-indigo-500" />
                {isInvited ? 'Resend Invitation Email' : 'Send Password Reset'}
              </Button>

              {admin.email !== 'admin@jledger.io' && currentUser?.id !== id && (
                <Button
                  variant={admin.isActive ? 'outline' : 'default'}
                  className={`w-full justify-start rounded-xl h-11 text-xs font-bold gap-2 px-4 ${admin.isActive ? 'text-destructive hover:text-destructive border-border hover:bg-destructive/10' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                  onClick={handleToggleStatus}
                >
                  {admin.isActive ? (
                    <>
                      <UserX className="h-4 w-4" /> Suspend Staff Access
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4" /> Restore Staff Access
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Accountability */}
          <Card className="border border-border shadow-xs bg-card text-card-foreground rounded-[2rem] overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardHeader className="bg-muted/30 border-b border-border p-5">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                System Accountability
                <History className="w-4 h-4 text-emerald-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <Button
                variant="secondary"
                className="w-full justify-start bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl h-11 text-xs font-bold gap-2 px-4"
                onClick={() => router.push(`/audit?adminUserId=${admin.id}`)}
              >
                <Activity className="h-4 w-4 text-emerald-600" />
                Audit Administration Logs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
