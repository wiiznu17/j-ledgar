'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Key, 
  Copy, 
  CheckCircle2, 
  AlertTriangle, 
  Smartphone, 
  Loader2,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { merchantRequester } from '@/lib/requesters';

interface CreateTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchantId: string;
  merchantName: string;
  onSuccess: () => void;
}

export function CreateTerminalModal({ 
  isOpen, 
  onClose, 
  merchantId, 
  merchantName,
  onSuccess 
}: CreateTerminalModalProps) {
  const [loading, setLoading] = useState(false);
  const [createdTerminal, setCreatedTerminal] = useState<any>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [hardwareId, setHardwareId] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await merchantRequester.createTerminal(merchantId, {
        name,
        hardwareId: hardwareId || undefined,
      });
      setCreatedTerminal(response);
      onSuccess();
      toast.success('Terminal created successfully');
    } catch (error) {
      console.error('Failed to create terminal', error);
      toast.error('Failed to create terminal');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleClose = () => {
    setCreatedTerminal(null);
    setName('');
    setHardwareId('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[450px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
        {!createdTerminal ? (
          <form onSubmit={handleCreate}>
            <div className="p-8 pb-4">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 rounded-xl">
                    <Smartphone className="w-6 h-6 text-indigo-600" />
                  </div>
                  New Terminal
                </DialogTitle>
                <DialogDescription className="text-slate-500 pt-2 text-sm leading-relaxed">
                  Provision a new terminal for <span className="font-bold text-slate-700">{merchantName}</span>. 
                  This will generate a unique HMAC secret for authentication.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Terminal Name / Location</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Front Desk, Cashier 1"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hardware" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Hardware ID (Optional)</Label>
                  <Input
                    id="hardware"
                    placeholder="e.g. SN-9988-77"
                    value={hardwareId}
                    onChange={(e) => setHardwareId(e.target.value)}
                    className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:ring-indigo-500 font-mono text-sm"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="p-8 pt-0 flex gap-3">
              <Button type="button" variant="ghost" onClick={handleClose} className="rounded-xl font-bold flex-1 h-12">Cancel</Button>
              <Button type="submit" disabled={loading} className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 flex-1 h-12 shadow-lg shadow-indigo-100">
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Provision Terminal
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="p-10">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-500 animate-in zoom-in-50 duration-500">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Provisioning Complete</h3>
                <p className="text-sm text-slate-500 mt-2">
                  Terminal <span className="font-bold text-slate-700">{createdTerminal.name}</span> is ready. 
                  Save the secret key below immediately.
                </p>
              </div>

              <div className="w-full space-y-4">
                <div className="p-6 bg-slate-900 rounded-[2rem] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4">
                    <Key className="w-12 h-12 text-white/5 -rotate-12" />
                  </div>
                  <Label className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] block mb-3 text-left">HMAC Secret Key (View Once)</Label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 font-mono text-xs text-white bg-white/5 p-3 rounded-xl border border-white/10 break-all select-all">
                      {createdTerminal.secretKey}
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => copyToClipboard(createdTerminal.secretKey)}
                      className="h-10 w-10 text-white/50 hover:text-white hover:bg-white/10"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 text-left">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                  <p className="text-[11px] leading-relaxed text-amber-700">
                    <strong className="font-black uppercase tracking-tight">Important:</strong> This secret will NOT be shown again. If lost, you must rotate the key or recreate the terminal.
                  </p>
                </div>
              </div>

              <Button onClick={handleClose} className="w-full h-12 rounded-xl font-black uppercase tracking-wider bg-slate-900 hover:bg-slate-800">
                Done, I've Saved the Key
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
