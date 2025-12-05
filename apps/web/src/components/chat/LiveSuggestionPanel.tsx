'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSuggestionStreamContext } from './SuggestionStreamProvider';
import { Suggestion } from '@/hooks/useSuggestionStream';
import { ConnectionBadge } from '@/components/suggestions/ConnectionStatus';

interface LiveSuggestionPanelProps {
  /**
   * Maximum number of suggestions to display
   * @default 5
   */
  maxSuggestions?: number;

  /**
   * Callback when a suggestion is clicked
   */
  onSuggestionClick?: (suggestion: Suggestion) => void;

  /**
   * Whether to show the connection badge
   * @default true
   */
  showConnectionBadge?: boolean;
}

const suggestionTypeConfig = {
  classification: {
    label: 'Classification',
    icon: '🏷️',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  deduction: {
    label: 'Deduction',
    icon: '💰',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  optimization: {
    label: 'Optimization',
    icon: '⚡',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  alert: {
    label: 'Alert',
    icon: '⚠️',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
};

/**
 * Live Suggestion Panel Component
 *
 * Displays real-time AI suggestions from the SSE stream
 */
export function LiveSuggestionPanel({
  maxSuggestions = 5,
  onSuggestionClick,
  showConnectionBadge = true,
}: LiveSuggestionPanelProps) {
  const { suggestions, connectionState, isConnected } = useSuggestionStreamContext();

  // Show only the most recent suggestions
  const recentSuggestions = React.useMemo(() => {
    return suggestions
      .filter((s) => s.actionable)
      .slice(-maxSuggestions)
      .reverse();
  }, [suggestions, maxSuggestions]);

  if (recentSuggestions.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          {showConnectionBadge && <ConnectionBadge state={connectionState} />}
        </div>
        <p className="text-sm text-gray-500">
          {isConnected
            ? 'No suggestions yet. I\'ll notify you when I find something!'
            : 'Waiting for connection...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <h3 className="text-sm font-semibold text-gray-900">Live Suggestions</h3>
        {showConnectionBadge && <ConnectionBadge state={connectionState} />}
      </div>

      {/* Suggestions List */}
      <div className="space-y-2 px-4 pb-4">
        <AnimatePresence mode="popLayout">
          {recentSuggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onClick={onSuggestionClick}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface SuggestionCardProps {
  suggestion: Suggestion;
  onClick?: (suggestion: Suggestion) => void;
}

function SuggestionCard({ suggestion, onClick }: SuggestionCardProps) {
  const config = suggestionTypeConfig[suggestion.type];
  const confidencePercent = Math.round(suggestion.confidence * 100);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className={`
        relative rounded-lg border p-3 cursor-pointer
        transition-all hover:shadow-md
        ${config.bgColor} ${config.borderColor}
      `}
      onClick={() => onClick?.(suggestion)}
    >
      {/* Type Badge */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{config.icon}</span>
        <span className={`text-xs font-medium ${config.color}`}>
          {config.label}
        </span>
        {/* Confidence Badge */}
        <div
          className={`
            ml-auto px-2 py-0.5 rounded-full text-xs font-medium
            ${
              confidencePercent >= 90
                ? 'bg-green-100 text-green-700'
                : confidencePercent >= 70
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-700'
            }
          `}
        >
          {confidencePercent}%
        </div>
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-gray-900 mb-1">
        {suggestion.title}
      </h4>

      {/* Description */}
      <p className="text-xs text-gray-600 line-clamp-2">
        {suggestion.description}
      </p>

      {/* Metadata */}
      {suggestion.metadata && Object.keys(suggestion.metadata).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {Object.entries(suggestion.metadata)
            .slice(0, 2)
            .map(([key, value]) => (
              <span
                key={key}
                className="px-1.5 py-0.5 text-xs bg-white/50 rounded border border-gray-200"
              >
                {key}: {String(value)}
              </span>
            ))}
        </div>
      )}

      {/* Action Indicator */}
      {suggestion.actionable && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500"
        />
      )}
    </motion.div>
  );
}

/**
 * Compact Live Suggestion Counter
 *
 * Shows just the count of active suggestions
 */
export function LiveSuggestionCounter() {
  const { suggestions, isConnected } = useSuggestionStreamContext();

  const actionableCount = suggestions.filter((s) => s.actionable).length;

  if (!isConnected || actionableCount === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="relative"
    >
      <div className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
        {actionableCount}
      </div>
      {/* Pulse animation */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [1, 0, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 bg-blue-500 rounded-full"
      />
    </motion.div>
  );
}
