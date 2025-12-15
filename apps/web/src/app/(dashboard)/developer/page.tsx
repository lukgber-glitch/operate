'use client';

import { Code, Key, Webhook, FileText, Activity, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const developerSections = [
  {
    title: 'API Keys',
    description: 'Manage API keys for authentication and access control',
    icon: Key,
    href: '/developer/api-keys',
    status: 'Active',
  },
  {
    title: 'Webhooks',
    description: 'Configure webhook endpoints and manage event subscriptions',
    icon: Webhook,
    href: '/developer/webhooks',
    status: 'Active',
  },
  {
    title: 'API Logs',
    description: 'View and analyze API request logs and performance metrics',
    icon: Activity,
    href: '/developer/logs',
    status: 'Active',
  },
  {
    title: 'API Documentation',
    description: 'Comprehensive API reference and integration guides',
    icon: FileText,
    href: '/api-docs',
    status: 'Active',
  },
];

export default function DeveloperPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Developer Portal</h1>
        <p className="text-muted-foreground">
          API access, webhooks, and developer resources
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>API Requests Today</CardDescription>
            <CardTitle className="text-3xl">1,234</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              +12% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Rate Limit</CardDescription>
            <CardTitle className="text-3xl">24%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              1,234 / 5,000 requests
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active API Keys</CardDescription>
            <CardTitle className="text-3xl">3</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              2 production, 1 development
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Webhook Endpoints</CardDescription>
            <CardTitle className="text-3xl">2</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              All endpoints healthy
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Developer Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {developerSections.map((section) => {
          const Icon = section.icon;
          const isActive = section.status === 'Active';

          return (
            <Card
              key={section.href}
              className="relative overflow-hidden transition-all hover:shadow-md"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{section.title}</CardTitle>
                      {section.status && (
                        <Badge
                          variant={isActive ? 'default' : 'secondary'}
                          className="mt-1"
                        >
                          {section.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-base">
                  {section.description}
                </CardDescription>

                {isActive ? (
                  <Link href={section.href}>
                    <Button variant="outline" className="w-full group">
                      Open
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    Coming Soon
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* API Status */}
      <Card>
        <CardHeader>
          <CardTitle>API Status</CardTitle>
          <CardDescription>Current system status and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="font-medium">All Systems Operational</span>
              </div>
              <Badge variant="outline">99.9% Uptime</Badge>
            </div>

            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground">API Endpoint</span>
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Operational
                </Badge>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground">Webhook Delivery</span>
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Operational
                </Badge>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground">Authentication</span>
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Operational
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Average Response Time</span>
                <span className="font-medium">124ms</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Code className="h-5 w-5 text-primary mt-1" />
            <div>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription className="mt-1">
                New to the Operate API? Check out our documentation and guides
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/api-docs">
              <Button variant="default">
                <FileText className="mr-2 h-4 w-4" />
                View Documentation
              </Button>
            </Link>
            <Link href="/developer/api-keys">
              <Button variant="outline">
                <Key className="mr-2 h-4 w-4" />
                Create API Key
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
