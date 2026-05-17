'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Shield,
  ChevronLeft,
  ChevronRight,
  Lock,
  Save,
  AlertCircle,
  Search,
  CheckCircle2,
  XCircle,
  LayoutGrid,
} from 'lucide-react';
import { showSuccess, showError, showConfirm } from '@/lib/swal';
import { userRequester } from '@/lib/requesters';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function RoleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [role, setRole] = useState<any>(null);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  // Local state for role info
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roleData, permsData] = await Promise.all([
        userRequester.getRoleDetail(id),
        userRequester.getAllPermissions(),
      ]);

      setRole(roleData);
      setRoleName(roleData.name);
      setRoleDescription(roleData.description || '');
      setAllPermissions(permsData);

      // Extract IDs of current permissions
      const currentPermIds = roleData.rolePermissions.map(
        (rp: any) => rp.permissionId,
      );
      setSelectedPerms(currentPermIds);
    } catch (e) {
      showError('Error', 'Failed to load role details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const togglePermission = (permId: string) => {
    if (role?.isSystem) return; // Prevent toggling for system roles

    setSelectedPerms((prev) =>
      prev.includes(permId)
        ? prev.filter((p) => p !== permId)
        : [...prev, permId],
    );
  };

  const handleSave = async () => {
    if (role?.isSystem) return;

    const result = await showConfirm(
      'Apply Changes?',
      'This will update access rights for all administrators assigned to this role.',
    );

    if (!result.isConfirmed) return;

    setSaving(true);
    try {
      await Promise.all([
        userRequester.updateRole(id, {
          name: roleName,
          description: roleDescription,
        }),
        userRequester.syncRolePermissions(id, selectedPerms),
      ]);

      showSuccess('Saved', 'Role and permissions have been updated.');
      fetchData();
    } catch (e: any) {
      showError('Update Failed', e.message || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4 animate-pulse">
        <Shield className="w-12 h-12 text-indigo-600" />
        <p className="font-bold tracking-widest text-xs uppercase text-muted-foreground">
          Deciphering Security Matrix...
        </p>
      </div>
    );
  }

  // Group permissions by resource
  const groupedPerms = allPermissions.reduce((acc: any, perm: any) => {
    if (!acc[perm.resource]) acc[perm.resource] = [];
    acc[perm.resource].push(perm);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest gap-2">
          <button
            onClick={() => router.push('/system/roles')}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase tracking-widest font-bold text-[10px] text-muted-foreground"
          >
            Directory
          </button>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          <span className="text-foreground">Configure Scope</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-2xl ${role.isSystem ? 'bg-indigo-600 text-white dark:bg-indigo-500' : 'bg-emerald-600 text-white dark:bg-emerald-500'} shadow-sm`}
            >
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
                {role.name}
                {role.isSystem && (
                  <Badge className="bg-foreground text-background border-0 font-black text-[9px] px-2 py-0.5 tracking-widest">
                    <Lock className="w-2.5 h-2.5 mr-1" /> SYSTEM PROTECTED
                  </Badge>
                )}
              </h1>
              <p className="text-muted-foreground text-sm italic">
                {role.description || 'No description provided.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="rounded-xl border-border font-bold text-xs h-10 px-5 text-muted-foreground hover:bg-muted/50"
            >
              Discard Changes
            </Button>
            {!role.isSystem && (
              <Button
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold text-xs h-10 px-6 shadow-sm"
              >
                {saving ? (
                  'Saving...'
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> Commit Changes
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Role Identity Card */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="border border-border shadow-xs rounded-2xl bg-card text-card-foreground sticky top-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-widest">
                Identity Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground ml-1">
                  Unique Name
                </Label>
                <Input
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  disabled={role.isSystem}
                  className="h-11 rounded-xl border-border bg-muted/20 text-foreground font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground ml-1">
                  Role Objective
                </Label>
                <Textarea
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  disabled={role.isSystem}
                  className="min-h-[120px] rounded-xl border-border bg-muted/20 text-foreground resize-none leading-relaxed"
                />
              </div>
              {role.isSystem && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-normal font-medium">
                    This is a **Core System Role**. Identity and permissions are
                    immutable to ensure platform integrity.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Permission Matrix */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Permission Matrix
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Authorized
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-muted" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Restricted
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {Object.entries(groupedPerms).map(
              ([resource, perms]: [string, any]) => (
                <Card
                  key={resource}
                  className="border border-border shadow-xs rounded-2xl overflow-hidden bg-card/60 backdrop-blur-xs group text-card-foreground"
                >
                  <div className="bg-muted/30 px-6 py-4 border-b border-border flex items-center justify-between">
                    <h4 className="text-xs font-black text-foreground uppercase tracking-[0.2em]">
                      {resource}
                    </h4>
                    <Badge
                      variant="outline"
                      className="bg-card text-[10px] font-bold border-border text-muted-foreground"
                    >
                      {perms.length} Actions
                    </Badge>
                  </div>
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 divide-y divide-border">
                      {perms.map((perm: any) => {
                        const isSelected = selectedPerms.includes(perm.id);
                        return (
                          <div
                            key={perm.id}
                            className={`flex items-center justify-between px-6 py-4 transition-all duration-300 ${
                              isSelected
                                ? 'bg-emerald-500/5 dark:bg-emerald-500/10'
                                : 'hover:bg-muted/30'
                            }`}
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <Checkbox
                                id={perm.id}
                                checked={isSelected}
                                onCheckedChange={() =>
                                  togglePermission(perm.id)
                                }
                                disabled={role.isSystem}
                                className="w-5 h-5 rounded-md border border-border"
                              />
                              <div
                                className="cursor-pointer flex-1"
                                onClick={() => togglePermission(perm.id)}
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-sm font-bold tracking-tight ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}
                                  >
                                    {perm.name.replace(`${resource}_`, '')}
                                  </span>
                                  {isSelected && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  )}
                                </div>
                                <p className="text-[11px] text-muted-foreground font-medium leading-relaxed mt-0.5">
                                  {perm.description ||
                                    `Grants ${perm.action.toLowerCase()} access to ${resource.toLowerCase()} resources.`}
                                </p>
                              </div>
                            </div>

                            <div className="ml-4">
                              <Badge
                                className={`font-black text-[9px] px-2 py-0.5 tracking-tighter border-0 ${
                                  isSelected
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {perm.action}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
