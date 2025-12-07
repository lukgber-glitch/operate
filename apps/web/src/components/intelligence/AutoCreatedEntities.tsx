'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { intelligenceApi } from '@/lib/api/intelligence';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Building2, Mail, AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface AutoCreatedEntitiesProps {
  limit?: number;
}

const typeConfig = {
  CUSTOMER: {
    icon: Users,
    color: 'text-blue-600 bg-blue-50',
    label: 'Customer',
    link: (id: string) => `/clients/${id}`,
  },
  VENDOR: {
    icon: Building2,
    color: 'text-purple-600 bg-purple-50',
    label: 'Vendor',
    link: (id: string) => `/vendors/${id}`,
  },
};

export function AutoCreatedEntities({ limit = 10 }: AutoCreatedEntitiesProps) {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('week');

  const getDateFilter = () => {
    const now = new Date();
    if (dateRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { dateFrom: weekAgo.toISOString() };
    }
    if (dateRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { dateFrom: monthAgo.toISOString() };
    }
    return {};
  };

  const { data: entities, isLoading, error } = useQuery({
    queryKey: ['auto-created-entities', dateRange],
    queryFn: () => intelligenceApi.getAutoCreatedEntities(getDateFilter()),
  });

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Auto-Created Entities</CardTitle>
          <CardDescription>Customers and vendors created from emails</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load entities</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayEntities = entities?.slice(0, limit);
  const customerCount = entities?.filter((e) => e.type === 'CUSTOMER').length || 0;
  const vendorCount = entities?.filter((e) => e.type === 'VENDOR').length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-indigo-500" />
              Auto-Created Entities
            </CardTitle>
            <CardDescription>Customers and vendors detected from emails</CardDescription>
          </div>
          {entities && entities.length > 0 && (
            <div className="text-right">
              <div className="text-2xl font-bold">{entities.length}</div>
              <div className="text-xs text-muted-foreground">
                {dateRange === 'week' ? 'This week' : dateRange === 'month' ? 'This month' : 'Total'}
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Range Filter */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={dateRange === 'week' ? 'default' : 'outline'}
            onClick={() => setDateRange('week')}
          >
            This Week
          </Button>
          <Button
            size="sm"
            variant={dateRange === 'month' ? 'default' : 'outline'}
            onClick={() => setDateRange('month')}
          >
            This Month
          </Button>
          <Button
            size="sm"
            variant={dateRange === 'all' ? 'default' : 'outline'}
            onClick={() => setDateRange('all')}
          >
            All Time
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : displayEntities && displayEntities.length > 0 ? (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border bg-blue-50/50">
                <div className="flex items-center gap-2 text-blue-700">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">Customers</span>
                </div>
                <div className="text-2xl font-bold text-blue-900 mt-1">{customerCount}</div>
              </div>
              <div className="p-3 rounded-lg border bg-purple-50/50">
                <div className="flex items-center gap-2 text-purple-700">
                  <Building2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Vendors</span>
                </div>
                <div className="text-2xl font-bold text-purple-900 mt-1">{vendorCount}</div>
              </div>
            </div>

            {/* Entity List */}
            <div className="space-y-2">
              {displayEntities.map((entity) => {
                const config = typeConfig[entity.type];
                const Icon = config.icon;

                return (
                  <div
                    key={entity.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{entity.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {config.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(new Date(entity.createdAt), { addSuffix: true })}
                          </span>
                          {entity.emailCount > 0 && (
                            <>
                              <span>•</span>
                              <span>{entity.emailCount} emails</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button variant="ghost" size="sm" asChild>
                      <Link href={config.link(entity.id)}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>

            {entities && entities.length > limit && (
              <div className="pt-2 text-center">
                <p className="text-sm text-muted-foreground">
                  Showing {limit} of {entities.length} entities
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No auto-created entities</p>
            <p className="text-sm">
              {dateRange === 'all'
                ? 'Entities will appear here as they are detected from emails'
                : 'No entities created in this time period'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
