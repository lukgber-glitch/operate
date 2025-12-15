'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HealthScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return { stroke: '#22c55e', bg: '#22c55e20' }; // Green
  if (score >= 60) return { stroke: '#eab308', bg: '#eab30820' }; // Yellow
  if (score >= 40) return { stroke: '#f97316', bg: '#f9731620' }; // Orange
  return { stroke: '#ef4444', bg: '#ef444420' }; // Red
};

const sizeConfig = {
  sm: { size: 120, strokeWidth: 8, fontSize: 'text-2xl' },
  md: { size: 180, strokeWidth: 10, fontSize: 'text-4xl' },
  lg: { size: 240, strokeWidth: 12, fontSize: 'text-5xl' },
};

export function HealthScoreGauge({
  score,
  size = 'md',
  showLabel = true,
  className
}: HealthScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const config = sizeConfig[size];
  const colors = getScoreColor(score);

  const radius = (config.size - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="relative" style={{ width: config.size, height: config.size }}>
        <svg
          width={config.size}
          height={config.size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            fill="none"
            className="text-white/10"
          />

          {/* Progress circle */}
          <motion.circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            stroke={colors.stroke}
            strokeWidth={config.strokeWidth}
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
            className={cn('font-bold', config.fontSize)}
            style={{ color: colors.stroke }}
          >
            {Math.round(animatedScore)}
          </motion.div>
          {showLabel && (
            <div className="text-xs text-gray-400 mt-1">Health Score</div>
          )}
        </div>
      </div>
    </div>
  );
}
