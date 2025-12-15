'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Download, Filter, DollarSign, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTimeEntries, formatDuration } from '@/hooks/use-time-tracking';
import { useProjects } from '@/hooks/use-time-tracking';
import type { TimeEntryFilters } from '@/lib/api/time-tracking';

export default function EntriesPage() {
  const [filters, setFilters] = useState<TimeEntryFilters>({
    pageSize: 50,
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const { entries, isLoading, fetchEntries, bulkMarkAsBillable, bulkMarkAsBilled, exportEntries, total } =
    useTimeEntries(filters);
  const { projects, fetchProjects } = useProjects({ status: 'ACTIVE', pageSize: 100 });

  useEffect(() => {
    fetchEntries();
    fetchProjects();
  }, [fetchEntries, fetchProjects]);

  const handleFilterChange = (key: keyof TimeEntryFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchEntries(newFilters);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(entries.map((e) => e.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkMarkAsBillable = async () => {
    await bulkMarkAsBillable(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleBulkMarkAsBilled = async () => {
    await bulkMarkAsBilled(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Time Entries</h1>
          <p className="text-gray-300">
            {total} {total === 1 ? 'entry' : 'entries'} found
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" onClick={exportEntries}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Project</Label>
                <Select
                  value={filters.projectId || 'all'}
                  onValueChange={(value) => handleFilterChange('projectId', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Billable Status</Label>
                <Select
                  value={
                    filters.billable === undefined ? 'all' : filters.billable ? 'billable' : 'non-billable'
                  }
                  onValueChange={(value) =>
                    handleFilterChange(
                      'billable',
                      value === 'all' ? undefined : value === 'billable'
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="billable">Billable</SelectItem>
                    <SelectItem value="non-billable">Non-billable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <p className="text-white">
                {selectedIds.size} {selectedIds.size === 1 ? 'entry' : 'entries'} selected
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleBulkMarkAsBillable}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Mark as Billable
                </Button>
                <Button variant="outline" size="sm" onClick={handleBulkMarkAsBilled}>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Mark as Billed
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entries Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.size === entries.length && entries.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead>Billable</TableHead>
                <TableHead>Billed</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-400">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-400">
                    No time entries found
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(entry.id)}
                        onCheckedChange={(checked) => handleSelectOne(entry.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>{format(new Date(entry.startTime), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {entry.project && (
                          <>
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: entry.project.color || '#6b7280' }}
                            />
                            <span>{entry.project.name}</span>
                          </>
                        )}
                        {!entry.project && <span className="text-gray-400">No Project</span>}
                      </div>
                    </TableCell>
                    <TableCell>{entry.client?.name || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{entry.description || '-'}</TableCell>
                    <TableCell className="text-right font-mono">{formatDuration(entry.duration)}</TableCell>
                    <TableCell>
                      {entry.billable ? (
                        <Badge variant="default" className="bg-green-600">
                          Yes
                        </Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.billed ? (
                        <Badge variant="default" className="bg-blue-600">
                          Yes
                        </Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.amount ? `$${(entry.amount / 100).toFixed(2)}` : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
