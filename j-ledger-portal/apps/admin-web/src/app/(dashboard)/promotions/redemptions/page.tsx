import { RedemptionsTable } from '@/components/promotions/RedemptionsTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { promotionsRequester } from '@/lib/requesters';

async function getRedemptions() {
  try {
    return await promotionsRequester.getRedemptions();
  } catch (error) {
    console.error('[REDEMPTIONS_PAGE] Fetch error:', error);
    return [];
  }
}

export default async function RedemptionsPage() {
  const redemptions = await getRedemptions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#2D3748]">Redemption History</h2>
          <p className="text-muted-foreground mt-1">
            Monitor all user reward claims and usage status.
          </p>
        </div>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Global Usage Logs</CardTitle>
          <CardDescription>
            Real-time feed of all deals redeemed by wallet users across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RedemptionsTable redemptions={redemptions} />
        </CardContent>
      </Card>
    </div>
  );
}
