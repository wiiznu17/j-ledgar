'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api-config';

interface OutboxEvent {
  id: string;
  eventType: string;
  status: string;
  createdAt: string;
  processedAt: string | null;
}

export default function SystemOutboxPage() {
  const [data, setData] = useState<OutboxEvent[]>([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/system/outbox`)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((d) => setData(d))
      .catch(() => toast.error('Service temporarily unavailable. Please try again.'));
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">System Outbox</h2>
      
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Kafka Event Outbox</CardTitle>
          <CardDescription>Monitor pending and completed integration events to be published to Kafka.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden border-border bg-white">
            <Table>
              <TableHeader className="bg-secondary/50">
                <TableRow>
                  <TableHead className="w-[80px]">Status</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead className="hidden lg:table-cell">Event ID</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Processed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((event) => (
                  <TableRow key={event.id} className="hover:bg-secondary/30 transition-colors">
                    <TableCell>
                      <Badge variant="outline" className={
                        event.status === 'COMPLETED' ? 'border-primary text-primary bg-primary/5' : 
                        event.status === 'FAILED' ? 'border-destructive text-destructive bg-destructive/5' :
                        'border-accent text-accent bg-accent/5'
                      }>
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{event.eventType}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground hidden lg:table-cell">{event.id}</TableCell>
                    <TableCell>{new Date(event.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {event.processedAt ? new Date(event.processedAt).toLocaleString() : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No outbox events found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
