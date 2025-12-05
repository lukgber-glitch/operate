'use client';

import { Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type EmailProvider = 'gmail' | 'outlook';

interface EmailProviderButtonProps {
  provider: EmailProvider;
  isConnecting: boolean;
  onClick: () => void;
  disabled?: boolean;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  className?: string;
}

export function EmailProviderButton({
  provider,
  isConnecting,
  onClick,
  disabled = false,
  size = 'default',
  variant = 'outline',
  className,
}: EmailProviderButtonProps) {
  const getProviderConfig = () => {
    if (provider === 'gmail') {
      return {
        name: 'Gmail',
        icon: (
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
          </svg>
        ),
        color: 'text-red-500',
        hoverColor: 'hover:text-red-600',
      };
    }

    return {
      name: 'Outlook',
      icon: (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M24 7.386L12 0 0 7.386v9.228L12 24l12-7.386V7.386zM12 2.116l9.144 5.614L12 13.344 2.856 7.73 12 2.116zM1.714 9.458l9.143 5.614v8.813l-9.143-5.614V9.458zm11.143 14.427v-8.813l9.143-5.614v8.813l-9.143 5.614z" />
        </svg>
      ),
      color: 'text-blue-500',
      hoverColor: 'hover:text-blue-600',
    };
  };

  const config = getProviderConfig();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled || isConnecting}
      className={cn(
        'group relative overflow-hidden',
        className
      )}
    >
      <div className="flex items-center gap-2">
        {isConnecting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <div className={cn(config.color, config.hoverColor, 'transition-colors')}>
            {config.icon}
          </div>
        )}
        <span>
          {isConnecting ? `Connecting to ${config.name}...` : `Connect ${config.name}`}
        </span>
      </div>
    </Button>
  );
}
