'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { UserPlus, Trash2 } from 'lucide-react';
import { showConfirm, showSuccess, showError } from '@/lib/swal';
import { AdminUser, UserRole } from '@repo/dto';
import { userRequester } from '@/lib/requesters';

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // New user form state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<string>(UserRole.SUPPORT_STAFF);

  const fetchUsers = async () => {
    try {
      const data = await userRequester.getAdminUsers();
      setUsers(data);
    } catch {
      showError('Access Denied', 'Failed to load users. You might need higher permissions.');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userRequester.createAdmin({ 
        email: newEmail, 
        password: newPassword, 
        role: newRole 
      });

      showSuccess('Success', 'Admin user created successfully');
      setNewEmail('');
      setNewPassword('');
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
      'This administrator will lose all access to the system.'
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
        <h2 className="text-3xl font-bold tracking-tight text-[#2D3748]">User Management</h2>

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
                  Create a new administrator account with specific role-based access.
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
                <div className="grid gap-2">
                  <Label htmlFor="password">Temporary Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role Assignment</Label>
                  <Select value={newRole} onValueChange={(val) => val && setNewRole(val)}>
                    <SelectTrigger id="role" className="bg-white">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value={UserRole.SUPER_ADMIN}>Super Admin</SelectItem>
                      <SelectItem value={UserRole.RECONCILER}>Reconciler</SelectItem>
                      <SelectItem value={UserRole.SUPPORT_STAFF}>Support Staff</SelectItem>
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

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Admin Directory</CardTitle>
          <CardDescription>Manage your internal team and their system permissions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden border-border bg-white text-[#2D3748]">
            <Table>
              <TableHeader className="bg-secondary/50">
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-secondary/30 transition-colors">
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.role === UserRole.SUPER_ADMIN
                            ? 'border-primary text-primary bg-primary/5'
                            : 'text-slate-600'
                        }
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {user.email !== 'admin@jledger.io' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-destructive hover:bg-destructive/5"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      Empty directory.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
