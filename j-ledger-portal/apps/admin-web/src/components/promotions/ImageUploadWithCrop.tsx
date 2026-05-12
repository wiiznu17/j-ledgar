'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/lib/utils/cropImage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ImageIcon, Loader2, Upload, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadWithCropProps {
  value: string;
  onChange: (url: string, file?: File) => void;
  aspect?: number;
  label: string;
  maxSizeMB?: number;
}

export function ImageUploadWithCrop({
  value,
  onChange,
  aspect = 1,
  label,
  maxSizeMB = 2,
}: ImageUploadWithCropProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file) return;

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Invalid file format. Please use JPG, PNG or WebP.');
        return;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`File is too large. Maximum size is ${maxSizeMB}MB.`);
        return;
      }

      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);
        setIsCropping(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!croppedBlob) throw new Error('Failed to crop image');

      const file = new File([croppedBlob], 'upload.jpg', { type: 'image/jpeg' });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        onChange(dataUrl, file);
        setIsCropping(false);
        setImageSrc(null);
        setIsProcessing(false);
      };
      reader.readAsDataURL(croppedBlob);
      
    } catch (error) {
      console.error('Crop error:', error);
      toast.error('Failed to process image');
      setIsProcessing(false);
    }
  };

  const triggerUpload = () => {
    document.getElementById(`img-upload-${label}`)?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</Label>
        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">
            {aspect === 1 ? '1:1 Ratio' : aspect === 16/9 ? '16:9 Banner' : `${aspect.toFixed(1)} Ratio`}
        </span>
      </div>
      
      <div className="relative group">
        <div 
            onClick={triggerUpload}
            className={`relative w-full rounded-[2.5rem] border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden flex items-center justify-center shadow-inner
                ${value 
                    ? 'border-transparent bg-slate-100' 
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 hover:border-blue-300'
                }`}
            style={{ aspectRatio: aspect }}
        >
          {value ? (
            <>
              <Image 
                src={value} 
                alt="Preview" 
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105" 
                unoptimized={value.startsWith('data:') || value.startsWith('blob:')}
              />
              {/* Hover Overlay for Existing Image */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center backdrop-blur-[2px]">
                 <div className="bg-white/20 p-4 rounded-full mb-3 backdrop-blur-md border border-white/30 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <Upload size={24} className="text-white" />
                 </div>
                 <span className="text-white text-[10px] font-black uppercase tracking-widest transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                    Click to Change
                 </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-[1.5rem] bg-white shadow-sm flex items-center justify-center text-slate-200 group-hover:text-blue-400 group-hover:scale-110 transition-all duration-300">
                    <ImageIcon size={32} />
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:hidden">No Media Selected</p>
                    <div className="hidden group-hover:flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-200 animate-in fade-in zoom-in duration-300">
                        <Plus size={14} /> Add Image
                    </div>
                </div>
            </div>
          )}
        </div>

        {/* Remove Button - only visible when there's an image */}
        {value && (
            <button 
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onChange('', undefined);
                }}
                className="absolute -top-2 -right-2 p-2 bg-white rounded-full shadow-xl border border-slate-100 text-slate-400 hover:text-red-500 transition-all hover:scale-110 active:scale-90 z-10"
            >
                <X size={16} />
            </button>
        )}
      </div>

      <input
        type="file"
        id={`img-upload-${label}`}
        className="hidden"
        accept="image/*"
        onChange={onFileChange}
      />

      {/* Cropping Dialog */}
      <Dialog open={isCropping} onOpenChange={setIsCropping}>
        <DialogContent className="sm:max-w-[700px] w-[95vw] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
          <div className="p-8 pb-0">
             <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">Perfect Your Image</DialogTitle>
             </DialogHeader>
          </div>
          
          <div className="p-8">
            <div className="relative h-[400px] w-full bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-white/10">
                {imageSrc && (
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspect}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                />
                )}
            </div>
            <div className="pt-8 px-2">
                <div className="flex items-center justify-between mb-3">
                     <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adjust Zoom</Label>
                     <div className="px-3 py-1 bg-blue-50 rounded-full text-[10px] font-black text-blue-600">
                        {(zoom * 100).toFixed(0)}%
                     </div>
                </div>
                <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
            </div>
          </div>
          
          <div className="p-8 bg-slate-50 border-t border-slate-100">
            <DialogFooter className="gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsCropping(false)} className="rounded-xl px-6 font-bold text-slate-400">Cancel</Button>
                <Button 
                    type="button"
                    onClick={handleConfirmCrop} 
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-2 rounded-xl px-10 h-11 font-bold shadow-lg shadow-blue-100 transition-all active:scale-95"
                >
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : 'Apply & Save'}
                </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
