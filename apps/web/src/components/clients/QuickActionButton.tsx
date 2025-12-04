'use client';

import { LucideIcon } from 'lucide-react';
import { type ComponentPropsWithoutRef } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface QuickActionButtonProps extends ComponentPropsWithoutRef<typeof Button> {
  icon: LucideIcon;
  label: string;
  tooltip?: string;
  loading?: boolean;
}

export function QuickActionButton({
  icon: Icon,
  label,
  tooltip,
  loading = false,
  disabled,
  ...props
}: QuickActionButtonProps) {
  const button = (
    <Button
      disabled={disabled || loading}
      {...props}
    >
      <Icon className="h-4 w-4 mr-2" />
      {loading ? 'Loading...' : label}
    </Button>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
