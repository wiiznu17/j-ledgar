'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { promotionsRequester } from '@/lib/requesters';
import { DealsTable } from '@/components/promotions/DealsTable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DealForm } from '@/components/promotions/DealForm';

export default function DealsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<any>(null);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const data = await promotionsRequester.getDeals();
      setDeals(data);
    } catch (error) {
      console.error('[DEALS_PAGE] Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const handleCreate = () => {
    setEditingDeal(null);
    setIsModalOpen(true);
  };

  const handleEdit = (deal: any) => {
    setEditingDeal(deal);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    fetchDeals();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#2D3748]">Deals & Rewards</h2>
          <p className="text-muted-foreground mt-1">Manage points-based rewards and promotional offers.</p>
        </div>
        <Button 
          onClick={handleCreate}
          className="bg-[#f48fb1] hover:bg-[#f06292] text-white rounded-xl shadow-md shadow-pink-100 transition-all active:scale-95"
        >
          <Plus className="mr-2 h-4 w-4" /> New Deal
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Active Inventory</CardTitle>
          <CardDescription>
            Monitor stock levels and point requirements for all active deals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-pink-300" />
            </div>
          ) : (
            <DealsTable deals={deals} onEdit={handleEdit} onRefresh={fetchDeals} />
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDeal ? 'Edit Deal' : 'Create New Deal'}</DialogTitle>
            <DialogDescription>
              Fill in the details below to publish a reward offer to the wallet app.
            </DialogDescription>
          </DialogHeader>
          <DealForm 
            initialData={editingDeal} 
            onSuccess={handleSuccess} 
            onCancel={() => setIsModalOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
