'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectionState } from '@/hooks/useSuggestionStream';

interface ConnectionStatusProps {
  /**
   * Current connection state
   */
  state: ConnectionState;

  /**
   * Number of reconnection attempts
   */
  reconnectAttempts?: number;

  /**
   * Whether to show the status indicator
   * @default true
   */
  show?: boolean;

  /**
   * Position of the indicator
   * @default 'bottom-right'
   */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

  /**
   * Callback when reconnect button is clicked
   */
  onReconnect?: () => void;
}

const stateConfig: Record<
  ConnectionState,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: string;
    showReconnect: boolean;
  }
> = {
  connecting: {
    label: 'Connecting...',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: '🔄',
    showReconnect: false,
  },
  connected: {
    label: 'Live',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: '✓',
    showReconnect: false,
  },
  disconnected: {
    label: 'Disconnected',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: '○',
    showReconnect: true,
  },
  error: {
    label: 'Connection Error',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: '⚠',
    showReconnect: true,
  },
};

const positionClasses = {
  'top-left': 'top-4 left-4',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-right': 'bottom-4 right-4',
};

/**
 * Connection Status Indicator Component
 *
 * Displays the current SSE connection state with visual feedback
 */
export function ConnectionStatus({
  state,
  reconnectAttempts = 0,
  show = true,
  position = 'bottom-right',
  onReconnect,
}: ConnectionStatusProps) {
  const config = stateConfig[state];

  // Auto-hide when connected after 3 seconds
  const [autoHide, setAutoHide] = React.useState(false);

  React.useEffect(() => {
    if (state === 'connected') {
      const timer = setTimeout(() => {
        setAutoHide(true);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setAutoHide(false);
      return undefined;
    }
  }, [state]);

  if (!show || (autoHide && state === 'connected')) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className={`fixed ${positionClasses[position]} z-50`}
      >
        <div
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg border shadow-sm
            ${config.bgColor} ${config.borderColor} ${config.color}
          `}
        >
          {/* Animated Icon */}
          <motion.div
            animate={
              state === 'connecting'
                ? {
                    rotate: 360,
                    transition: { duration: 1, repeat: Infinity, ease: 'linear' },
                  }
                : {}
            }
            className="text-sm"
          >
            {config.icon}
          </motion.div>

          {/* Status Label */}
          <span className="text-xs font-medium">{config.label}</span>

          {/* Reconnection Attempts */}
          {reconnectAttempts > 0 && (
            <span className="text-xs opacity-70">({reconnectAttempts})</span>
          )}

          {/* Reconnect Button */}
          {config.showReconnect && onReconnect && (
            <button
              onClick={onReconnect}
              className="ml-1 text-xs underline hover:no-underline focus:outline-none"
            >
              Retry
            </button>
          )}

          {/* Live Pulse Animation */}
          {state === 'connected' && (
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.5, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="w-2 h-2 rounded-full bg-green-500"
            />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Compact Connection Status Badge
 *
 * Smaller indicator suitable for inline use
 */
export function ConnectionBadge({ state }: { state: ConnectionState }) {
  const config = stateConfig[state];

  return (
    <div className="flex items-center gap-1.5">
      <motion.div
        animate={
          state === 'connected'
            ? {
                scale: [1, 1.2, 1],
                opacity: [1, 0.5, 1],
              }
            : state === 'connecting'
            ? {
                rotate: 360,
              }
            : {}
        }
        transition={
          state === 'connected'
            ? {
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : state === 'connecting'
            ? {
                duration: 1,
                repeat: Infinity,
                ease: 'linear',
              }
            : {}
        }
        className={`w-2 h-2 rounded-full ${
          state === 'connected'
            ? 'bg-green-500'
            : state === 'connecting'
            ? 'bg-yellow-500'
            : state === 'error'
            ? 'bg-red-500'
            : 'bg-gray-400'
        }`}
      />
      <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
    </div>
  );
}
