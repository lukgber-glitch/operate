'use client';

import { useState, ReactNode } from 'react';
import { Plus, X } from 'lucide-react';
import { useHaptic } from '@/hooks/use-haptic';

export interface FABAction {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  actions?: FABAction[];
  mainAction?: () => void;
  mainIcon?: ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

const POSITION_CLASSES = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
};

const SIZE_CLASSES = {
  sm: 'w-12 h-12',
  md: 'w-14 h-14',
  lg: 'w-16 h-16',
};

export function FloatingActionButton({
  actions = [],
  mainAction,
  mainIcon = <Plus className="h-6 w-6" />,
  position = 'bottom-right',
  color = 'bg-primary',
  size = 'md',
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const haptic = useHaptic();

  const hasActions = actions.length > 0;

  const handleMainClick = () => {
    haptic.light();

    if (hasActions) {
      setIsExpanded(!isExpanded);
    } else if (mainAction) {
      mainAction();
    }
  };

  const handleActionClick = (action: FABAction) => {
    haptic.medium();
    action.onClick();
    setIsExpanded(false);
  };

  return (
    <>
      {/* Backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* FAB Container */}
      <div className={`fixed z-50 ${POSITION_CLASSES[position]}`}>
        {/* Action Menu */}
        {hasActions && isExpanded && (
          <div className="absolute bottom-full mb-4 right-0 space-y-3 pb-2">
            {actions.map((action, index) => (
              <div
                key={action.id}
                className="flex items-center gap-3 animate-in slide-in-from-bottom-2 fade-in"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: 'backwards',
                }}
              >
                {/* Label */}
                <div className="bg-background rounded-lg px-3 py-2 shadow-lg border whitespace-nowrap">
                  <span className="text-sm font-medium">{action.label}</span>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleActionClick(action)}
                  className={`${
                    action.color || 'bg-primary'
                  } text-primary-foreground rounded-full p-3 shadow-lg hover:scale-110 transition-transform`}
                  aria-label={action.label}
                >
                  {action.icon}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Main FAB */}
        <button
          onClick={handleMainClick}
          className={`${SIZE_CLASSES[size]} ${color} text-primary-foreground rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all flex items-center justify-center`}
          style={{
            transform: isExpanded ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
          aria-label={isExpanded ? 'Close menu' : 'Open menu'}
        >
          {isExpanded && hasActions ? (
            <X className="h-6 w-6" />
          ) : (
            mainIcon
          )}
        </button>
      </div>
    </>
  );
}
