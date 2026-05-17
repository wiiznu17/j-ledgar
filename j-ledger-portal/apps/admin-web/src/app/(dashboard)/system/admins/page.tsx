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
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger
            render={
              <Button className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white border-0 shadow-sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Create User
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[425px] bg-card text-foreground border-border">
            <form onSubmit={handleCreateUser}>
              <DialogHeader>
                <DialogTitle>Add New Admin</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Create a new administrator account with specific role-based
                  access.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@jledger.io"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="bg-card border-border"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                      className="bg-card border-border"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      className="bg-card border-border"
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role Assignment</Label>
                  <Select
                    value={newRole}
                    onValueChange={(val) => val && setNewRole(val)}
                  >
                    <SelectTrigger id="role" className="bg-card border-border">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border text-foreground">
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
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold"
                >
                  {loading ? 'Creating...' : 'Confirm Registration'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border border-border shadow-xs overflow-hidden bg-card text-card-foreground">
        <div className="p-4 bg-muted/10 border-b border-border">
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
              searchLabel="Search"
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
                  <TableHead className="text-muted-foreground">Staff</TableHead>
                  <TableHead className="text-muted-foreground">Role</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(users) &&
                  users.map((user) => (
                    <TableRow
                      key={user.id}
                      className="hover:bg-muted/30 transition-colors border-border"
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            user.role === AdminRole.SUPER_ADMIN
                              ? 'border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10'
                              : 'text-muted-foreground border-border bg-muted/10'
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.isInvited && user.isActive ? (
                          new Date(user.inviteExpiry || 0) < new Date() ? (
                            <Badge
                              className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-bold"
                              variant="outline"
                            >
                              EXPIRED INVITE
                            </Badge>
                          ) : (
                            <Badge
                              className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold"
                              variant="outline"
                            >
                              PENDING INVITE
                            </Badge>
                          )
                        ) : (
                          <Badge
                            className={
                              user.isActive
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-bold'
                            }
                            variant="outline"
                          >
                            {user.isActive ? 'ACTIVE' : 'SUSPENDED'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                        <Link href={`/system/admins/${user.id}`}>
                          <Button variant="outline" size="sm" className="h-8 border-border hover:bg-muted/50">
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                        </Link>
                        {user.role !== AdminRole.SUPER_ADMIN &&
                          user.email !== 'admin@jledger.io' &&
                          user.id !== currentUser?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-destructive hover:bg-destructive/10 h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                      </TableCell>
                    </TableRow>
                  ))}
                {loading && users.length === 0 && (
                  <TableRow className="border-border">
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Loading directory...
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
                        <p>No admin users found.</p>
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
