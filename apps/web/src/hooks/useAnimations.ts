import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Hook for triggering success animation
 * Returns a function that triggers success state and automatically resets after duration
 */
export function useSuccessAnimation(duration: number = 1000) {
  const [success, setSuccess] = useState(false);

  const trigger = useCallback(() => {
    setSuccess(true);
    const timer = setTimeout(() => setSuccess(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  return [success, trigger] as const;
}

/**
 * Hook for triggering error animation
 * Returns a function that triggers error state and automatically resets after duration
 */
export function useErrorAnimation(duration: number = 500) {
  const [error, setError] = useState(false);

  const trigger = useCallback(() => {
    setError(true);
    const timer = setTimeout(() => setError(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  return [error, trigger] as const;
}

/**
 * Hook for managing loading state with minimum display time
 * Ensures loading spinner shows for at least minDuration ms for better UX
 */
export function useLoadingAnimation(minDuration: number = 300) {
  const [isLoading, setIsLoading] = useState(false);
  const [actuallyLoading, setActuallyLoading] = useState(false);
  const startTimeRef = useRef<number | null>(null);

  const startLoading = useCallback(() => {
    startTimeRef.current = Date.now();
    setIsLoading(true);
    setActuallyLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setActuallyLoading(false);

    if (startTimeRef.current) {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, minDuration - elapsed);

      if (remaining > 0) {
        setTimeout(() => setIsLoading(false), remaining);
      } else {
        setIsLoading(false);
      }

      startTimeRef.current = null;
    } else {
      setIsLoading(false);
    }
  }, [minDuration]);

  return { isLoading, actuallyLoading, startLoading, stopLoading };
}

/**
 * Hook for staggered list animations
 * Returns a function to get the stagger index for each item
 */
export function useStaggerAnimation(delay: number = 50) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getStaggerProps = useCallback((index: number) => {
    if (!mounted) return {};

    return {
      className: 'stagger-item',
      style: { animationDelay: `${index * delay}ms` },
    };
  }, [mounted, delay]);

  return getStaggerProps;
}

/**
 * Hook for ripple effect animation
 * Returns a ref and trigger function for ripple effect on click
 */
export function useRippleAnimation() {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  const trigger = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, 600);
  }, []);

  return { ripples, trigger };
}

/**
 * Hook for entrance animations
 * Triggers entrance animation when component mounts or condition changes
 */
export function useEntranceAnimation(
  type: 'fade-in' | 'slide-in-up' | 'slide-in-down' | 'scale-in' = 'fade-in',
  delay: number = 0
) {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShouldAnimate(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const className = shouldAnimate ? `animate-${type}` : 'opacity-0';

  return className;
}

/**
 * Hook for toggling animations with cooldown
 * Prevents rapid re-triggering of animations
 */
export function useAnimationTrigger(cooldown: number = 500) {
  const [isAnimating, setIsAnimating] = useState(false);
  const cooldownRef = useRef(false);

  const trigger = useCallback(() => {
    if (cooldownRef.current) return false;

    setIsAnimating(true);
    cooldownRef.current = true;

    setTimeout(() => {
      setIsAnimating(false);
    }, cooldown);

    setTimeout(() => {
      cooldownRef.current = false;
    }, cooldown + 100);

    return true;
  }, [cooldown]);

  const reset = useCallback(() => {
    setIsAnimating(false);
    cooldownRef.current = false;
  }, []);

  return { isAnimating, trigger, reset };
}

/**
 * Hook for form validation feedback animations
 * Manages success, error, and loading states with animations
 */
export function useFormAnimation() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setLoading = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStatus('loading');
  }, []);

  const setSuccess = useCallback((duration: number = 2000) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStatus('success');
    timeoutRef.current = setTimeout(() => setStatus('idle'), duration);
  }, []);

  const setError = useCallback((duration: number = 2000) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStatus('error');
    timeoutRef.current = setTimeout(() => setStatus('idle'), duration);
  }, []);

  const reset = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStatus('idle');
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return {
    status,
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    setLoading,
    setSuccess,
    setError,
    reset,
  };
}
