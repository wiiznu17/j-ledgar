'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { promotionsRequester } from '@/lib/requesters';
import { BannersTable } from '@/components/promotions/BannersTable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BannerForm } from '@/components/promotions/BannerForm';

export default function BannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const data = await promotionsRequester.getBanners();
      setBanners(data);
    } catch (error) {
      console.error('[BANNERS_PAGE] Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleCreate = () => {
    setEditingBanner(null);
    setIsModalOpen(true);
  };

  const handleEdit = (banner: any) => {
    setEditingBanner(banner);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    fetchBanners();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#2D3748]">
            Home Banners
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage promotional carousels shown on the mobile app home screen.
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-pink-500 hover:bg-pink-600 text-white rounded-lg shadow-md shadow-pink-100 transition-all active:scale-95"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Banner
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Active Banners</CardTitle>
          <CardDescription>
            These banners are currently visible to users. Higher priority items
            appear first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-pink-300" />
            </div>
          ) : (
            <BannersTable
              banners={banners}
              onEdit={handleEdit}
              onRefresh={fetchBanners}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? 'Edit Banner' : 'Create New Banner'}
            </DialogTitle>
            <DialogDescription>
              This banner will appear in the home screen carousel for all users.
            </DialogDescription>
          </DialogHeader>
          <BannerForm
            initialData={editingBanner}
            onSuccess={handleSuccess}
            onCancel={() => setIsModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
