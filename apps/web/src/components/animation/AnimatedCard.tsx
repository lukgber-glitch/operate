'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

const cardVariants = {
  rest: {
    scale: 1,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    transition: { duration: 0.2 }
  }
};

export function AnimatedCard({
  children,
  className,
  disableHover = false
}: {
  children: React.ReactNode;
  className?: string;
  disableHover?: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion || disableHover) {
    return (
      <div
        className={cn(
          'backdrop-blur-xl bg-white/80 dark:bg-gray-900/80',
          'border border-gray-200/50 dark:border-gray-700/50',
          'rounded-[16px] p-6',
          'shadow-sm',
          className
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="rest"
      whileHover="hover"
      className={cn(
        'backdrop-blur-xl bg-white/80 dark:bg-gray-900/80',
        'border border-gray-200/50 dark:border-gray-700/50',
        'rounded-[16px] p-6',
        'shadow-sm',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
