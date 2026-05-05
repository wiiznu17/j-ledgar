'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Mail, Activity, ArrowLeft, UserX, UserCheck, ChevronRight, RefreshCcw } from 'lucide-react';
import { showConfirm, showSuccess, showError } from '@/lib/swal';
import { AdminUser, AdminRole } from '@repo/dto';
import { userRequester } from '@/lib/requesters';

export default function AdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchAdminData();
  }, [id]);

  const handleResetPassword = async () => {
    const result = await showConfirm(
      'Send Password Reset?',
      `An email with a reset link will be sent to ${admin?.email}.`
    );

    if (!result.isConfirmed) return;

    try {
      await userRequester.resetAdminPassword(id);
      showSuccess('Email Sent', `A password reset link was sent to ${admin?.email}`);
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
      // Assuming you have an API to update status, we will mock the status update for now
      // If we don't have a specific endpoint, we can use an existing update endpoint
      // For MVP: Let's assume we use the update endpoint, but since we don't have it defined in requester, 
      // I'll show a "Not Implemented" for toggle status unless we add it. 
      // Actually, admin-staff.controller.ts HAS deactivateStaff and reactivateStaff endpoints!
      // Let's add them to userRequester later or just use apiClient here for brevity.
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
                variant={admin.isActive ? 'default' : 'destructive'}
                className="text-sm px-3 py-1"
              >
                {admin.isActive ? 'ACTIVE' : 'SUSPENDED'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-slate-500 mb-1">System Role</p>
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
                Send Password Reset
              </Button>

              {admin.email !== 'admin@jledger.io' && (
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
