'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye } from 'lucide-react';
import Link from 'next/link';

interface TemplateCardProps {
  id: string;
  name: string;
  description: string;
  category: string;
  isSystem?: boolean;
  variablesCount?: number;
}

export function TemplateCard({
  id,
  name,
  description,
  category,
  isSystem = false,
  variablesCount = 0,
}: TemplateCardProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-primary/10 rounded-lg">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold">{name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {description}
              </p>
            </div>
            {isSystem && (
              <Badge variant="secondary" className="shrink-0">
                System
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{category}</Badge>
            {variablesCount > 0 && (
              <span>{variablesCount} variables</span>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/contracts/templates/${id}`}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/contracts/new?template=${id}`}>
                Use Template
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
