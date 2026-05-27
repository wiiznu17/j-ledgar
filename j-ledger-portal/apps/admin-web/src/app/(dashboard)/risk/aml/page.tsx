'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { adminApi } from '@/lib/admin-api';
import {
  Search,
  RotateCcw,
  AlertTriangle,
  FileText,
  User,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  X,
  Copy,
  Check,
  Building,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  FilterSearchInput,
  FilterSelect,
  FilterActions,
  FilterLabel,
} from '@/components/common/FilterElements';
import { TablePagination } from '@/components/common/TablePagination';

export default function AMLPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  // Filter Inputs (Temporary states)
  const [userIdSearch, setUserIdSearch] = useState('');
  const [statusInput, setStatusInput] = useState('ALL');
  const [typeInput, setTypeInput] = useState('ALL');
  const [minRiskInput, setMinRiskInput] = useState('');
  const [maxRiskInput, setMaxRiskInput] = useState('');

  // Applied Filters (Used for API calls)
  const [appliedUserId, setAppliedUserId] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('ALL');
  const [appliedType, setAppliedType] = useState('ALL');
  const [appliedMinRisk, setAppliedMinRisk] = useState('');
  const [appliedMaxRisk, setAppliedMaxRisk] = useState('');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success('Copied Target ID to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.aml.findAll({
        page,
        limit,
        userId: appliedUserId || undefined,
        status: appliedStatus !== 'ALL' ? appliedStatus : undefined,
        activityType: appliedType !== 'ALL' ? appliedType : undefined,
        minRiskScore: appliedMinRisk ? parseInt(appliedMinRisk) : undefined,
        maxRiskScore: appliedMaxRisk ? parseInt(appliedMaxRisk) : undefined,
      });

      const safeData = Array.isArray(response?.data) ? response.data : [];
      const safePagination = response?.pagination ?? {
        total: safeData.length,
        totalPages: 1,
      };

      setActivities(safeData);
      setTotalPages(safePagination.totalPages || 1);
      setTotal(safePagination.total || safeData.length);
    } catch (error) {
      console.error('[AML_PAGE] Fetch error:', error);
      toast.error('Failed to load suspicious activities from database');
    } finally {
      setLoading(false);
    }
  }, [page, limit, appliedUserId, appliedStatus, appliedType, appliedMinRisk, appliedMaxRisk]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedUserId(userIdSearch);
    setAppliedStatus(statusInput);
    setAppliedType(typeInput);
    setAppliedMinRisk(minRiskInput);
    setAppliedMaxRisk(maxRiskInput);
    setPage(1);
  };

  const handleReset = () => {
    setUserIdSearch('');
    setStatusInput('ALL');
    setTypeInput('ALL');
    setMinRiskInput('');
    setMaxRiskInput('');

    setAppliedUserId('');
    setAppliedStatus('ALL');
    setAppliedType('ALL');
    setAppliedMinRisk('');
    setAppliedMaxRisk('');
    setPage(1);
  };

  const handleUpdateStatus = async (activityId: string, newStatus: string) => {
    setIsReviewing(true);
    try {
      await adminApi.aml.updateStatus(activityId, {
        status: newStatus,
        notes: reviewNotes,
      });
      toast.success(`Status successfully updated to ${newStatus}`);
      setReviewNotes('');
      setSelectedActivity(null);
      fetchActivities();
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('Failed to update activity compliance status');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleReportToAMLO = async (activityId: string) => {
    setIsReporting(true);
    try {
      await adminApi.aml.reportToAMLO(activityId, { reportDetails });
      toast.success('Officially reported suspicious record to AMLO');
      setReportDetails('');
      setSelectedActivity(null);
      fetchActivities();
    } catch (error) {
      console.error('Report to AMLO error:', error);
      toast.error('Failed to dispatch report to AMLO gateway');
    } finally {
      setIsReporting(false);
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 75) return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    if (score >= 50) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  };

  const getStatusBadge = (stat: string) => {
    switch (stat) {
      case 'CONFIRMED_LEGITIMATE':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-none font-bold">
            LEGITIMATE
          </Badge>
        );
      case 'UNDER_REVIEW':
        return (
          <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 border-none font-bold">
            UNDER REVIEW
          </Badge>
        );
      case 'CONFIRMED_SUSPICIOUS':
        return (
          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border-none font-bold">
            SUSPICIOUS
          </Badge>
        );
      case 'REPORTED_TO_AMLO':
        return (
          <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 border-none font-bold">
            AMLO REPORTED
          </Badge>
        );
      case 'FLAGGED':
      default:
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border-none font-bold">
            FLAGGED
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 pb-10 text-foreground">
      <Card className="border-none shadow-xs overflow-hidden bg-card text-card-foreground">
        {/* Advanced Filter Toolbar */}
        <div className="p-4 bg-card border-b border-border">
          <form
            onSubmit={handleApplyFilter}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end bg-card text-foreground"
          >
            <FilterSearchInput
              label="User ID"
              placeholder="Search by UUID..."
              value={userIdSearch}
              onChange={(e) => setUserIdSearch(e.target.value)}
            />

            <FilterSelect
              label="AMLO Status"
              value={statusInput}
              onValueChange={setStatusInput}
              options={[
                { label: 'All Statuses', value: 'ALL' },
                { label: 'Flagged', value: 'FLAGGED' },
                { label: 'Under Review', value: 'UNDER_REVIEW' },
                { label: 'Suspicious', value: 'CONFIRMED_SUSPICIOUS' },
                { label: 'Legitimate', value: 'CONFIRMED_LEGITIMATE' },
                { label: 'AMLO Reported', value: 'REPORTED_TO_AMLO' },
              ]}
            />

            <FilterSelect
              label="Activity Type"
              value={typeInput}
              onValueChange={setTypeInput}
              options={[
                { label: 'All Types', value: 'ALL' },
                { label: 'Large Transaction', value: 'LARGE_TRANSACTION' },
                { label: 'High Frequency', value: 'HIGH_FREQUENCY' },
                { label: 'Round Number', value: 'ROUND_NUMBER' },
                { label: 'Rapid Movement', value: 'RAPID_MOVEMENT' },
                { label: 'Multiple Recipients', value: 'MULTIPLE_RECIPIENTS' },
                { label: 'Structuring', value: 'STRUCTURING' },
                { label: 'Unusual Pattern', value: 'UNUSUAL_PATTERN' },
              ]}
            />

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <FilterLabel>Min Score</FilterLabel>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={minRiskInput}
                  onChange={(e) => setMinRiskInput(e.target.value)}
                  placeholder="0"
                  className="h-10 text-xs border-slate-200 focus:ring-indigo-500 rounded-lg bg-white dark:bg-zinc-950 shadow-sm font-medium"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <FilterLabel>Max Score</FilterLabel>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={maxRiskInput}
                  onChange={(e) => setMaxRiskInput(e.target.value)}
                  placeholder="100"
                  className="h-10 text-xs border-slate-200 focus:ring-indigo-500 rounded-lg bg-white dark:bg-zinc-950 shadow-sm font-medium"
                />
              </div>
            </div>

            <FilterActions
              searchLabel="Search"
              isLoading={loading}
              onReset={handleReset}
            />
          </form>
        </div>

        {/* Suspicious Activities Table */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[60px] text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-6">
                    No.
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Activity Type
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Target Owner (User ID)
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">
                    Risk Score
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">
                    Status
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Logged Date
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right pr-6">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse border-border">
                      <TableCell colSpan={7} className="h-16 bg-muted/20" />
                    </TableRow>
                  ))
                ) : activities.length > 0 ? (
                  activities.map((activity, index) => (
                    <TableRow
                      key={activity.id}
                      className="border-border hover:bg-muted/50 transition-colors group"
                    >
                      <TableCell className="pl-6 text-xs font-bold text-muted-foreground tabular-nums">
                        {(page - 1) * limit + index + 1}
                      </TableCell>
                      <TableCell className="font-bold text-xs text-foreground">
                        <span className="bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg">
                          {activity.activityType.replace(/_/g, ' ')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 group/id">
                          <span
                            className="text-xs font-mono text-muted-foreground truncate w-28"
                            title={activity.userId}
                          >
                            {activity.userId}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(activity.userId);
                            }}
                            className="p-1 rounded-md hover:bg-muted text-muted-foreground/40 hover:text-foreground opacity-0 group-hover/id:opacity-100 transition-all focus:opacity-100 outline-none"
                            title="Copy User ID"
                          >
                            {copiedId === activity.userId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={cn(
                            'rounded-lg px-2.5 py-0.5 text-[10px] font-bold font-mono tracking-tight border',
                            getRiskScoreColor(activity.riskScore)
                          )}
                        >
                          {activity.riskScore} / 100
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(activity.status)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleDateString()}{' '}
                        {new Date(activity.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Dialog>
                          <DialogTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedActivity(activity);
                                  setReviewNotes('');
                                  setReportDetails('');
                                }}
                                className="h-8 rounded-xl bg-muted hover:bg-indigo-600 hover:text-white text-foreground text-[10px] font-bold active:scale-95 transition-all px-4"
                              >
                                Review Account
                              </Button>
                            }
                          />
                          <DialogContent className="max-w-xl border-border bg-card shadow-2xl rounded-[2rem] overflow-hidden p-6 max-h-[85vh] overflow-y-auto">
                            <DialogHeader className="border-b border-border/50 pb-4 flex flex-row items-center gap-3">
                              <div className="p-2.5 bg-amber-500/10 rounded-2xl">
                                <AlertTriangle className="w-6 h-6 text-amber-500" />
                              </div>
                              <div className="flex flex-col text-left">
                                <DialogTitle className="text-base font-black text-foreground">
                                  AML Compliance Investigation
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                  Review flagged activity and report details to regulatory gateways.
                                </DialogDescription>
                              </div>
                            </DialogHeader>

                            {selectedActivity && (
                              <div className="space-y-5 pt-4">
                                {/* Profile overview */}
                                <div className="grid grid-cols-2 gap-4 bg-muted/30 dark:bg-muted/10 p-4 rounded-2xl border border-border/40 text-xs">
                                  <div>
                                    <span className="font-bold text-muted-foreground uppercase tracking-widest text-[9px] block">
                                      Flagged Pattern
                                    </span>
                                    <span className="font-black text-foreground mt-1 block">
                                      {selectedActivity.activityType.replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-bold text-muted-foreground uppercase tracking-widest text-[9px] block">
                                      Target User ID
                                    </span>
                                    <span className="font-mono text-foreground mt-1 block select-all">
                                      {selectedActivity.userId}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-bold text-muted-foreground uppercase tracking-widest text-[9px] block">
                                      Risk Assessment
                                    </span>
                                    <span className="font-black text-rose-500 dark:text-rose-400 mt-1 block">
                                      {selectedActivity.riskScore} / 100 Risk Score
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-bold text-muted-foreground uppercase tracking-widest text-[9px] block">
                                      Trigger Event Date
                                    </span>
                                    <span className="font-medium text-foreground mt-1 block">
                                      {new Date(selectedActivity.createdAt).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="col-span-2 border-t border-border/40 pt-2.5 mt-1">
                                    <span className="font-bold text-muted-foreground uppercase tracking-widest text-[9px] block">
                                      Initial Detection Details
                                    </span>
                                    <p className="text-muted-foreground mt-1 leading-relaxed text-[11px]">
                                      {selectedActivity.description || 'No detailed log description provided by Spring-Core pipeline.'}
                                    </p>
                                  </div>
                                </div>

                                {/* Flow 1: PENDING/FLAGGED/UNDER_REVIEW Compliance decisions */}
                                {(selectedActivity.status === 'FLAGGED' || selectedActivity.status === 'UNDER_REVIEW') && (
                                  <div className="space-y-3.5 border-t border-border/40 pt-4">
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-black text-xs uppercase tracking-wider text-foreground">
                                        Compliance Action Console
                                      </h4>
                                      {selectedActivity.status === 'FLAGGED' && (
                                        <Button
                                          size="sm"
                                          onClick={() => handleUpdateStatus(selectedActivity.id, 'UNDER_REVIEW')}
                                          disabled={isReviewing}
                                          className="h-7 text-[10px] font-bold rounded-lg bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20"
                                        >
                                          <RefreshCw className="w-3 h-3 mr-1" />
                                          Start Auditing
                                        </Button>
                                      )}
                                    </div>
                                    <div className="space-y-2">
                                      <FilterLabel>Auditor Review Logs / Resolution Comments</FilterLabel>
                                      <textarea
                                        id="reviewNotes"
                                        value={reviewNotes}
                                        onChange={(e) => setReviewNotes(e.target.value)}
                                        placeholder="Add notes about your money laundering check, source of funds, structuring evidence, or false positive resolution details..."
                                        rows={3}
                                        className="flex w-full rounded-xl border border-input bg-card px-3 py-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 font-medium"
                                      />
                                    </div>
                                    <div className="flex gap-3 pt-1">
                                      <Button
                                        onClick={() => handleUpdateStatus(selectedActivity.id, 'CONFIRMED_LEGITIMATE')}
                                        disabled={isReviewing || !reviewNotes.trim()}
                                        className="flex-1 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 h-10 shadow-md shadow-emerald-600/15"
                                      >
                                        <ShieldCheck className="w-4 h-4" />
                                        Approve as Legitimate
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        onClick={() => handleUpdateStatus(selectedActivity.id, 'CONFIRMED_SUSPICIOUS')}
                                        disabled={isReviewing || !reviewNotes.trim()}
                                        className="flex-1 py-2.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 h-10 shadow-md shadow-rose-600/15"
                                      >
                                        <ShieldAlert className="w-4 h-4" />
                                        Mark as Suspicious
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {/* Flow 2: CONFIRMED_SUSPICIOUS AMLO Reporting Form */}
                                {selectedActivity.status === 'CONFIRMED_SUSPICIOUS' && (
                                  <div className="space-y-3.5 border-t border-border/40 pt-4">
                                    <h4 className="font-black text-xs uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                                      <Building className="w-4 h-4" />
                                      AMLO Anti-Money Laundering Dispatch
                                    </h4>
                                    <div className="space-y-2">
                                      <FilterLabel>Official Report Narrative Details (AMLO Submission)</FilterLabel>
                                      <textarea
                                        id="reportDetails"
                                        value={reportDetails}
                                        onChange={(e) => setReportDetails(e.target.value)}
                                        placeholder="Provide complete reporting audit breakdown, transfer patterns, cash-out points, tax evasive indicators, or layering traces for the AMLO legal gateway..."
                                        rows={4}
                                        className="flex w-full rounded-xl border border-input bg-card px-3 py-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 font-medium"
                                      />
                                    </div>
                                    <Button
                                      onClick={() => handleReportToAMLO(selectedActivity.id)}
                                      disabled={isReporting || !reportDetails.trim()}
                                      className="w-full py-2.5 rounded-xl font-bold bg-purple-600 hover:bg-purple-700 text-white text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 h-10 shadow-md shadow-purple-600/15"
                                    >
                                      <FileText className="w-4 h-4" />
                                      {isReporting ? 'Reporting to AMLO Gateway...' : 'Submit Report to AMLO'}
                                    </Button>
                                  </div>
                                )}

                                {/* Flow 3: Already reported / confirmed legitimate states */}
                                {selectedActivity.status === 'REPORTED_TO_AMLO' && (
                                  <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-start gap-3 text-purple-600 dark:text-purple-400">
                                    <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <div className="text-xs">
                                      <h5 className="font-bold text-purple-700 dark:text-purple-300">AMLO Report Lodged</h5>
                                      <p className="mt-1 leading-relaxed opacity-90">
                                        This suspicious activity record was officially verified, logged, and successfully dispatched to the Anti-Money Laundering Office (AMLO) regulatory gateway. No further administrative action is required.
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {selectedActivity.status === 'CONFIRMED_LEGITIMATE' && (
                                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3 text-emerald-600 dark:text-emerald-400">
                                    <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <div className="text-xs">
                                      <h5 className="font-bold text-emerald-700 dark:text-emerald-300">Marked as Legitimate</h5>
                                      <p className="mt-1 leading-relaxed opacity-90">
                                        This transaction alert has been reviewed in full by a compliance auditor and was determined to be legitimate. The flag has been resolved as a false positive.
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <AlertTriangle className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-sm font-medium">No suspicious activities found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            onPageChange={setPage}
            limit={limit}
            onLimitChange={setLimit}
            isLoading={loading}
            itemName="activities"
          />
        </CardContent>
      </Card>
    </div>
  );
}
