'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { promotionsRequester } from '@/lib/requesters';
import { toast } from 'sonner';
import { Loader2, Upload, X } from 'lucide-react';

interface DealFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DealForm({ initialData, onSuccess, onCancel }: DealFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    pointsRequired: initialData?.pointsRequired || 0,
    stock: initialData?.stock || 0,
    remainingStock: initialData?.remainingStock || 0,
    imageUrl: initialData?.imageUrl || '',
    brandId: initialData?.brandId || '',
    categoryId: initialData?.categoryId || '',
    priority: initialData?.priority || 0,
    termsCondition: initialData?.termsCondition || '',
    limitPerUser: initialData?.limitPerUser || 1,
  });

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [b, c] = await Promise.all([
          promotionsRequester.getBrands(),
          promotionsRequester.getCategories(),
        ]);
        setBrands(b);
        setCategories(c);
      } catch (error) {
        toast.error('Failed to load metadata');
      }
    };
    fetchMeta();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await promotionsRequester.uploadFile(file);
      setFormData((prev) => ({ ...prev, imageUrl: res.url }));
      toast.success('Image uploaded successfully');
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
        await promotionsRequester.updateDeal(initialData.id, formData);
        toast.success('Deal updated successfully');
      } else {
        await promotionsRequester.createDeal({
          ...formData,
          remainingStock: formData.stock, // Initial sync
        });
        toast.success('Deal created successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error('Failed to save deal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Deal Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. 50% Starbucks Discount"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="points">Points Required</Label>
          <Input
            id="points"
            type="number"
            value={formData.pointsRequired}
            onChange={(e) => setFormData({ ...formData, pointsRequired: parseInt(e.target.value) })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Short Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief summary shown in the list"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Brand</Label>
          <Select
            value={formData.brandId}
            onValueChange={(value) => setFormData({ ...formData, brandId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Brand" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={formData.categoryId}
            onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stock">Initial Stock</Label>
          <Input
            id="stock"
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="limit">Limit per User</Label>
          <Input
            id="limit"
            type="number"
            value={formData.limitPerUser}
            onChange={(e) => setFormData({ ...formData, limitPerUser: parseInt(e.target.value) })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Priority (1-10)</Label>
          <Input
            id="priority"
            type="number"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Deal Image</Label>
        <div className="flex items-center gap-4">
          {formData.imageUrl ? (
            <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
              <img src={formData.imageUrl} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, imageUrl: '' })}
                className="absolute top-1 right-1 bg-white/80 p-1 rounded-full shadow-sm hover:bg-white"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
              {uploading ? (
                <Loader2 className="animate-spin text-muted-foreground" />
              ) : (
                <>
                  <Upload size={20} className="text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground mt-1">Upload</span>
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
          <div className="flex-1">
            <Input
              placeholder="Or paste direct image URL"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="terms">Terms & Conditions</Label>
        <Textarea
          id="terms"
          value={formData.termsCondition}
          onChange={(e) => setFormData({ ...formData, termsCondition: e.target.value })}
          placeholder="One rule per line..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-[#f48fb1] hover:bg-[#f06292] text-white"
          disabled={loading || uploading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData?.id ? 'Update Deal' : 'Create Deal'}
        </Button>
      </div>
    </form>
  );
}
