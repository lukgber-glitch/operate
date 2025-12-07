import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

// Register plugins (only on client-side)
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

// Export GSAP core
export { gsap, ScrollTrigger, useGSAP };

// Export animation functions (excluding AnimationOptions which is in types)
export {
  fadeIn,
  fadeOut,
  slideIn,
  slideOut,
  scaleIn,
  staggerIn,
  morphTo,
  type SlideDirection,
} from './animations';

// Export components
export * from './components';

// Export hooks
export * from './hooks';

// Export types (canonical source for AnimationOptions)
export * from './types';
