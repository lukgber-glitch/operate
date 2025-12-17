'use client';

import { cn } from '@/lib/utils';

interface GuruLoaderProps {
  size?: number;
  className?: string;
}

/**
 * GuruLoader - Animated loading indicator with pulsing guru logo
 *
 * Features:
 * - Guru meditation figure as base
 * - Subtle pulse animation for zen-like effect
 * - Configurable size
 * - Accessible with aria attributes
 */
export function GuruLoader({ size = 100, className }: GuruLoaderProps) {
  return (
    <div
      className={cn('inline-flex items-center justify-center', className)}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="guru-loader"
      >
        <defs>
          <style>
            {`
              @keyframes guru-pulse {
                0%, 100% {
                  opacity: 1;
                  transform: scale(1);
                }
                50% {
                  opacity: 0.7;
                  transform: scale(0.98);
                }
              }

              @keyframes guru-glow {
                0%, 100% {
                  filter: drop-shadow(0 0 2px rgba(54, 53, 110, 0.3));
                }
                50% {
                  filter: drop-shadow(0 0 8px rgba(54, 53, 110, 0.6));
                }
              }

              .guru-animated {
                fill: #36356e;
                animation: guru-pulse 2s ease-in-out infinite, guru-glow 2s ease-in-out infinite;
                transform-origin: center center;
              }
            `}
          </style>
        </defs>

        <g className="guru-animated">
          <g id="Layer_1">
            <g id="guru">
              <path
                d="M61,46.7c0,3.4-7.2,17.5-10.7,17.4-.6,0-1.4-1.1-2-1.7-9.1-10.5-9.1-16.7-9.2-28.3-.2-2,.5-4.8-.9-6.2-1.9-1.7-1.5-3.7.5-4.9.5-.5.4-1.3.4-2-.8-9,8.4-12.8,15.3-10.8,4,1.1,7,4.3,7.2,8.7,0,1.4-.2,3,.4,3.9.4.8,1.2,1.3,1.4,2.2,0,.6,0,1.3-.4,1.9-3.8,4.4-.7,13.7-2,19.9h0ZM50.4,31.1c-2.3-.2-5.3,1.3-6.3,3.5-.9,1.8-.5,3.4,1.2,2.7,1-.7,1.7-2,2.9-2.5,1.9-1.1,4.6-.8,5.9,1.1,5.2,5.1,4.7-4.7-3.5-4.8,0,0-.2,0-.2,0Z"
              />
              <path
                d="M37.2,77.9c-17.8-9.4-15.5-.5-13.1-23.3,1-6,6.7-13,12.9-15,.8,0,.9,1.7,1,2.8.2,19.4,16.2,21.6,11,27.7s-6.5,10.2-11.6,7.9h-.2Z"
              />
              <path
                d="M73.8,74.1c-6.7,3.5-15.1,8.9-23.6,11.7s-1.9.8-1.9,1.6c0,1.2.2,1.5,5.8,1.4,3.1,0,5.6,0,8.6-.2h8.5c9,0,9.9,0,12.6-5.5,2.7-6.2-3.8-14-10-9h0Z"
              />
              <path
                d="M49.7,84.7c-.8.4-29.9,10.8-34.9.4-1.6-3.8,0-8.7,4-10.1,5.5-2.5,14.2,2.6,19.4,4.7,2.9,1.1,6.8,1.6,9.5,2.1,3,.5,4.1,1.6,2,2.9h0Z"
              />
              <path
                d="M75.2,71.7c-6.2,3.2-12.3,7-18.6,10.1-4.2,1-8.8-1.5-13.1-2.3-1.4-.4-.5-1.4.2-2.1,7.8-7.3,15.1-16.2,18.5-26.1.7-2.5.4-5.1.6-7.5.3-4.2,4.6-.9,6.4.3,8.3,5.2,6.9,15.9,7.2,24.6,0,1.1-.2,2.3-1.1,3h0Z"
              />
            </g>
          </g>
        </g>
      </svg>

      <span className="sr-only">Loading, please wait...</span>
    </div>
  );
}

export default GuruLoader;
