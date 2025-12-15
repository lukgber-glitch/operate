'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface ContractPreviewProps {
  content: string;
  variables?: Record<string, string>;
}

export function ContractPreview({ content, variables = {} }: ContractPreviewProps) {
  // Replace variables in content
  let processedContent = content;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    processedContent = processedContent.replace(regex, value);
  });

  return (
    <Card className="p-8">
      <div className="max-w-3xl mx-auto">
        <div
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{
            __html: processedContent.replace(/\n/g, '<br />'),
          }}
        />
      </div>
    </Card>
  );
}
