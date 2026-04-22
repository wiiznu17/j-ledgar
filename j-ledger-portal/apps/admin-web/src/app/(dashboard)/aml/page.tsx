'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { adminApi } from '@/lib/admin-api';
import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Search, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function AMLPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  // Filters
  const [userId, setUserId] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [minRiskScore, setMinRiskScore] = useState('');
  const [maxRiskScore, setMaxRiskScore] = useState('');

  const limit = 50;

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.aml.findAll({
        page,
        limit,
        userId: userId || undefined,
        status: status || undefined,
        minRiskScore: minRiskScore ? parseInt(minRiskScore) : undefined,
        maxRiskScore: maxRiskScore ? parseInt(maxRiskScore) : undefined,
      });
      setActivities(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (error) {
      console.error('[AML_PAGE] Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [page, userId, status, minRiskScore, maxRiskScore]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleFilter = () => {
    setPage(1);
    fetchActivities();
  };

  const handleClearFilters = () => {
    setUserId('');
    setStatus(null);
    setMinRiskScore('');
    setMaxRiskScore('');
    setPage(1);
    fetchActivities();
  };

  const handleUpdateStatus = async (activityId: string, newStatus: string) => {
    setIsReviewing(true);
    try {
      await adminApi.aml.updateStatus(activityId, { status: newStatus, notes: reviewNotes });
      toast.success(`Status updated to ${newStatus}`);
      setReviewNotes('');
      setSelectedActivity(null);
      fetchActivities();
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('Failed to update status');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleReportToAMLO = async (activityId: string) => {
    setIsReporting(true);
    try {
      await adminApi.aml.reportToAMLO(activityId, { reportDetails });
      toast.success('Reported to AMLO successfully');
      setReportDetails('');
      setSelectedActivity(null);
      fetchActivities();
    } catch (error) {
      console.error('Report to AMLO error:', error);
      toast.error('Failed to report to AMLO');
    } finally {
      setIsReporting(false);
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 75) return 'bg-red-100 text-red-800';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusColor = (stat: string) => {
    switch (stat) {
      case 'REVIEWED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REPORTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-[#2D3748]">
          AML Suspicious Activity Monitor
        </h2>
      </div>

      {/* Filters */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user ID"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="PENDING">PENDING</SelectItem>
                  <SelectItem value="REVIEWED">REVIEWED</SelectItem>
                  <SelectItem value="REPORTED">REPORTED</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="minRiskScore">Min Risk Score</Label>
              <Input
                id="minRiskScore"
                type="number"
                min="0"
                max="100"
                value={minRiskScore}
                onChange={(e) => setMinRiskScore(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="maxRiskScore">Max Risk Score</Label>
              <Input
                id="maxRiskScore"
                type="number"
                min="0"
                max="100"
                value={maxRiskScore}
                onChange={(e) => setMaxRiskScore(e.target.value)}
                placeholder="100"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleFilter} className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Apply Filters
            </Button>
            <Button
              onClick={handleClearFilters}
              variant="outline"
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Suspicious Activities Table */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Suspicious Activities</CardTitle>
          <CardDescription>
            Monitor and review suspicious activities flagged by the AML detection system. Total:{' '}
            {total} records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 text-left font-medium">Activity Type</th>
                  <th className="p-4 text-left font-medium">User ID</th>
                  <th className="p-4 text-left font-medium">Risk Score</th>
                  <th className="p-4 text-left font-medium">Status</th>
                  <th className="p-4 text-left font-medium">Created</th>
                  <th className="p-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : activities.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No suspicious activities found
                    </td>
                  </tr>
                ) : (
                  activities.map((activity: any) => (
                    <tr key={activity.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">{activity.activityType}</td>
                      <td className="p-4 font-medium">{activity.userId}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRiskScoreColor(activity.riskScore)}`}
                        >
                          {activity.riskScore}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(activity.status)}`}
                        >
                          {activity.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <Dialog>
                          <DialogTrigger>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedActivity(activity)}
                            >
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                Review Suspicious Activity
                              </DialogTitle>
                              <DialogDescription>
                                Review and take action on this suspicious activity
                              </DialogDescription>
                            </DialogHeader>
                            {selectedActivity && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="font-semibold">Activity Type</Label>
                                    <p className="text-sm">{selectedActivity.activityType}</p>
                                  </div>
                                  <div>
                                    <Label className="font-semibold">User ID</Label>
                                    <p className="text-sm">{selectedActivity.userId}</p>
                                  </div>
                                  <div>
                                    <Label className="font-semibold">Risk Score</Label>
                                    <p className="text-sm">{selectedActivity.riskScore}</p>
                                  </div>
                                  <div>
                                    <Label className="font-semibold">Status</Label>
                                    <p className="text-sm">{selectedActivity.status}</p>
                                  </div>
                                  <div>
                                    <Label className="font-semibold">Created</Label>
                                    <p className="text-sm">
                                      {new Date(selectedActivity.createdAt).toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="font-semibold">Description</Label>
                                    <p className="text-sm">{selectedActivity.description}</p>
                                  </div>
                                </div>

                                {selectedActivity.status === 'PENDING' && (
                                  <>
                                    <div>
                                      <Label htmlFor="reviewNotes">Review Notes</Label>
                                      <textarea
                                        id="reviewNotes"
                                        value={reviewNotes}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                          setReviewNotes(e.target.value)
                                        }
                                        placeholder="Add notes about your review..."
                                        rows={3}
                                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() =>
                                          handleUpdateStatus(selectedActivity.id, 'REVIEWED')
                                        }
                                        disabled={isReviewing || !reviewNotes}
                                      >
                                        {isReviewing
                                          ? 'Marking as Reviewed...'
                                          : 'Mark as Reviewed'}
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        onClick={() =>
                                          handleUpdateStatus(selectedActivity.id, 'REPORTED')
                                        }
                                        disabled={isReviewing}
                                      >
                                        {isReviewing
                                          ? 'Marking as Reported...'
                                          : 'Mark as Reported'}
                                      </Button>
                                    </div>
                                  </>
                                )}

                                {selectedActivity.status === 'REVIEWED' && (
                                  <>
                                    <div>
                                      <Label htmlFor="reportDetails">Report Details for AMLO</Label>
                                      <textarea
                                        id="reportDetails"
                                        value={reportDetails}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                          setReportDetails(e.target.value)
                                        }
                                        placeholder="Provide details for the AMLO report..."
                                        rows={4}
                                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                      />
                                    </div>
                                    <Button
                                      onClick={() => handleReportToAMLO(selectedActivity.id)}
                                      disabled={isReporting || !reportDetails}
                                      variant="destructive"
                                    >
                                      {isReporting ? 'Reporting...' : 'Report to AMLO'}
                                    </Button>
                                  </>
                                )}

                                {selectedActivity.status === 'REPORTED' && (
                                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                                    <p className="text-sm text-yellow-800">
                                      This activity has already been reported to AMLO.
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({total} total records)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
