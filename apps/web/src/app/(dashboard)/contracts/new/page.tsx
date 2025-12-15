'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ContractEditor, TemplateVariables } from '@/components/contracts';
import {
  useCreateBusinessContract,
  useCreateFromTemplate,
  useContractTemplate,
} from '@/hooks/use-business-contracts';
import { useClients } from '@/hooks/use-clients';

const contractSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  clientId: z.string().min(1, 'Client is required'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  value: z.number().optional(),
  currency: z.string().default('EUR'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type ContractFormData = z.infer<typeof contractSchema>;

function NewContractContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');

  const [variables, setVariables] = useState<Record<string, string>>({});
  const [isDraft, setIsDraft] = useState(true);

  const { data: template } = useContractTemplate(templateId || '');
  const { data: clientsData } = useClients({ limit: 100 });
  const createContract = useCreateBusinessContract();
  const createFromTemplate = useCreateFromTemplate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      content: '',
      currency: 'EUR',
    },
  });

  const content = watch('content');

  useEffect(() => {
    if (template) {
      setValue('title', template.name);
      setValue('content', template.content);
    }
  }, [template, setValue]);

  const onSubmit = async (data: ContractFormData) => {
    try {
      if (templateId && template) {
        await createFromTemplate.mutateAsync({
          templateId,
          variables: {
            ...variables,
            title: data.title,
            clientId: data.clientId,
            content: data.content,
            currency: data.currency,
            ...(data.value !== undefined && { value: String(data.value) }),
            ...(data.startDate && { startDate: data.startDate }),
            ...(data.endDate && { endDate: data.endDate }),
          },
        });
      } else {
        await createContract.mutateAsync(data);
      }
      router.push('/contracts');
    } catch (error) {
      console.error('Failed to create contract:', error);
    }
  };

  const clients = clientsData?.items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/contracts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {templateId ? 'Create from Template' : 'New Contract'}
          </h1>
          <p className="text-muted-foreground">
            {templateId
              ? `Using template: ${template?.name}`
              : 'Create a new contract from scratch'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template Variables */}
            {template && template.variables.length > 0 && (
              <TemplateVariables
                variables={template.variables}
                values={variables}
                onChange={setVariables}
              />
            )}

            {/* Contract Editor */}
            <ContractEditor
              value={content}
              onChange={(value) => setValue('content', value)}
              placeholder="Enter your contract content here..."
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content.message}</p>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Contract Details</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    {...register('title')}
                    placeholder="e.g., Service Agreement"
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientId">Client *</Label>
                  <Select
                    onValueChange={(value) => setValue('clientId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client: any) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.clientId && (
                    <p className="text-sm text-destructive">
                      {errors.clientId.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="value">Contract Value</Label>
                  <div className="flex gap-2">
                    <Input
                      id="value"
                      type="number"
                      step="0.01"
                      {...register('value', { valueAsNumber: true })}
                      placeholder="0.00"
                      className="flex-1"
                    />
                    <Select
                      defaultValue="EUR"
                      onValueChange={(value) => setValue('currency', value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" type="date" {...register('startDate')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" type="date" {...register('endDate')} />
                </div>
              </div>
            </Card>

            {/* Actions */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Actions</h3>
              <div className="space-y-2">
                <Button type="submit" className="w-full">
                  Save Draft
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <Link href="/contracts">Cancel</Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function NewContractPage() {
  return (
    <Suspense fallback={<div className="animate-pulse p-4">Loading...</div>}>
      <NewContractContent />
    </Suspense>
  );
}
