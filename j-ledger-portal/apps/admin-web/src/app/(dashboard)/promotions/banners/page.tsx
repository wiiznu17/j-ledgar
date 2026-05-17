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
import { Plus, Loader2, Image as BannerIcon } from 'lucide-react';
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
    <div className="space-y-4 text-foreground">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-xl shadow-xs border border-border text-card-foreground">
        <div className="flex items-center gap-2">
          <BannerIcon className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-bold text-foreground">
            Promotions & Banners
          </span>
        </div>

        <Button
          onClick={handleCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-all active:scale-95 h-9 text-xs font-bold px-4"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add Banner
        </Button>
      </div>

      <Card className="border border-border bg-card text-card-foreground shadow-xs">
        <CardHeader>
          <CardTitle className="text-foreground">Active Banners</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
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
        <DialogContent className="max-w-xl bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingBanner ? 'Edit Banner' : 'Create New Banner'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
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
