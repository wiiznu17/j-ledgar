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
    if (newPage < 1 || newPage > totalPages) return;
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
        <h2 className="text-3xl font-bold tracking-tight text-[#2D3748]">
          User Management
        </h2>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger
            render={
              <Button className="bg-gradient-to-r from-[var(--color-magenta)] to-[var(--color-pink)] text-white border-0">
                <UserPlus className="mr-2 h-4 w-4" />
                Create User
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[425px] bg-white">
            <form onSubmit={handleCreateUser}>
              <DialogHeader>
                <DialogTitle>Add New Admin</DialogTitle>
                <DialogDescription>
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
                    <SelectTrigger id="role" className="bg-white">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
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
                  className="w-full bg-primary text-white hover:bg-primary/90"
                >
                  {loading ? 'Creating...' : 'Confirm Registration'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border shadow-sm overflow-hidden">
        <div className="p-4 bg-white border-b border-slate-100">
          <form
            onSubmit={handleApplyFilter}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
          >
            <FilterSearchInput
              label="Staff Name / Email"
              placeholder="Enter keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <FilterSelect
              label="Role Assignment"
              value={filterRole}
              onValueChange={(val) => setFilterRole(val || 'ALL')}
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
              onValueChange={(val) => setFilterStatus(val || 'ALL')}
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
          <div className="overflow-x-auto bg-white text-[#2D3748]">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(users) &&
                  users.map((user) => (
                    <TableRow
                      key={user.id}
                      className="hover:bg-secondary/30 transition-colors"
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
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
                              ? 'border-primary text-primary bg-primary/5'
                              : 'text-slate-600'
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.isInvited && user.isActive ? (
                          new Date(user.inviteExpiry || 0) < new Date() ? (
                            <Badge
                              className="bg-rose-50 text-rose-700 border-rose-200 font-bold"
                              variant="outline"
                            >
                              EXPIRED INVITE
                            </Badge>
                          ) : (
                            <Badge
                              className="bg-amber-50 text-amber-700 border-amber-200 font-bold"
                              variant="outline"
                            >
                              PENDING INVITE
                            </Badge>
                          )
                        ) : (
                          <Badge
                            className={
                              user.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
                                : 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
                            }
                            variant="outline"
                          >
                            {user.isActive ? 'ACTIVE' : 'SUSPENDED'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                        <Link href={`/system/admins/${user.id}`}>
                          <Button variant="outline" size="sm" className="h-8">
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
                              className="text-destructive hover:bg-destructive/5 h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                      </TableCell>
                    </TableRow>
                  ))}
                {loading && users.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-slate-400"
                    >
                      Loading directory...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && users.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-32 text-center text-slate-400"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Search className="h-8 w-8 text-slate-200" />
                        <p>No admin users found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination UI */}
          {totalPages > 0 && (
            <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500 font-medium">
                Showing page{' '}
                <strong className="text-slate-800">{currentPage}</strong> of{' '}
                <strong className="text-slate-800">{totalPages}</strong>
                <span className="hidden sm:inline">
                  {' '}
                  ({totalItems} total records)
                </span>
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="h-8 px-3 text-xs font-bold rounded-lg border-slate-200 text-slate-600"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className="h-8 px-3 text-xs font-bold rounded-lg border-slate-200 text-slate-600"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
