'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Smartphone, 
  Circle, 
  Settings, 
  RotateCcw, 
  Trash2, 
  Plus,
  Loader2
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Terminal {
  id: string;
  name: string;
  hardwareId: string;
  status: string;
  createdAt: string;
}

interface MerchantWithTerminals {
  id: string;
  name: string;
  terminals: Terminal[];
}

interface TerminalTableProps {
  merchants: MerchantWithTerminals[];
  loading: boolean;
  onCreateTerminal: (merchantId: string, merchantName: string) => void;
  onRotateSecret?: (terminalId: string) => void;
  isRotating?: boolean;
  isSME?: boolean;
}

export function TerminalTable({ merchants, loading, onCreateTerminal, onRotateSecret, isRotating, isSME }: TerminalTableProps) {
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-[2rem]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {merchants.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
          <Smartphone className="w-10 h-10 mb-2 opacity-20" />
          <p className="text-sm font-medium">No merchant branches found for this partner.</p>
        </div>
      ) : (
        merchants.map((merchant) => (
          <div key={merchant.id} className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm shadow-indigo-50">
                  {isSME ? (
                    <Smartphone className="w-5 h-5" />
                  ) : (
                    <Plus className="w-5 h-5 cursor-pointer hover:scale-110 transition-transform" onClick={() => onCreateTerminal(merchant.id, merchant.name)} />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{merchant.name}</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Branch ID: {merchant.id.substring(0, 8)}</p>
                </div>
              </div>
              {!isSME && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 rounded-lg border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-wider"
                  onClick={() => onCreateTerminal(merchant.id, merchant.name)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add Terminal
                </Button>
              )}
            </div>

            <div className="bg-white rounded-[2rem] ring-1 ring-slate-100 shadow-sm overflow-hidden border border-white">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="text-slate-400 font-black text-[10px] uppercase tracking-widest py-4 pl-6">Terminal Node</TableHead>
                    <TableHead className="text-slate-400 font-black text-[10px] uppercase tracking-widest py-4">Hardware ID</TableHead>
                    <TableHead className="text-slate-400 font-black text-[10px] uppercase tracking-widest py-4">Status</TableHead>
                    <TableHead className="text-slate-400 font-black text-[10px] uppercase tracking-widest py-4">Provisioned</TableHead>
                    <TableHead className="text-right py-4 pr-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {merchant.terminals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-slate-400 text-xs italic">
                        No active terminals configured for this branch.
                      </TableCell>
                    </TableRow>
                  ) : (
                    merchant.terminals.map((terminal) => (
                      <TableRow key={terminal.id} className="hover:bg-slate-50/30 border-slate-50 transition-colors">
                        <TableCell className="py-4 pl-6">
                          <div className="font-bold text-slate-800 text-sm">{terminal.name || 'Unnamed Terminal'}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{terminal.id}</div>
                        </TableCell>
                        <TableCell className="py-4">
                          <code className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase tracking-tight">
                            {terminal.hardwareId || 'NOT SET'}
                          </code>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border-none flex items-center gap-1.5 w-fit ${terminal.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            <Circle className={`w-2 h-2 fill-current ${terminal.status === 'ACTIVE' ? 'animate-pulse' : ''}`} />
                            {terminal.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 text-slate-500 text-[11px] font-medium">
                          {new Date(terminal.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="py-4 text-right pr-6">
                          <div className="flex justify-end gap-1">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                title="Rotate Secret Key"
                                onClick={() => onRotateSecret?.(terminal.id)}
                                disabled={isRotating}
                                className="h-8 w-8 p-0 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            >
                              {isRotating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
