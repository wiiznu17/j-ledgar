'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { promotionsRequester } from '@/lib/requesters';
import { toast } from 'sonner';
import { Loader2, Upload, X } from 'lucide-react';

interface BannerFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BannerForm({
  initialData,
  onSuccess,
  onCancel,
}: BannerFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    imageUrl: initialData?.imageUrl || '',
    actionPath: initialData?.actionPath || '',
    priority: initialData?.priority || 0,
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await promotionsRequester.uploadFile(file);
      setFormData((prev) => ({ ...prev, imageUrl: res.url }));
      toast.success('Banner image uploaded');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (initialData?.id) {
        await promotionsRequester.updateBanner(initialData.id, formData);
        toast.success('Banner updated successfully');
      } else {
        await promotionsRequester.createBanner(formData);
        toast.success('Banner created successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error('Failed to save banner');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-foreground bg-card">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-foreground">Banner Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g. Summer Special 2026"
          required
          className="bg-muted text-foreground border-border"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">Banner Image (Recommended 1200x600)</Label>
        <div className="flex flex-col gap-4">
          {formData.imageUrl ? (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border bg-muted shadow-inner">
              <img
                src={formData.imageUrl}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, imageUrl: '' })}
                className="absolute top-3 right-3 bg-card/90 text-card-foreground border border-border p-2.5 rounded-full shadow-lg hover:bg-card transition-all hover:scale-110 active:scale-95"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <label className="w-full aspect-video flex flex-col items-center justify-center border-2 border-dashed border-border rounded-[2rem] cursor-pointer hover:bg-muted transition-all group">
              {uploading ? (
                <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400 h-8 w-8" />
              ) : (
                <>
                  <Upload size={32} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground mt-2 font-medium">
                    Click to upload banner image
                  </span>
                </>
              )}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </label>
          )}
          <Input
            placeholder="Or paste direct image URL"
            value={formData.imageUrl}
            onChange={(e) =>
              setFormData({ ...formData, imageUrl: e.target.value })
            }
            className="bg-muted text-foreground border-border"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="action" className="text-foreground">Action Path (Deep Link)</Label>
          <Input
            id="action"
            value={formData.actionPath}
            onChange={(e) =>
              setFormData({ ...formData, actionPath: e.target.value })
            }
            placeholder="e.g. /(tabs)/deals"
            required
            className="bg-muted text-foreground border-border"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority" className="text-foreground">Priority (Higher shows first)</Label>
          <Input
            id="priority"
            type="number"
            value={formData.priority}
            onChange={(e) =>
              setFormData({ ...formData, priority: parseInt(e.target.value) })
            }
            required
            className="bg-muted text-foreground border-border"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="rounded-xl text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 shadow-xs"
          disabled={loading || uploading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData?.id ? 'Update Banner' : 'Publish Banner'}
        </Button>
      </div>
    </form>
  );
}
