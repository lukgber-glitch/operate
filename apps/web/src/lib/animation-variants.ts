import { Variants } from 'framer-motion';

export const fadeUp: Variants = {
  hidden: { y: 24, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 260, damping: 22 }
  }
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 }
  }
};

export const scaleIn: Variants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 260, damping: 22 }
  }
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12
    }
  }
};

export const slideInLeft: Variants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 260, damping: 22 }
  }
};

export const hoverScale = {
  scale: 1.02,
  transition: { type: 'spring', stiffness: 400, damping: 17 }
};

export const tapScale = {
  scale: 0.98
};

// Design tokens
export const designTokens = {
  colors: {
    navy800: '#0a2540',
    navy700: '#1a3a5a',
    blurple: '#635bff',
    cyan: '#02bcf5',
    orange: '#ff7600'
  },
  gradients: {
    navyGradient: 'linear-gradient(135deg, #0a2540 0%, #1a3a5a 100%)',
    blurpleGlow: 'radial-gradient(circle at 50% 50%, rgba(99, 91, 255, 0.15) 0%, transparent 70%)'
  }
};
