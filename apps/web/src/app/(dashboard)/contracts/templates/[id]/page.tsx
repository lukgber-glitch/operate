'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileSignature } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ContractPreview } from '@/components/contracts';
import { useContractTemplate } from '@/hooks/use-business-contracts';

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const { data: template, isLoading } = useContractTemplate(templateId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading template...</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Template not found</p>
        <Button asChild variant="outline">
          <Link href="/contracts/templates">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/contracts/templates">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{template.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{template.category}</Badge>
              {template.isSystem && <Badge variant="secondary">System</Badge>}
            </div>
          </div>
        </div>
        <Button asChild>
          <Link href={`/contracts/new?template=${templateId}`}>
            <FileSignature className="h-4 w-4 mr-2" />
            Use This Template
          </Link>
        </Button>
      </div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ContractPreview content={template.content} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Template Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm">{template.description}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium">{template.category}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">
                  {template.isSystem ? 'System Template' : 'Custom Template'}
                </p>
              </div>
            </div>
          </Card>

          {template.variables && template.variables.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Variables</h3>
              <div className="space-y-3">
                {template.variables.map((variable: any) => (
                  <div key={variable.key} className="space-y-1">
                    <p className="text-sm font-medium">{variable.label}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {'{'}
                      {variable.key}
                      {'}'}
                    </p>
                    {variable.defaultValue && (
                      <p className="text-xs text-muted-foreground">
                        Default: {variable.defaultValue}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {!template.isSystem && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full">
                  Edit Template
                </Button>
                <Button variant="outline" className="w-full text-destructive">
                  Delete Template
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
