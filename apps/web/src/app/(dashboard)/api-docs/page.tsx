'use client';

import { FileText, Code, Book, ExternalLink, Key, Zap, Shield, HelpCircle, ArrowRight } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';

const quickStartSteps = [
  {
    step: 1,
    title: 'Create an API Key',
    description: 'Generate your first API key from the developer portal',
    icon: Key,
    action: { label: 'Create Key', href: '/developer/api-keys' },
  },
  {
    step: 2,
    title: 'Make Your First Request',
    description: 'Use your API key to authenticate and fetch data',
    icon: Zap,
  },
  {
    step: 3,
    title: 'Set Up Webhooks',
    description: 'Configure webhooks to receive real-time events',
    icon: Shield,
    action: { label: 'Configure Webhooks', href: '/developer/webhooks' },
  },
];

const apiEndpoints = [
  {
    category: 'Authentication',
    endpoints: [
      { method: 'POST', path: '/api/v1/auth/login', description: 'Authenticate user' },
      { method: 'POST', path: '/api/v1/auth/logout', description: 'End user session' },
      { method: 'POST', path: '/api/v1/auth/refresh', description: 'Refresh access token' },
    ],
  },
  {
    category: 'Invoices',
    endpoints: [
      { method: 'GET', path: '/api/v1/invoices', description: 'List all invoices' },
      { method: 'POST', path: '/api/v1/invoices', description: 'Create new invoice' },
      { method: 'GET', path: '/api/v1/invoices/:id', description: 'Get invoice details' },
      { method: 'PUT', path: '/api/v1/invoices/:id', description: 'Update invoice' },
      { method: 'DELETE', path: '/api/v1/invoices/:id', description: 'Delete invoice' },
    ],
  },
  {
    category: 'Customers',
    endpoints: [
      { method: 'GET', path: '/api/v1/customers', description: 'List all customers' },
      { method: 'POST', path: '/api/v1/customers', description: 'Create new customer' },
      { method: 'GET', path: '/api/v1/customers/:id', description: 'Get customer details' },
      { method: 'PUT', path: '/api/v1/customers/:id', description: 'Update customer' },
    ],
  },
  {
    category: 'Expenses',
    endpoints: [
      { method: 'GET', path: '/api/v1/expenses', description: 'List all expenses' },
      { method: 'POST', path: '/api/v1/expenses', description: 'Create new expense' },
      { method: 'GET', path: '/api/v1/expenses/:id', description: 'Get expense details' },
    ],
  },
];

const codeExample = `// Authentication Example
const response = await fetch('https://api.operate.guru/api/v1/invoices', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const invoices = await response.json();
console.log(invoices);`;

const getMethodColor = (method: string) => {
  switch (method) {
    case 'GET':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'POST':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'PUT':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    case 'DELETE':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default:
      return '';
  }
};

export default function ApiDocsPage() {
  return (
    <div className="space-y-6">
      {/* Interactive Docs Banner */}
      <Alert className="border-primary/50 bg-gradient-to-r from-primary/10 to-primary/5">
        <FileText className="h-5 w-5" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-sm">
            <strong>Looking for interactive API documentation?</strong> View our full OpenAPI reference with try-it-out functionality.
          </span>
          <a
            href="/docs/api/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 ml-4"
          >
            <Button size="sm" className="gap-2">
              Open API Reference
              <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
        </AlertDescription>
      </Alert>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Documentation</h1>
        <p className="text-muted-foreground">
          Comprehensive guide to integrating with the Operate API
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">REST API</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              RESTful API with JSON responses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Secure Authentication</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              API key-based authentication
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Real-time Webhooks</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Event-driven integrations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start Guide</CardTitle>
          <CardDescription>
            Get started with the Operate API in three simple steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {quickStartSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    {step.step}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">{step.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                    {step.action && (
                      <Link href={step.action.href}>
                        <Button variant="outline" size="sm">
                          {step.action.label}
                          <ExternalLink className="ml-2 h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Authentication Example */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>
            All API requests require authentication using an API key
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Example Request</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
              <code className="text-sm">{codeExample}</code>
            </pre>
          </div>
          <div className="flex items-start gap-2 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Keep your API keys secure
              </p>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                Never expose your API keys in client-side code. Always make API calls from your backend server.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
          <CardDescription>
            Available endpoints organized by category
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {apiEndpoints.map((category) => (
            <div key={category.category} className="space-y-3">
              <h3 className="font-semibold text-lg">{category.category}</h3>
              <div className="space-y-2">
                {category.endpoints.map((endpoint, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Badge className={getMethodColor(endpoint.method)}>
                      {endpoint.method}
                    </Badge>
                    <code className="text-sm flex-1">{endpoint.path}</code>
                    <span className="text-sm text-muted-foreground">
                      {endpoint.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Resources */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Book className="h-5 w-5 text-primary" />
              <CardTitle>Developer Resources</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/developer">
              <Button variant="outline" className="w-full justify-start">
                <Code className="mr-2 h-4 w-4" />
                Developer Portal
              </Button>
            </Link>
            <Link href="/developer/api-keys">
              <Button variant="outline" className="w-full justify-start">
                <Key className="mr-2 h-4 w-4" />
                API Keys
              </Button>
            </Link>
            <Link href="/developer/webhooks">
              <Button variant="outline" className="w-full justify-start">
                <Shield className="mr-2 h-4 w-4" />
                Webhooks
              </Button>
            </Link>
            <Link href="/developer/logs">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                API Logs
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              <CardTitle>Need Help?</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Our developer support team is here to help you integrate successfully.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Email:</span>
                <a href="mailto:dev@operate.guru" className="text-primary hover:underline">
                  dev@operate.guru
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">Response Time:</span>
                <span>Within 24 hours</span>
              </div>
            </div>
            <Button className="w-full">
              <ExternalLink className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Rate Limits */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle>Rate Limits</CardTitle>
          <CardDescription>
            API usage limits to ensure fair usage and system stability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm text-muted-foreground">Development Keys</div>
              <div className="text-2xl text-white font-bold mt-1">1,000/day</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Production Keys</div>
              <div className="text-2xl text-white font-bold mt-1">5,000/day</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Burst Limit</div>
              <div className="text-2xl text-white font-bold mt-1">100/min</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Need higher limits? Contact our sales team for enterprise plans.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
