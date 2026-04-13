'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api-config';
import { Account, AccountTable } from '@/components/tables/AccountTable';

export default function AccountsPage() {
  const [data, setData] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState('SUPPORT_STAFF');

  useEffect(() => {
    const role = document.cookie
      .split('; ')
      .find(row => row.startsWith('user_role='))
      ?.split('=')[1];
    if (role) setUserRole(role);
  }, []);

  const fetchAccounts = () => {
    fetch(`${API_BASE_URL}/api/v1/accounts?page=0&size=50`, {
      credentials: 'include'
    })
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((d) => setData(d.content))
      .catch(() => toast.error('Service temporarily unavailable. Please try again.'));
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleToggleStatus = async (accountId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/accounts/${accountId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success(`Account status updated to ${newStatus}`);
      fetchAccounts();
    } catch {
      toast.error('Failed to update account status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight text-[#2D3748]">Accounts Management</h2>
      
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>System Accounts</CardTitle>
          <CardDescription>View all accounts and manage their operational status.</CardDescription>
        </CardHeader>
        <CardContent>
          <AccountTable 
            data={data} 
            onToggleStatus={handleToggleStatus} 
            loading={loading} 
            userRole={userRole}
          />
        </CardContent>
      </Card>
    </div>
  );
}

