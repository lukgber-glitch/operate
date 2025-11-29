'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
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

const leaveRequestSchema = z.object({
  leaveTypeId: z.string().min(1, 'Leave type is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().optional(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: 'End date must be after or equal to start date',
  path: ['endDate'],
});

type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>;

interface LeaveRequestFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function LeaveRequestForm({ onSubmit, onCancel, isLoading }: LeaveRequestFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    },
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="leaveTypeId">
          Leave Type <span className="text-destructive">*</span>
        </Label>
        <Select
          value={watch('leaveTypeId') || ''}
          onValueChange={(value) => setValue('leaveTypeId', value)}
        >
          <SelectTrigger id="leaveTypeId">
            <SelectValue placeholder="Select leave type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lt-1">Annual Leave</SelectItem>
            <SelectItem value="lt-2">Sick Leave</SelectItem>
            <SelectItem value="lt-3">Personal Leave</SelectItem>
            <SelectItem value="lt-4">Parental Leave</SelectItem>
            <SelectItem value="lt-5">Unpaid Leave</SelectItem>
          </SelectContent>
        </Select>
        {errors.leaveTypeId && (
          <p className="text-sm text-destructive">{errors.leaveTypeId.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">
            Start Date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="startDate"
            type="date"
            {...register('startDate')}
          />
          {errors.startDate && (
            <p className="text-sm text-destructive">{errors.startDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">
            End Date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="endDate"
            type="date"
            {...register('endDate')}
          />
          {errors.endDate && (
            <p className="text-sm text-destructive">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      {startDate && endDate && (
        <div className="rounded-lg bg-muted p-3 text-sm">
          <span className="font-medium">Duration:</span> {calculateDays()} day(s)
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="reason">Reason (optional)</Label>
        <Textarea
          id="reason"
          {...register('reason')}
          placeholder="Provide additional details..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Submitting...' : 'Submit Request'}
        </Button>
      </div>
    </form>
  );
}
