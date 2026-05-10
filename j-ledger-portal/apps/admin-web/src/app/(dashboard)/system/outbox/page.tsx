'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  FilterSearchInput,
  FilterSelect,
  FilterActions,
} from '@/components/common/FilterElements';
import { systemRequester, OutboxEvent } from '@/lib/requesters/systemRequester';
import {
  Radio,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Terminal,
  Search,
  RotateCcw,
  Box,
  Share2,
  Cpu,
  History,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';

export default function SystemOutboxPage() {
  const [data, setData] = useState<OutboxEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<OutboxEvent | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Temporary states for filters before applying
  const [tempStatus, setTempStatus] = useState<string>('ALL');
  const [tempType, setTempType] = useState<string>('ALL');

  const fetchOutbox = async (
    statusOverride?: string,
    typeOverride?: string,
  ) => {
    try {
      setLoading(true);
      const filters: any = {};
      const status = statusOverride || filterStatus;
      const type = typeOverride || filterType;

      if (status !== 'ALL') filters.status = status;
      if (type !== 'ALL') filters.eventType = type;

      const response = await systemRequester.getOutbox(filters);
      setData(
        Array.isArray(response) ? response : (response as any).data || [],
      );
    } catch (error) {
      console.error('[OUTBOX] Fetch error:', error);
      toast.error('Service temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = () => {
    setFilterStatus(tempStatus);
    setFilterType(tempType);
    fetchOutbox(tempStatus, tempType);
  };

  const handleClearFilter = () => {
    setTempStatus('ALL');
    setTempType('ALL');
    setFilterStatus('ALL');
    setFilterType('ALL');
    fetchOutbox('ALL', 'ALL');
  };

  useEffect(() => {
    fetchOutbox();
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
      case 'PROCESSED':
        return {
          color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
          dot: 'bg-emerald-500',
          icon: <CheckCircle2 className="w-3 h-3" />,
        };
      case 'FAILED':
        return {
          color: 'bg-rose-50 text-rose-600 border-rose-100',
          dot: 'bg-rose-500',
          icon: <AlertCircle className="w-3 h-3" />,
        };
      default:
        return {
          color: 'bg-amber-50 text-amber-600 border-amber-100',
          dot: 'bg-amber-500',
          icon: <Clock className="w-3 h-3" />,
        };
    }
  };

  const stats = {
    total: data.length,
    processed: data.filter(
      (e) =>
        e.status.toUpperCase() === 'COMPLETED' ||
        e.status.toUpperCase() === 'PROCESSED',
    ).length,
    failed: data.filter((e) => e.status.toUpperCase() === 'FAILED').length,
    pending: data.filter((e) => e.status.toUpperCase() === 'PENDING').length,
  };

  const handleRetry = async (id: string) => {
    try {
      await systemRequester.retryOutbox(id);
      toast.success('Event reset to PENDING. Processing will resume shortly.');
      fetchOutbox();
    } catch (error) {
      console.error('[OUTBOX] Retry error:', error);
      toast.error('Failed to trigger retry. Please try again.');
    }
  };

  return (
    <div className="space-y-4 pb-10">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              System Outbox
            </h1>
          </div>
          <p className="text-sm text-slate-500 font-medium ml-1">
            Transactional event logs and Kafka integration stream.
          </p>
        </div>
      </div>

      {/* Stats Snapshots */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Events',
            value: stats.total,
            icon: Activity,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
          },
          {
            label: 'Processed',
            value: stats.processed,
            icon: CheckCircle2,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Pending',
            value: stats.pending,
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            label: 'Failed',
            value: stats.failed,
            icon: AlertCircle,
            color: 'text-rose-600',
            bg: 'bg-rose-50',
          },
        ].map((s, i) => (
          <Card
            key={i}
            className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden"
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2.5 ${s.bg} ${s.color} rounded-xl`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                  {s.label}
                </p>
                <p className="text-xl font-black text-slate-800 leading-none">
                  {s.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Table Container */}
      <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden bg-white">
        {/* Filter Toolbar */}
        <div className="p-3 bg-white border-b border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <FilterSelect
              label="Event Status"
              value={tempStatus}
              onValueChange={setTempStatus}
              options={[
                { label: 'ALL STATUS', value: 'ALL' },
                { label: 'PENDING', value: 'PENDING' },
                {
                  label: 'PROCESSED',
                  value: 'PROCESSED',
                  className: 'text-emerald-600',
                },
                {
                  label: 'FAILED',
                  value: 'FAILED',
                  className: 'text-rose-600',
                },
              ]}
            />

            <FilterSelect
              label="Event Type"
              value={tempType}
              onValueChange={setTempType}
              options={[
                { label: 'ALL TYPES', value: 'ALL' },
                { label: 'TRANSACTIONS', value: 'TRANSACTION' },
                { label: 'SYSTEM EVENTS', value: 'SYSTEM' },
              ]}
            />

            <div className="hidden md:block md:col-span-1"></div>

            <FilterActions
              searchLabel="Search"
              isLoading={loading}
              onReset={handleClearFilter}
              className="md:col-span-2"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                <th className="px-6 py-2.5 border-r border-slate-200/60">
                  Registration Time
                </th>
                <th className="px-6 py-2.5 text-center border-r border-slate-200/60">
                  Status
                </th>
                <th className="px-6 py-2.5 text-center border-r border-slate-200/60">
                  Event Type
                </th>
                <th className="px-6 py-2.5 text-center border-r border-slate-200/60">
                  Processing Details
                </th>
                <th className="px-6 py-2.5 text-center">Intel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && data.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8 h-12 bg-slate-50/10" />
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-400 font-medium"
                  >
                    No outbox events found in the stream.
                  </td>
                </tr>
              ) : (
                data.map((event) => {
                  const config = getStatusConfig(event.status);
                  return (
                    <tr
                      key={event.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-2 border-r border-slate-100">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700">
                            {format(
                              new Date(event.createdAt),
                              'MMM d, HH:mm:ss',
                            )}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono tracking-tighter italic">
                            ID: {event.id.split('-')[0]}...
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-2 border-r border-slate-100">
                        <div className="flex items-center justify-center gap-2">
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
                          />
                          <span
                            className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${config.color}`}
                          >
                            {event.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-2 border-r border-slate-100 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {event.eventType}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-2 border-r border-slate-100 text-center text-xs">
                        <div className="flex flex-col items-center">
                          {event.updatedAt &&
                          (event.status.toUpperCase() === 'COMPLETED' ||
                            event.status.toUpperCase() === 'PROCESSED') ? (
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {format(new Date(event.updatedAt), 'HH:mm:ss')}
                            </span>
                          ) : (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-[10px] font-bold text-slate-400 italic">
                                Waiting...
                              </span>
                              {event.retryCount > 0 && (
                                <span className="text-[8px] font-black text-rose-400 uppercase tracking-tighter bg-rose-50 px-1 rounded">
                                  Retries: {event.retryCount}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-2 text-center">
                        <Dialog>
                          <DialogTrigger
                            render={
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedEvent(event)}
                                className="h-7 px-3 rounded-lg text-[9px] font-bold border-slate-200 hover:bg-slate-50 hover:border-indigo-200 transition-all active:scale-95 group/btn"
                              >
                                Inspect
                                <ChevronRight className="w-3 h-3 ml-1 text-slate-300 group-hover/btn:text-indigo-400 transition-colors" />
                              </Button>
                            }
                          />
                          <DialogContent className="sm:max-w-3xl bg-white rounded-2xl border-0 shadow-2xl overflow-hidden">
                            <DialogHeader className="bg-slate-50/50 p-6 border-b border-slate-100">
                              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Terminal className="w-5 h-5 text-indigo-600" />
                                Event Intel: {event.eventType}
                              </DialogTitle>
                              <DialogDescription className="text-xs">
                                Technical trace of the outbox event and Kafka
                                payload.
                              </DialogDescription>
                            </DialogHeader>
                            {selectedEvent && (
                              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
                                  <div className="space-y-4">
                                    <div>
                                      <p className="font-black text-slate-400 uppercase tracking-widest text-[9px] mb-1">
                                        Event Identification
                                      </p>
                                      <div className="space-y-1.5 font-bold">
                                        <p className="flex justify-between border-b border-slate-50 pb-1 text-slate-500">
                                          <span>Internal ID:</span>
                                          <span className="font-mono text-[10px]">
                                            {selectedEvent.id}
                                          </span>
                                        </p>
                                        <p className="flex justify-between border-b border-slate-50 pb-1 text-slate-500">
                                          <span>Type:</span>
                                          <span className="uppercase text-indigo-600">
                                            {selectedEvent.eventType}
                                          </span>
                                        </p>
                                        <p className="flex justify-between border-b border-slate-50 pb-1 text-slate-500">
                                          <span>Created:</span>
                                          <span>
                                            {format(
                                              new Date(selectedEvent.createdAt),
                                              'PPP p',
                                            )}
                                          </span>
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-4">
                                    <div>
                                      <p className="font-black text-slate-400 uppercase tracking-widest text-[9px] mb-1">
                                        Processing Status
                                      </p>
                                      <div className="space-y-1.5 font-bold">
                                        <p className="flex justify-between border-b border-slate-50 pb-1 text-slate-500">
                                          <span>Status:</span>
                                          <span
                                            className={`uppercase ${config.color} px-2 rounded-sm border`}
                                          >
                                            {selectedEvent.status}
                                          </span>
                                        </p>
                                        <p className="flex justify-between border-b border-slate-50 pb-1 text-slate-500">
                                          <span>Retry Count:</span>
                                          <span className="font-mono text-indigo-600">
                                            {selectedEvent.retryCount}
                                          </span>
                                        </p>
                                        <p className="flex justify-between border-b border-slate-50 pb-1 text-slate-500">
                                          <span>Last Updated:</span>
                                          <span>
                                            {selectedEvent.updatedAt
                                              ? format(
                                                  new Date(
                                                    selectedEvent.updatedAt,
                                                  ),
                                                  'PPP p',
                                                )
                                              : '-'}
                                          </span>
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {selectedEvent.lastError && (
                                  <div className="space-y-2">
                                    <p className="font-black text-rose-500 uppercase tracking-widest text-[9px] ml-1 flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3" />
                                      Failure Trace
                                    </p>
                                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                                      <p className="text-[10px] text-rose-600 font-mono leading-relaxed italic">
                                        {selectedEvent.lastError}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {selectedEvent.payload && (
                                  <div className="space-y-2">
                                    <p className="font-black text-slate-400 uppercase tracking-widest text-[9px] ml-1 flex items-center gap-1">
                                      <Share2 className="w-3 h-3" />
                                      Kafka Message Payload
                                    </p>
                                    <div className="p-4 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-inner">
                                      <pre className="text-[10px] text-emerald-400 font-mono overflow-x-auto custom-scrollbar leading-relaxed">
                                        {JSON.stringify(
                                          selectedEvent.payload,
                                          null,
                                          2,
                                        )}
                                      </pre>
                                    </div>
                                  </div>
                                )}

                                {selectedEvent.metadata && (
                                  <div className="space-y-2">
                                    <p className="font-black text-slate-400 uppercase tracking-widest text-[9px] ml-1 flex items-center gap-1">
                                      <Cpu className="w-3 h-3" />
                                      Context Metadata
                                    </p>
                                    <div className="p-4 bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-inner">
                                      <pre className="text-[10px] text-indigo-300 font-mono overflow-x-auto custom-scrollbar leading-relaxed">
                                        {JSON.stringify(
                                          selectedEvent.metadata,
                                          null,
                                          2,
                                        )}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3">
                              <Button
                                variant="outline"
                                onClick={() => setSelectedEvent(null)}
                                className="h-9 px-4 rounded-xl text-xs font-bold border-slate-200 bg-white"
                              >
                                Close
                              </Button>
                              <Button
                                onClick={() =>
                                  selectedEvent && handleRetry(selectedEvent.id)
                                }
                                className="h-9 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 transition-all active:scale-95"
                              >
                                <RotateCcw className="w-3.5 h-3.5 mr-2" />
                                Re-process Event
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination Placeholder or Footer */}
      <div className="flex items-center justify-between px-2 text-slate-400">
        <p className="text-[10px] font-bold uppercase tracking-widest">
          {data.length} Total Events in Stream
        </p>
        <div className="flex items-center gap-2">
          <History className="w-3 h-3" />
          <span className="text-[10px] font-medium italic">
            Streaming active...
          </span>
        </div>
      </div>
    </div>
  );
}
