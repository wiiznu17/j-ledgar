'use client';

import React, { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  UserPlus,
  Trash2,
  Eye,
  Search,
  Users,
  ShieldCheck,
  Mail,
  User,
  ShieldAlert
} from 'lucide-react';
import { showConfirm, showSuccess, showError } from '@/lib/swal';
import { AdminUser, AdminRole } from '@repo/dto';
import { userRequester, authRequester } from '@/lib/requesters';
import Link from 'next/link';
import {
  FilterSearchInput,
  FilterSelect,
  FilterActions,
} from '@/components/common/FilterElements';
import { TablePagination } from '@/components/common/TablePagination';

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Pagination & Filter States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);

  const [activeFilters, setActiveFilters] = useState({
    search: '',
    role: 'ALL',
    status: 'ALL',
    page: 1,
  });

  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  // New user form state
  const [newEmail, setNewEmail] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newRole, setNewRole] = useState<string>(AdminRole.SUPPORT_AGENT);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: activeFilters.page,
        limit: 10,
      };

      if (activeFilters.search) params.search = activeFilters.search;
      if (activeFilters.role !== 'ALL') params.role = activeFilters.role;
      if (activeFilters.status !== 'ALL') params.status = activeFilters.status;

      const response = await userRequester.getAdminUsers({ params });

      // Support both structured {data, pagination} and direct array responses
      const staffList =
        response?.data || (Array.isArray(response) ? response : []);
      console.log('staffList', staffList);
      setUsers(staffList);

      if (response?.pagination) {
        setTotalPages(response.pagination.totalPages);
        setTotalItems(response.pagination.total);
        setCurrentPage(response.pagination.page);
      }
    } catch {
      showError(
        'Access Denied',
        'Failed to load users. You might need higher permissions.',
      );
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
    fetchUsers();
    fetchRoles();
    fetchCurrentUser();
  }, [activeFilters]);

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setActiveFilters({
      search: searchQuery,
      role: filterRole,
      status: filterStatus,
      page: 1,
    });
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setSearchQuery('');
    setFilterRole('ALL');
    setFilterStatus('ALL');
    setActiveFilters({
      search: '',
      role: 'ALL',
      status: 'ALL',
      page: 1,
    });
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setActiveFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const username = newEmail.split('@')[0];
      await userRequester.createAdmin({
        username,
        email: newEmail,
        firstName: newFirstName,
        lastName: newLastName,
        role: newRole,
      });

      showSuccess(
        'Invitation Sent',
        `An invitation email has been sent to ${newEmail}`,
      );
      setNewEmail('');
      setNewFirstName('');
      setNewLastName('');
      setIsDialogOpen(false);
      fetchUsers();
    } catch {
      showError('Registration Failed', 'Could not create user.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    const result = await showConfirm(
      'Are you sure?',
      'This administrator will lose all access to the system.',
    );

    if (!result.isConfirmed) return;

    try {
      await userRequester.deleteAdmin(id);
      showSuccess('Deleted!', 'The user has been removed.');
      fetchUsers();
    } catch {
      showError('Action Failed', 'Failed to delete user.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-0 text-foreground">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-[2rem] border border-border shadow-xs">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400">
            <Users className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight text-foreground">Admin Management</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage system administrators, support agents, compliance officers, and role assignments.
            </p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger
            render={
              <Button className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-2xl h-11 px-6 shadow-md transition-all duration-300 hover:shadow-indigo-500/10 hover:-translate-y-0.5">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Administrator
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[425px] bg-card text-foreground border-border rounded-[2rem] overflow-hidden">
            <form onSubmit={handleCreateUser} className="space-y-5">
              <DialogHeader>
                <DialogTitle className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-500" />
                  Add New Admin
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  Create a new administrator account with specific role-based permissions.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Email Address</Label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 absolute left-3.5 text-muted-foreground/60" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@jledger.io"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="pl-10 bg-muted/20 border-border rounded-xl focus-visible:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">First Name</Label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 absolute left-3.5 text-muted-foreground/60" />
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={newFirstName}
                        onChange={(e) => setNewFirstName(e.target.value)}
                        className="pl-10 bg-muted/20 border-border rounded-xl focus-visible:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Last Name</Label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 absolute left-3.5 text-muted-foreground/60" />
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={newLastName}
                        onChange={(e) => setNewLastName(e.target.value)}
                        className="pl-10 bg-muted/20 border-border rounded-xl focus-visible:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="role" className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Role Assignment</Label>
                  <Select
                    value={newRole}
                    onValueChange={(val) => val && setNewRole(val)}
                  >
                    <SelectTrigger id="role" className="bg-muted/20 border-border rounded-xl h-11 focus-visible:ring-indigo-500">
                      <SelectValue placeholder="Select a role" />
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
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl h-11"
                >
                  {loading ? 'Registering...' : 'Confirm Registration'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters Card */}
      <Card className="border border-border shadow-xs overflow-hidden bg-card text-card-foreground rounded-[2rem] transition-all duration-300 hover:shadow-md">
        <div className="p-5 bg-muted/10 border-b border-border">
          <form
            onSubmit={handleApplyFilter}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
          >
            <FilterSearchInput
              label="Staff Name / Email"
              placeholder="Enter keyword..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            />

            <FilterSelect
              label="Role Assignment"
              value={filterRole}
              onValueChange={(val: string) => setFilterRole(val || 'ALL')}
              options={[
                { label: 'ALL ROLES', value: 'ALL' },
                ...availableRoles.map((r) => ({
                  label: r.name,
                  value: r.name,
                })),
                ...(availableRoles.length === 0
                  ? [
                      { label: 'SUPER ADMIN', value: AdminRole.SUPER_ADMIN },
                      { label: 'AUDITOR', value: AdminRole.AUDITOR },
                      {
                        label: 'SUPPORT AGENT',
                        value: AdminRole.SUPPORT_AGENT,
                      },
                      {
                        label: 'COMPLIANCE OFFICER',
                        value: AdminRole.COMPLIANCE_OFFICER,
                      },
                    ]
                  : []),
              ]}
            />

            <FilterSelect
              label="Account Status"
              value={filterStatus}
              onValueChange={(val: string) => setFilterStatus(val || 'ALL')}
              options={[
                { label: 'ALL STATUS', value: 'ALL' },
                { label: 'ACTIVE', value: 'ACTIVE' },
                { label: 'SUSPENDED', value: 'SUSPENDED' },
              ]}
            />

            <FilterActions
              searchLabel="Search staff"
              isLoading={loading}
              onReset={handleResetFilter}
            />
          </form>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto bg-card text-foreground">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 pl-6">Staff Profile</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4">Role Assignment</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4">Account Status</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 pr-6">Management</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(users) &&
                  users.map((user) => (
                    <TableRow
                      key={user.id}
                      className="hover:bg-muted/30 transition-colors border-border"
                    >
                      <TableCell className="pl-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium mt-0.5">
                            {user.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge
                          variant="outline"
                          className={
                            user.role === AdminRole.SUPER_ADMIN
                              ? 'border-indigo-500/20 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 font-bold text-[10px] rounded-lg'
                              : user.role === AdminRole.AUDITOR
                              ? 'border-purple-500/20 text-purple-600 dark:text-purple-400 bg-purple-500/10 font-bold text-[10px] rounded-lg'
                              : user.role === AdminRole.COMPLIANCE_OFFICER
                              ? 'border-amber-500/20 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-bold text-[10px] rounded-lg'
                              : 'border-sky-500/20 text-sky-600 dark:text-sky-400 bg-sky-500/10 font-bold text-[10px] rounded-lg'
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        {user.isInvited && user.isActive ? (
                          new Date(user.inviteExpiry || 0) < new Date() ? (
                            <Badge
                              className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-none font-bold text-[10px] rounded-lg"
                              variant="outline"
                            >
                              EXPIRED INVITE
                            </Badge>
                          ) : (
                            <Badge
                              className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none font-bold text-[10px] rounded-lg"
                              variant="outline"
                            >
                              PENDING INVITE
                            </Badge>
                          )
                        ) : (
                          <Badge
                            className={
                              user.isActive
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-bold text-[10px] rounded-lg'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-none font-bold text-[10px] rounded-lg'
                            }
                            variant="outline"
                          >
                            {user.isActive ? 'ACTIVE' : 'SUSPENDED'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6 py-4">
                        <div className="flex justify-end items-center gap-2">
                          <Link href={`/system/admins/${user.id}`}>
                            <Button variant="outline" size="sm" className="h-8 border-border hover:bg-muted/50 rounded-lg text-xs font-bold gap-1 px-3">
                              <Eye className="h-3.5 w-3.5" /> View
                            </Button>
                          </Link>
                          {user.role !== AdminRole.SUPER_ADMIN &&
                            user.email !== 'admin@jledger.io' &&
                            user.id !== currentUser?.id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-destructive hover:bg-destructive/10 h-8 w-8 rounded-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                {loading && users.length === 0 && (
                  <TableRow className="border-border">
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-muted-foreground font-medium text-xs animate-pulse"
                    >
                      Loading administrator directory...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && users.length === 0 && (
                  <TableRow className="border-border">
                    <TableCell
                      colSpan={4}
                      className="h-32 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Search className="h-8 w-8 text-muted-foreground/30" />
                        <p className="text-sm font-semibold">No admin users found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            isLoading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
