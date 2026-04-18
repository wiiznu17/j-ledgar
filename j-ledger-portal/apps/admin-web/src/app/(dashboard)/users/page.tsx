import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WalletUsersTable } from '@/components/users/WalletUsersTable';
import { userRequester } from '@/lib/requesters';
import { WalletUser } from '@/types/models';

async function getWalletUsers(): Promise<WalletUser[]> {
  try {
    return await userRequester.getWalletUsers();
  } catch (error) {
    console.error('[USERS_PAGE] Fetch error:', error);
    return [];
  }
}

export default async function UsersPage() {
  const users = await getWalletUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-[#2D3748]">Wallet User Registry</h2>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Fraud Control & User Monitoring</CardTitle>
          <CardDescription>
            Monitor all registered wallet users and perform emergency account freezing for suspicious activities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WalletUsersTable users={users} />
        </CardContent>
      </Card>
    </div>
  );
}
