'use client';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Variable {
  key: string;
  label: string;
  defaultValue?: string;
}

interface TemplateVariablesProps {
  variables: Variable[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}

export function TemplateVariables({
  variables,
  values,
  onChange,
}: TemplateVariablesProps) {
  const handleChange = (key: string, value: string) => {
    onChange({
      ...values,
      [key]: value,
    });
  };

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Template Variables</h3>
      <div className="grid gap-4">
        {variables.map((variable) => (
          <div key={variable.key} className="space-y-2">
            <Label htmlFor={variable.key}>{variable.label}</Label>
            <Input
              id={variable.key}
              value={values[variable.key] || variable.defaultValue || ''}
              onChange={(e) => handleChange(variable.key, e.target.value)}
              placeholder={`Enter ${variable.label.toLowerCase()}`}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
