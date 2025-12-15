'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp,
  FileText,
  DollarSign,
  Calculator,
  Target,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface HealthScoreComponent {
  id: string;
  label: string;
  score: number;
  details: string;
}

interface HealthScoreBreakdownProps {
  components: HealthScoreComponent[];
  className?: string;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
};

const getIcon = (id: string) => {
  const iconProps = { className: 'h-4 w-4' };
  switch (id) {
    case 'cashFlow':
      return <TrendingUp {...iconProps} />;
    case 'arHealth':
      return <FileText {...iconProps} />;
    case 'apHealth':
      return <DollarSign {...iconProps} />;
    case 'taxCompliance':
      return <Calculator {...iconProps} />;
    case 'profitability':
      return <Target {...iconProps} />;
    case 'runway':
      return <Calendar {...iconProps} />;
    default:
      return <TrendingUp {...iconProps} />;
  }
};

export function HealthScoreBreakdown({ components, className }: HealthScoreBreakdownProps) {
  return (
    <TooltipProvider>
      <div className={cn('space-y-3', className)}>
        {components.map((component, index) => (
          <motion.div
            key={component.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="text-gray-400">
                  {getIcon(component.id)}
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm font-medium text-white cursor-help">
                      {component.label}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">{component.details}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-sm font-semibold text-white">
                {component.score}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${component.score}%` }}
                transition={{ delay: index * 0.1 + 0.2, duration: 0.6 }}
                className={cn('h-full rounded-full', getScoreColor(component.score))}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </TooltipProvider>
  );
}
