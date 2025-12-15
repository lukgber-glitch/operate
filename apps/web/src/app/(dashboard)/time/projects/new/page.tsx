'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useProjects } from '@/hooks/use-time-tracking';
import { useClients } from '@/hooks/use-clients';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  clientId: z.string().optional(),
  color: z.string().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED']).optional(),
  budgetHours: z.number().optional(),
  budgetAmount: z.number().optional(),
  hourlyRate: z.number().optional(),
  billable: z.boolean().optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

const predefinedColors = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
];

export default function NewProjectPage() {
  const router = useRouter();
  const { createProject } = useProjects();
  const { data: clientsData } = useClients({ limit: 100 });
  const clients = clientsData?.items || [];
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      status: 'ACTIVE',
      billable: true,
      color: predefinedColors[0],
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    try {
      // Convert dollars to cents
      const payload = {
        ...data,
        budgetAmount: data.budgetAmount ? data.budgetAmount * 100 : undefined,
        hourlyRate: data.hourlyRate ? data.hourlyRate * 100 : undefined,
      };

      const project = await createProject(payload);
      router.push(`/time/projects/${project.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedColor = watch('color');
  const billable = watch('billable');

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/time/projects">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white">New Project</h1>
          <p className="text-gray-300">Create a new time tracking project</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Project Name <span className="text-red-400">*</span>
                </Label>
                <Input id="name" {...register('name')} placeholder="Website Redesign" />
                {errors.name && <p className="text-sm text-red-400">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientId">Client (optional)</Label>
                <Select onValueChange={(value) => setValue('clientId', value)}>
                  <SelectTrigger id="clientId">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea id="description" {...register('description')} placeholder="Project description..." rows={3} />
              </div>
            </div>

            {/* Color & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project Color</Label>
                <div className="grid grid-cols-8 gap-2">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="h-8 w-8 rounded-full border-2 transition-all hover:scale-110"
                      style={{
                        backgroundColor: color,
                        borderColor: selectedColor === color ? '#fff' : 'transparent',
                      }}
                      onClick={() => setValue('color', color)}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue="ACTIVE" onValueChange={(value: any) => setValue('status', value)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date (optional)</Label>
                <Input id="startDate" type="date" {...register('startDate')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (optional)</Label>
                <Input id="endDate" type="date" {...register('endDate')} />
              </div>
            </div>

            {/* Billing */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="billable">Billable Project</Label>
                  <p className="text-sm text-gray-400">Track time as billable by default</p>
                </div>
                <Switch
                  id="billable"
                  defaultChecked={true}
                  onCheckedChange={(checked) => setValue('billable', checked)}
                />
              </div>

              {billable && (
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate (optional)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    step="0.01"
                    placeholder="75.00"
                    {...register('hourlyRate', { valueAsNumber: true })}
                  />
                </div>
              )}
            </div>

            {/* Budget */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budgetHours">Budget Hours (optional)</Label>
                <Input
                  id="budgetHours"
                  type="number"
                  step="0.5"
                  placeholder="40"
                  {...register('budgetHours', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budgetAmount">Budget Amount (optional)</Label>
                <Input
                  id="budgetAmount"
                  type="number"
                  step="0.01"
                  placeholder="3000.00"
                  {...register('budgetAmount', { valueAsNumber: true })}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/time/projects">Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
