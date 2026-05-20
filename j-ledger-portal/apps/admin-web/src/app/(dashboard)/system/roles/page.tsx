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
import { TablePagination } from '@/components/common/TablePagination';

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // New role form state
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const fetchRoles = async (pageOverride?: number) => {
    setLoading(true);
    try {
      const currentPage = pageOverride || page;
      const response = await userRequester.getAllRoles({
        params: {
          page: currentPage,
          limit: 10,
        },
      });
      setRoles(response.data || []);

      if (response.pagination) {
        setTotalPages(response.pagination.totalPages || 1);
        setTotalItems(response.pagination.total || 0);
        setPage(response.pagination.page || 1);
      }
    } catch {
      showError('Access Denied', 'Failed to load roles.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchRoles(newPage);
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
    <div className="space-y-4 text-foreground">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-bold text-foreground">
            Security Roles
          </span>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger
            render={
              <Button className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white border-0 shadow-sm transition-all h-9 text-xs font-bold rounded-xl">
                <Plus className="mr-1.5 h-4 w-4" />
                Create New Role
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[425px] bg-card text-foreground rounded-2xl border border-border shadow-md">
            <form onSubmit={handleCreateRole}>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-foreground">
                  New Security Role
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Define a new role. You can assign specific permissions after
                  creation.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-6">
                <div className="grid gap-2">
                  <Label
                    htmlFor="name"
                    className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1"
                  >
                    Role Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g. CUSTOMER_SUPPORT_LEAD"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-11 rounded-xl border-border focus:ring-indigo-500 bg-muted/30 text-foreground"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground ml-1 italic">
                    * Name will be converted to UPPER_SNAKE_CASE
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label
                    htmlFor="description"
                    className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1"
                  >
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Briefly describe the purpose of this role..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="min-h-[100px] rounded-xl border-border focus:ring-indigo-500 bg-muted/30 text-foreground resize-none"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={loading || !newName}
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl font-bold transition-all"
                >
                  {loading ? 'Creating...' : 'Initialize Role'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border border-border shadow-xs overflow-hidden rounded-2xl bg-card/70 backdrop-blur-xs text-card-foreground">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-b border-border">
                    <TableHead className="w-[300px] py-4 text-[11px] font-black text-muted-foreground uppercase tracking-widest pl-6">
                      Role Name
                    </TableHead>
                    <TableHead className="py-4 text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                      Description
                    </TableHead>
                    <TableHead className="py-4 text-[11px] font-black text-muted-foreground uppercase tracking-widest text-center w-[150px]">
                      Security Status
                    </TableHead>
                    <TableHead className="text-right py-4 text-[11px] font-black text-muted-foreground uppercase tracking-widest pr-6 w-[200px]">
                      Management
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow
                      key={role.id}
                      className="group hover:bg-muted/30 transition-colors border-b border-border last:border-0"
                    >
                      <TableCell className="py-5 pl-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2.5 rounded-xl ${role.isSystem ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}
                          >
                            <Shield className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-sm font-bold text-foreground tracking-tight block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {role.name}
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">
                              Created{' '}
                              {new Date(role.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <p className="text-sm text-muted-foreground max-w-md line-clamp-2 leading-relaxed italic">
                          {role.description || 'No description provided.'}
                        </p>
                      </TableCell>
                      <TableCell className="py-5 text-center">
                        {role.isSystem ? (
                          <Badge className="bg-muted text-muted-foreground border-border font-black text-[10px] px-2.5 py-0.5 tracking-wider">
                            <Lock className="w-3 h-3 mr-1" /> SYSTEM
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-black text-[10px] px-2.5 py-0.5 tracking-wider">
                            CUSTOM
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right py-5 pr-6">
                        <Link href={`/system/roles/${role.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`h-9 px-4 rounded-xl font-bold text-xs border-border hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all ${role.isSystem ? 'bg-muted/50' : 'bg-card'}`}
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
                        <div className="flex items-center justify-center gap-3 text-muted-foreground animate-pulse">
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
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              isLoading={loading}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        <div className="md:col-span-2 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-6 flex items-start gap-4">
          <div className="bg-indigo-500/10 p-3 rounded-xl text-indigo-600 dark:text-indigo-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-indigo-900 dark:text-indigo-100">
              Security Note
            </h4>
            <p className="text-sm text-indigo-600/90 dark:text-indigo-400/90 leading-relaxed mt-1">
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
