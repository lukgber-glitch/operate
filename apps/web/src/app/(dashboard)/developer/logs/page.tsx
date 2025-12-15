'use client';

import { useState } from 'react';
import { Activity, Search, Filter, Eye, Download } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';

interface ApiLog {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  statusCode: number;
  duration: number;
  ipAddress: string;
  userAgent: string;
  requestHeaders?: Record<string, string>;
  requestBody?: any;
  responseBody?: any;
}

const mockLogs: ApiLog[] = [
  {
    id: '1',
    timestamp: '2024-12-10T09:15:23Z',
    method: 'GET',
    endpoint: '/api/v1/invoices',
    statusCode: 200,
    duration: 124,
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    requestHeaders: { 'Authorization': 'Bearer sk_live_****', 'Content-Type': 'application/json' },
    responseBody: { data: [], total: 0 },
  },
  {
    id: '2',
    timestamp: '2024-12-10T09:14:56Z',
    method: 'POST',
    endpoint: '/api/v1/invoices',
    statusCode: 201,
    duration: 342,
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    requestBody: { customerId: '123', amount: 1000 },
    responseBody: { id: 'inv_123', status: 'created' },
  },
  {
    id: '3',
    timestamp: '2024-12-10T09:12:45Z',
    method: 'GET',
    endpoint: '/api/v1/customers/123',
    statusCode: 200,
    duration: 89,
    ipAddress: '192.168.1.2',
    userAgent: 'PostmanRuntime/7.32.0',
  },
  {
    id: '4',
    timestamp: '2024-12-10T09:10:12Z',
    method: 'PUT',
    endpoint: '/api/v1/invoices/inv_123',
    statusCode: 200,
    duration: 256,
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  },
  {
    id: '5',
    timestamp: '2024-12-10T09:08:34Z',
    method: 'DELETE',
    endpoint: '/api/v1/invoices/inv_456',
    statusCode: 404,
    duration: 67,
    ipAddress: '192.168.1.3',
    userAgent: 'curl/7.68.0',
  },
  {
    id: '6',
    timestamp: '2024-12-10T09:05:21Z',
    method: 'POST',
    endpoint: '/api/v1/auth/login',
    statusCode: 401,
    duration: 112,
    ipAddress: '192.168.1.4',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  },
  {
    id: '7',
    timestamp: '2024-12-10T09:02:15Z',
    method: 'GET',
    endpoint: '/api/v1/expenses',
    statusCode: 200,
    duration: 198,
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  },
  {
    id: '8',
    timestamp: '2024-12-10T08:58:43Z',
    method: 'POST',
    endpoint: '/api/v1/webhooks/test',
    statusCode: 500,
    duration: 1203,
    ipAddress: '192.168.1.5',
    userAgent: 'PostmanRuntime/7.32.0',
  },
  {
    id: '9',
    timestamp: '2024-12-10T08:55:12Z',
    method: 'GET',
    endpoint: '/api/v1/bank-accounts',
    statusCode: 200,
    duration: 145,
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  },
  {
    id: '10',
    timestamp: '2024-12-10T08:52:34Z',
    method: 'PATCH',
    endpoint: '/api/v1/customers/123',
    statusCode: 200,
    duration: 234,
    ipAddress: '192.168.1.2',
    userAgent: 'PostmanRuntime/7.32.0',
  },
];

export default function ApiLogsPage() {
  const [logs, setLogs] = useState<ApiLog[]>(mockLogs);
  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    } else if (statusCode >= 400 && statusCode < 500) {
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    } else if (statusCode >= 500) {
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    }
    return '';
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'POST':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'PUT':
      case 'PATCH':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'DELETE':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return '';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const handleViewDetails = (log: ApiLog) => {
    setSelectedLog(log);
    setIsDetailsDialogOpen(true);
  };

  const handleExportLogs = () => {
    toast({
      title: 'Export Started',
      description: 'Your API logs are being exported to CSV',
    });
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchQuery === '' ||
      log.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.method.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === '2xx' && log.statusCode >= 200 && log.statusCode < 300) ||
      (statusFilter === '4xx' && log.statusCode >= 400 && log.statusCode < 500) ||
      (statusFilter === '5xx' && log.statusCode >= 500);

    const matchesMethod = methodFilter === 'all' || log.method === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const stats = {
    total: logs.length,
    success: logs.filter(l => l.statusCode >= 200 && l.statusCode < 300).length,
    clientError: logs.filter(l => l.statusCode >= 400 && l.statusCode < 500).length,
    serverError: logs.filter(l => l.statusCode >= 500).length,
    avgDuration: Math.round(logs.reduce((sum, l) => sum + l.duration, 0) / logs.length),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Logs</h1>
          <p className="text-muted-foreground">
            View and analyze API request logs and performance metrics
          </p>
        </div>
        <Button variant="outline" onClick={handleExportLogs}>
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Requests</CardDescription>
            <CardTitle className="text-2xl text-white">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Successful (2xx)</CardDescription>
            <CardTitle className="text-2xl text-white text-green-600">{stats.success}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Client Errors (4xx)</CardDescription>
            <CardTitle className="text-2xl text-white text-yellow-600">{stats.clientError}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Server Errors (5xx)</CardDescription>
            <CardTitle className="text-2xl text-white text-red-600">{stats.serverError}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Avg Duration</CardDescription>
            <CardTitle className="text-2xl text-white">{stats.avgDuration}ms</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search endpoint or method..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status Code</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status Codes</option>
                <option value="2xx">2xx (Success)</option>
                <option value="4xx">4xx (Client Error)</option>
                <option value="5xx">5xx (Server Error)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Method</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
              >
                <option value="all">All Methods</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Request Logs</CardTitle>
          <CardDescription>
            Recent API requests ({filteredLogs.length} of {logs.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No Logs Found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {searchQuery || statusFilter !== 'all' || methodFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'API logs will appear here as requests are made'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getMethodColor(log.method)}>
                        {log.method}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm">{log.endpoint}</code>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(log.statusCode)}>
                        {log.statusCode}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.duration}ms
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {log.ipAddress}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Log Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              Full details for API request {selectedLog?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              {/* Overview */}
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Method</label>
                  <div className="mt-1">
                    <Badge className={getMethodColor(selectedLog.method)}>
                      {selectedLog.method}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status Code</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(selectedLog.statusCode)}>
                      {selectedLog.statusCode}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Duration</label>
                  <div className="mt-1 text-sm">{selectedLog.duration}ms</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
                  <div className="mt-1 text-sm">{formatTimestamp(selectedLog.timestamp)}</div>
                </div>
              </div>

              {/* Endpoint */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Endpoint</label>
                <code className="block mt-1 p-2 bg-muted rounded text-sm">
                  {selectedLog.endpoint}
                </code>
              </div>

              {/* IP & User Agent */}
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                  <div className="mt-1 text-sm">{selectedLog.ipAddress}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User Agent</label>
                  <div className="mt-1 text-sm truncate">{selectedLog.userAgent}</div>
                </div>
              </div>

              {/* Request Headers */}
              {selectedLog.requestHeaders && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Request Headers</label>
                  <pre className="mt-1 p-3 bg-muted rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.requestHeaders, null, 2)}
                  </pre>
                </div>
              )}

              {/* Request Body */}
              {selectedLog.requestBody && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Request Body</label>
                  <pre className="mt-1 p-3 bg-muted rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.requestBody, null, 2)}
                  </pre>
                </div>
              )}

              {/* Response Body */}
              {selectedLog.responseBody && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Response Body</label>
                  <pre className="mt-1 p-3 bg-muted rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.responseBody, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
