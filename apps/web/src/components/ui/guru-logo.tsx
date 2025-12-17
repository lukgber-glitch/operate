'use client';

import { cn } from '@/lib/utils';

interface GuruLogoProps {
  size?: number;
  className?: string;
  variant?: 'colored' | 'light' | 'dark';
}

/**
 * GuruLogo - Static guru meditation logo for branding
 *
 * Use this for navigation, headers, and static logo display.
 * For loading states, use GuruLoader instead.
 *
 * @param variant - 'colored' (default, brand purple), 'light' (white, for dark backgrounds), 'dark' (dark, for light backgrounds)
 */
export function GuruLogo({ size = 32, className, variant = 'colored' }: GuruLogoProps) {
  // Color definitions based on variant
  const colors = {
    colored: '#36356e',
    light: '#ffffff',
    dark: '#36356e',
  };

  const fillColor = colors[variant];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      aria-label="Operate logo"
      role="img"
    >
      <g>
        <g id="Layer_1">
          <g id="guru">
            <path
              fill={fillColor}
              d="M61,46.7c0,3.4-7.2,17.5-10.7,17.4-.6,0-1.4-1.1-2-1.7-9.1-10.5-9.1-16.7-9.2-28.3-.2-2,.5-4.8-.9-6.2-1.9-1.7-1.5-3.7.5-4.9.5-.5.4-1.3.4-2-.8-9,8.4-12.8,15.3-10.8,4,1.1,7,4.3,7.2,8.7,0,1.4-.2,3,.4,3.9.4.8,1.2,1.3,1.4,2.2,0,.6,0,1.3-.4,1.9-3.8,4.4-.7,13.7-2,19.9h0ZM50.4,31.1c-2.3-.2-5.3,1.3-6.3,3.5-.9,1.8-.5,3.4,1.2,2.7,1-.7,1.7-2,2.9-2.5,1.9-1.1,4.6-.8,5.9,1.1,5.2,5.1,4.7-4.7-3.5-4.8,0,0-.2,0-.2,0Z"
            />
            <path
              fill={fillColor}
              d="M37.2,77.9c-17.8-9.4-15.5-.5-13.1-23.3,1-6,6.7-13,12.9-15,.8,0,.9,1.7,1,2.8.2,19.4,16.2,21.6,11,27.7s-6.5,10.2-11.6,7.9h-.2Z"
            />
            <path
              fill={fillColor}
              d="M73.8,74.1c-6.7,3.5-15.1,8.9-23.6,11.7s-1.9.8-1.9,1.6c0,1.2.2,1.5,5.8,1.4,3.1,0,5.6,0,8.6-.2h8.5c9,0,9.9,0,12.6-5.5,2.7-6.2-3.8-14-10-9h0Z"
            />
            <path
              fill={fillColor}
              d="M49.7,84.7c-.8.4-29.9,10.8-34.9.4-1.6-3.8,0-8.7,4-10.1,5.5-2.5,14.2,2.6,19.4,4.7,2.9,1.1,6.8,1.6,9.5,2.1,3,.5,4.1,1.6,2,2.9h0Z"
            />
            <path
              fill={fillColor}
              d="M75.2,71.7c-6.2,3.2-12.3,7-18.6,10.1-4.2,1-8.8-1.5-13.1-2.3-1.4-.4-.5-1.4.2-2.1,7.8-7.3,15.1-16.2,18.5-26.1.7-2.5.4-5.1.6-7.5.3-4.2,4.6-.9,6.4.3,8.3,5.2,6.9,15.9,7.2,24.6,0,1.1-.2,2.3-1.1,3h0Z"
            />
          </g>
        </g>
      </g>
    </svg>
  );
}

export default GuruLogo;
