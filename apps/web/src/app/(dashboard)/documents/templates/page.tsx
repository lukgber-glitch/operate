'use client';

import {
  FileText,
  Receipt,
  FileCheck,
  FileBarChart,
  Mail,
  Search,
  Download,
  Eye,
  Copy,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type TemplateCategory = 'ALL' | 'INVOICES' | 'CONTRACTS' | 'REPORTS' | 'LETTERS';

interface Template {
  id: string;
  name: string;
  description: string;
  category: Exclude<TemplateCategory, 'ALL'>;
  thumbnail: React.ReactNode;
  downloads: number;
  popular?: boolean;
}

const mockTemplates: Template[] = [
  {
    id: '1',
    name: 'Standard Invoice',
    description: 'Professional invoice template with your company branding',
    category: 'INVOICES',
    thumbnail: <Receipt className="h-12 w-12" />,
    downloads: 1234,
    popular: true,
  },
  {
    id: '2',
    name: 'VAT Invoice',
    description: 'Invoice template with VAT calculation and tax breakdown',
    category: 'INVOICES',
    thumbnail: <Receipt className="h-12 w-12" />,
    downloads: 892,
    popular: true,
  },
  {
    id: '3',
    name: 'Quote Template',
    description: 'Create professional quotes for potential clients',
    category: 'INVOICES',
    thumbnail: <FileText className="h-12 w-12" />,
    downloads: 645,
  },
  {
    id: '4',
    name: 'Employment Contract',
    description: 'Standard employment contract template for new hires',
    category: 'CONTRACTS',
    thumbnail: <FileCheck className="h-12 w-12" />,
    downloads: 567,
    popular: true,
  },
  {
    id: '5',
    name: 'NDA Agreement',
    description: 'Non-disclosure agreement for confidential information',
    category: 'CONTRACTS',
    thumbnail: <FileCheck className="h-12 w-12" />,
    downloads: 423,
  },
  {
    id: '6',
    name: 'Service Agreement',
    description: 'Service contract template for client engagements',
    category: 'CONTRACTS',
    thumbnail: <FileCheck className="h-12 w-12" />,
    downloads: 389,
  },
  {
    id: '7',
    name: 'Monthly Financial Report',
    description: 'Comprehensive monthly financial reporting template',
    category: 'REPORTS',
    thumbnail: <FileBarChart className="h-12 w-12" />,
    downloads: 756,
    popular: true,
  },
  {
    id: '8',
    name: 'Expense Report',
    description: 'Track and report business expenses',
    category: 'REPORTS',
    thumbnail: <FileBarChart className="h-12 w-12" />,
    downloads: 534,
  },
  {
    id: '9',
    name: 'Project Status Report',
    description: 'Weekly or monthly project progress reporting',
    category: 'REPORTS',
    thumbnail: <FileBarChart className="h-12 w-12" />,
    downloads: 412,
  },
  {
    id: '10',
    name: 'Business Letter',
    description: 'Professional business correspondence template',
    category: 'LETTERS',
    thumbnail: <Mail className="h-12 w-12" />,
    downloads: 298,
  },
  {
    id: '11',
    name: 'Payment Reminder',
    description: 'Polite payment reminder letter for overdue invoices',
    category: 'LETTERS',
    thumbnail: <Mail className="h-12 w-12" />,
    downloads: 445,
  },
  {
    id: '12',
    name: 'Welcome Letter',
    description: 'Welcome letter template for new employees',
    category: 'LETTERS',
    thumbnail: <Mail className="h-12 w-12" />,
    downloads: 267,
  },
];

const categoryConfig = {
  INVOICES: {
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: Receipt
  },
  CONTRACTS: {
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: FileCheck
  },
  REPORTS: {
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    icon: FileBarChart
  },
  LETTERS: {
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    icon: Mail
  },
};

export default function DocumentTemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('ALL');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const filteredTemplates = mockTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const popularTemplates = mockTemplates.filter(t => t.popular);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl text-white font-semibold tracking-tight">Document Templates</h1>
        <p className="text-muted-foreground">
          Choose from our library of professional business templates
        </p>
      </div>

      {/* Popular Templates */}
      <Card className="rounded-[24px] bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <svg
                className="h-5 w-5 text-primary"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <CardTitle>Popular Templates</CardTitle>
          </div>
          <CardDescription>Most downloaded templates this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularTemplates.map(template => {
              const config = categoryConfig[template.category];
              return (
                <Card key={template.id} className="rounded-[16px] group hover:shadow-lg transition-all">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className={`p-4 rounded-lg ${config.color.split(' ')[0]} ${config.color.split(' ')[1]} flex items-center justify-center`}>
                        {template.thumbnail}
                      </div>
                      <div>
                        <h3 className="font-medium text-sm mb-1">{template.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-muted-foreground">
                          {template.downloads} downloads
                        </span>
                        <Button
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setPreviewTemplate(template)}
                        >
                          Use Template
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs
          value={selectedCategory}
          onValueChange={(value) => setSelectedCategory(value as TemplateCategory)}
        >
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="INVOICES">Invoices</TabsTrigger>
            <TabsTrigger value="CONTRACTS">Contracts</TabsTrigger>
            <TabsTrigger value="REPORTS">Reports</TabsTrigger>
            <TabsTrigger value="LETTERS">Letters</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredTemplates.length} of {mockTemplates.length} templates
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">
              No templates found
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Try adjusting your search or browse different categories
            </p>
          </div>
        ) : (
          filteredTemplates.map(template => {
            const config = categoryConfig[template.category];

            return (
              <Card key={template.id} className="rounded-[24px] group hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className={`p-6 rounded-lg ${config.color.split(' ')[0]} ${config.color.split(' ')[1]} flex items-center justify-center`}>
                      {template.thumbnail}
                    </div>

                    <div>
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-medium text-sm">{template.name}</h3>
                        {template.popular && (
                          <Badge variant="secondary" className="text-xs">Popular</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={config.color}>
                        {template.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {template.downloads} uses
                      </span>
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <Eye className="mr-2 h-3 w-3" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <Copy className="mr-2 h-3 w-3" />
                        Use
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>{previewTemplate?.description}</DialogDescription>
          </DialogHeader>

          {previewTemplate && (
            <div className="space-y-4">
              <div className="border rounded-lg p-12 bg-slate-50 dark:bg-slate-900 text-center">
                <div className={`inline-flex p-8 rounded-lg ${categoryConfig[previewTemplate.category].color.split(' ')[0]} ${categoryConfig[previewTemplate.category].color.split(' ')[1]}`}>
                  {previewTemplate.thumbnail}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Template preview
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1">Category</div>
                  <Badge variant="outline" className={categoryConfig[previewTemplate.category].color}>
                    {previewTemplate.category}
                  </Badge>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Downloads</div>
                  <div className="font-medium">{previewTemplate.downloads} times</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">About this template</h4>
                <p className="text-sm text-muted-foreground">
                  {previewTemplate.description}
                </p>
                <p className="text-sm text-muted-foreground">
                  This template is fully customizable and can be adapted to your business needs.
                  Once you use this template, it will be copied to your documents library where
                  you can edit and fill in your information.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
              Cancel
            </Button>
            <Button onClick={() => setPreviewTemplate(null)}>
              <Download className="mr-2 h-4 w-4" />
              Use Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
