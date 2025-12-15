import { Variants, Transition } from 'framer-motion';

/**
 * AURA Design System - Animation Variants
 * Reusable animation patterns following the AURA spec
 */

// ============================================================================
// SPRING CONFIGURATIONS
// ============================================================================

/** Standard spring config for smooth, natural animations */
export const springConfig: Transition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
  mass: 0.5,
};

/** Bouncy spring config for playful interactions */
export const springBouncy: Transition = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 25,
};

/** Smooth spring config for gentle animations */
export const springSmooth: Transition = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 22,
};

/** Quick spring config for responsive interactions */
export const springQuick: Transition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};

// ============================================================================
// FADE ANIMATIONS
// ============================================================================

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const fadeUp: Variants = {
  hidden: { y: 24, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: springSmooth
  }
};

// ============================================================================
// SCALE ANIMATIONS
// ============================================================================

export const scaleIn: Variants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: springConfig
  },
};

export const scaleInBounce: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: springBouncy
  },
};

// ============================================================================
// SLIDE ANIMATIONS
// ============================================================================

export const slideInLeft: Variants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: springSmooth
  }
};

export const slideUp: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: springConfig
  },
};

export const slideDown: Variants = {
  hidden: { y: -20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: springConfig
  },
};

export const slideRight: Variants = {
  hidden: { x: '100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: springConfig
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.2 }
  },
};

// ============================================================================
// INTERACTION ANIMATIONS
// ============================================================================

export const hoverScale = {
  scale: 1.02,
  transition: springQuick
};

export const hoverLift = {
  y: -4,
  boxShadow: 'var(--shadow-lg)',
  transition: springConfig
};

export const tapScale = {
  scale: 0.98,
  transition: { duration: 0.1 }
};

export const iconTap = {
  scale: 0.9,
  transition: { duration: 0.1 }
};

// ============================================================================
// STAGGER ANIMATIONS
// ============================================================================

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    }
  }
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    }
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springConfig
  },
};

// ============================================================================
// COMPONENT-SPECIFIC ANIMATIONS
// ============================================================================

/** Chevron rotation for expandable items */
export const chevronRotate: Variants = {
  collapsed: { rotate: 0 },
  expanded: { rotate: 180, transition: springConfig },
};

/** Checkbox check mark animation */
export const checkMark: Variants = {
  unchecked: { scale: 0, opacity: 0 },
  checked: {
    scale: 1,
    opacity: 1,
    transition: springBouncy
  }
};

/** Checkbox box bounce on check */
export const checkboxBox: Variants = {
  unchecked: { scale: 1 },
  checked: {
    scale: [1, 1.1, 1],
    transition: { duration: 0.2 }
  }
};

/** Dialog entrance animation */
export const dialogContent: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springConfig
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 }
  }
};

/** Dropdown menu animation */
export const dropdownMenu: Variants = {
  hidden: {
    opacity: 0,
    y: -10,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springQuick
  }
};

/** Nav item hover effect */
export const navItemHover = {
  x: 2,
  backgroundColor: 'rgba(0, 0, 0, 0.05)',
  transition: springConfig
};

/** Mobile nav active indicator */
export const mobileNavIndicator = (activeIndex: number, totalItems: number) => ({
  x: `${(activeIndex * 100) / totalItems}%`,
  transition: springQuick
});

// ============================================================================
// ERROR ANIMATIONS
// ============================================================================

/** Error shake animation */
export const errorShake: Variants = {
  error: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 }
  }
};

// ============================================================================
// LOADING ANIMATIONS
// ============================================================================

/** Skeleton shimmer effect */
export const skeletonShimmer = {
  backgroundPosition: ['200% 0', '-200% 0'],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'linear' as const
  }
};

/** Spinner rotation */
export const spinnerRotation = {
  rotate: 360,
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: 'linear' as const
  }
};

// ============================================================================
// DESIGN TOKENS
// ============================================================================

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
