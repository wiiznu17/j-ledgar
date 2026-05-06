'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Mail, Activity, ArrowLeft, UserX, UserCheck, ChevronRight, RefreshCcw } from 'lucide-react';
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

export default function AdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
  const isExpired = isInvited && admin?.inviteExpiry && new Date(admin.inviteExpiry) < new Date();

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
      const data = await userRequester.getAllRoles();
      setAvailableRoles(data);
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
        : `An email with a reset link will be sent to ${admin?.email}.`
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
          : `A password reset link was sent to ${admin?.email}`
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
        : 'This admin will regain access to the portal.'
    );

    if (!result.isConfirmed) return;

    try {
      const { apiClient } = await import('@/lib/api-client');
      if (isCurrentlyActive) {
        await apiClient.post(`/api/admin/staff/${id}/deactivate`);
        showSuccess('Suspended', 'Admin access has been suspended.');
      } else {
        await apiClient.post(`/api/admin/staff/${id}/reactivate`);
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
      const { apiClient } = await import('@/lib/api-client');
      await apiClient.put(`/api/admin/staff/${id}`, { role: editedRole });
      
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
    return <div className="flex justify-center py-12 text-slate-500">Loading profile...</div>;
  }

  if (!admin) {
    return <div className="flex justify-center py-12 text-destructive">Admin not found</div>;
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      {/* Header with Breadcrumbs */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest gap-2">
          <button onClick={() => router.back()} className="hover:text-indigo-600 transition-colors uppercase tracking-widest font-bold text-[10px]">Directory</button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900">Admin Profile</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Detail</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => fetchAdminData()}
              variant="outline" 
              className="rounded-lg border-slate-200 font-semibold text-xs h-9 px-4 text-slate-600 hover:bg-slate-50"
            >
              <RefreshCcw className="w-3.5 h-3.5 mr-2" /> Sync Profile
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-border shadow-sm">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Personal details and access rights.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-800">
                  {admin.firstName} {admin.lastName}
                </h3>
                <p className="text-slate-500">{admin.email}</p>
              </div>
              <Badge
                variant={isInvited ? 'outline' : (admin.isActive ? 'default' : 'destructive')}
                className={`text-sm px-3 py-1 font-bold ${
                  isInvited
                    ? (isExpired ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200')
                    : ''
                }`}
              >
                {isInvited 
                  ? (isExpired ? 'EXPIRED INVITE' : 'PENDING INVITE') 
                  : (admin.isActive ? 'ACTIVE' : 'SUSPENDED')}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500 mb-1">System Role</p>
                  {!isEditingRole && admin.email !== 'admin@jledger.io' && (
                    <button 
                      onClick={() => setIsEditingRole(true)}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider"
                    >
                      Change Role
                    </button>
                  )}
                </div>
                
                {isEditingRole ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Select value={editedRole} onValueChange={(val) => val && setEditedRole(val)}>
                      <SelectTrigger className="h-9 bg-white border-slate-200 rounded-lg text-xs font-semibold">
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {availableRoles.map((role) => (
                          <SelectItem key={role.id} value={role.name}>
                            {role.name}
                          </SelectItem>
                        ))}
                        {availableRoles.length === 0 && (
                          <>
                            <SelectItem value={AdminRole.SUPER_ADMIN}>Super Admin</SelectItem>
                            <SelectItem value={AdminRole.AUDITOR}>Auditor</SelectItem>
                            <SelectItem value={AdminRole.SUPPORT_AGENT}>Support Agent</SelectItem>
                            <SelectItem value={AdminRole.COMPLIANCE_OFFICER}>Compliance Officer</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        onClick={handleUpdateRole}
                        disabled={isUpdating}
                        className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white px-3 text-xs font-bold"
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
                        className="h-9 text-slate-400 hover:text-slate-600 px-3 text-xs font-bold"
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
                        ? 'border-primary text-primary bg-primary/5'
                        : 'text-slate-600'
                    }
                  >
                    {admin.role || 'N/A'}
                  </Badge>
                )}
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Joined Date</p>
                <p className="font-medium text-slate-800">
                  {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Security & Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start text-slate-700"
                onClick={handleResetPassword}
              >
                <Mail className="mr-2 h-4 w-4 text-blue-500" />
                {isInvited ? 'Resend Invitation' : 'Send Password Reset'}
              </Button>

              {admin.email !== 'admin@jledger.io' && currentUser?.id !== id && (
                <Button
                  variant={admin.isActive ? "outline" : "default"}
                  className={`w-full justify-start ${admin.isActive ? 'text-destructive hover:text-destructive' : ''}`}
                  onClick={handleToggleStatus}
                >
                  {admin.isActive ? (
                    <>
                      <UserX className="mr-2 h-4 w-4" /> Suspend Access
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" /> Activate Access
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Accountability</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="secondary"
                className="w-full justify-start bg-slate-100 hover:bg-slate-200 text-slate-700"
                onClick={() => router.push(`/audit?adminUserId=${admin.id}`)}
              >
                <Activity className="mr-2 h-4 w-4" />
                View Audit Logs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
