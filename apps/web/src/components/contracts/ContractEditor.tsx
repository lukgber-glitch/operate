'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Code } from 'lucide-react';

interface ContractEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ContractEditor({ value, onChange, placeholder }: ContractEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

  return (
    <Card className="p-4">
      <Tabs value={mode} onValueChange={(v) => setMode(v as 'edit' | 'preview')}>
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-medium">Contract Content</label>
          <TabsList>
            <TabsTrigger value="edit">
              <Code className="h-4 w-4 mr-2" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="edit" className="mt-0">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || 'Enter contract content...'}
            className="min-h-[400px] font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Use variables: {'{client_name}'}, {'{contract_value}'}, {'{start_date}'}, {'{end_date}'}
          </p>
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <div className="border rounded-lg p-6 min-h-[400px] bg-white dark:bg-gray-950">
            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{
                __html: value.replace(/\n/g, '<br />'),
              }}
            />
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
