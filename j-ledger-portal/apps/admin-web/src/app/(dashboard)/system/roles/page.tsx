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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Shield,
  ShieldAlert,
  Lock,
  Eye,
  Plus,
  ArrowRight,
  Settings2,
} from 'lucide-react';
import { showSuccess, showError } from '@/lib/swal';
import { userRequester } from '@/lib/requesters';
import Link from 'next/link';

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // New role form state
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await userRequester.getAllRoles();
      setRoles(Array.isArray(response) ? response : []);
    } catch {
      showError('Access Denied', 'Failed to load roles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userRequester.createRole({
        name: newName.toUpperCase().replace(/\s+/g, '_'),
        description: newDescription,
      });

      showSuccess(
        'Created',
        `Role "${newName}" has been created successfully.`,
      );
      setNewName('');
      setNewDescription('');
      setIsDialogOpen(false);
      fetchRoles();
    } catch (e: any) {
      showError('Creation Failed', e.message || 'Could not create role.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#2D3748]">
            Roles & Permissions
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage administrative roles and their access levels across the
            system.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger
            render={
              <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0 shadow-md hover:shadow-lg transition-all">
                <Plus className="mr-2 h-4 w-4" />
                Create New Role
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[425px] bg-white rounded-2xl border-0 shadow-2xl">
            <form onSubmit={handleCreateRole}>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">
                  New Security Role
                </DialogTitle>
                <DialogDescription>
                  Define a new role. You can assign specific permissions after
                  creation.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-6">
                <div className="grid gap-2">
                  <Label
                    htmlFor="name"
                    className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1"
                  >
                    Role Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g. CUSTOMER_SUPPORT_LEAD"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 focus:ring-indigo-500 bg-slate-50/50"
                    required
                  />
                  <p className="text-[10px] text-slate-400 ml-1 italic">
                    * Name will be converted to UPPER_SNAKE_CASE
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label
                    htmlFor="description"
                    className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1"
                  >
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Briefly describe the purpose of this role..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="min-h-[100px] rounded-xl border-slate-200 focus:ring-indigo-500 bg-slate-50/50 resize-none"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={loading || !newName}
                  className="w-full h-11 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all"
                >
                  {loading ? 'Creating...' : 'Initialize Role'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden rounded-2xl bg-white/70 backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow className="hover:bg-transparent border-b border-slate-100">
                    <TableHead className="w-[300px] py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest pl-6">
                      Role Name
                    </TableHead>
                    <TableHead className="py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Description
                    </TableHead>
                    <TableHead className="py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center w-[150px]">
                      Security Status
                    </TableHead>
                    <TableHead className="text-right py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest pr-6 w-[200px]">
                      Management
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow
                      key={role.id}
                      className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0"
                    >
                      <TableCell className="py-5 pl-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2.5 rounded-xl ${role.isSystem ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}
                          >
                            <Shield className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-sm font-bold text-slate-800 tracking-tight block group-hover:text-indigo-600 transition-colors">
                              {role.name}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">
                              Created{' '}
                              {new Date(role.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <p className="text-sm text-slate-600 max-w-md line-clamp-2 leading-relaxed italic">
                          {role.description || 'No description provided.'}
                        </p>
                      </TableCell>
                      <TableCell className="py-5 text-center">
                        {role.isSystem ? (
                          <Badge className="bg-slate-100 text-slate-500 border-slate-200 font-black text-[10px] px-2.5 py-0.5 tracking-wider">
                            <Lock className="w-3 h-3 mr-1" /> SYSTEM
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black text-[10px] px-2.5 py-0.5 tracking-wider">
                            CUSTOM
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right py-5 pr-6">
                        <Link href={`/system/roles/${role.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`h-9 px-4 rounded-xl font-bold text-xs border-slate-200 hover:border-indigo-500 hover:text-indigo-600 transition-all ${role.isSystem ? 'bg-slate-50' : 'bg-white'}`}
                          >
                            {role.isSystem ? (
                              <>
                                <Eye className="h-3.5 w-3.5 mr-2" /> View Scope
                              </>
                            ) : (
                              <>
                                <Settings2 className="h-3.5 w-3.5 mr-2" />{' '}
                                Configure
                              </>
                            )}
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
                        <div className="flex items-center justify-center gap-3 text-slate-400 animate-pulse">
                          <Shield className="w-5 h-5" />
                          <span className="font-bold tracking-widest text-xs uppercase">
                            Loading secure roles...
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        <div className="md:col-span-2 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 flex items-start gap-4">
          <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-indigo-900">Security Note</h4>
            <p className="text-sm text-indigo-700/80 leading-relaxed mt-1">
              System roles are core to the platform's stability and cannot be
              modified or deleted. If you need custom access levels, please
              create a new role and assign permissions manually.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
