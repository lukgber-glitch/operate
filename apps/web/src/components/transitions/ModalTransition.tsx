'use client';

import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ReactNode } from 'react';

interface ModalTransitionProps {
  children: ReactNode;
  isOpen: boolean;
  onClose?: () => void;
  className?: string;
  /**
   * Animation style for the modal
   */
  variant?: 'scale' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right';
}

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const scaleVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
  },
};

const slideUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 100,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: 100,
  },
};

const slideDownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -100,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -100,
  },
};

const slideLeftVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 100,
  },
  visible: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: 100,
  },
};

const slideRightVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -100,
  },
  visible: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: -100,
  },
};

/**
 * ModalTransition Component
 *
 * Provides smooth open/close animations for modals and dialogs.
 * Includes backdrop fade and content animation.
 *
 * @example
 * ```tsx
 * import { ModalTransition } from '@/components/transitions';
 *
 * function MyModal() {
 *   const [isOpen, setIsOpen] = useState(false);
 *
 *   return (
 *     <ModalTransition isOpen={isOpen} onClose={() => setIsOpen(false)}>
 *       <div className="bg-white p-6 rounded-lg">
 *         <h2>Modal Content</h2>
 *       </div>
 *     </ModalTransition>
 *   );
 * }
 * ```
 */
export function ModalTransition({
  children,
  isOpen,
  onClose,
  className,
  variant = 'scale',
}: ModalTransitionProps) {
  const variantsMap = {
    'scale': scaleVariants,
    'slide-up': slideUpVariants,
    'slide-down': slideDownVariants,
    'slide-left': slideLeftVariants,
    'slide-right': slideRightVariants,
  };

  const modalVariants = variantsMap[variant];

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            variants={backdropVariants}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            className={className}
            variants={modalVariants}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 300,
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * DrawerTransition Component
 *
 * Side drawer animation, slides in from the side.
 * Common for mobile menus and side panels.
 *
 * @example
 * ```tsx
 * <DrawerTransition isOpen={isMenuOpen} side="left">
 *   <nav>Menu items</nav>
 * </DrawerTransition>
 * ```
 */
interface DrawerTransitionProps {
  children: ReactNode;
  isOpen: boolean;
  onClose?: () => void;
  side?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
}

export function DrawerTransition({
  children,
  isOpen,
  onClose,
  side = 'right',
  className,
}: DrawerTransitionProps) {
  const drawerVariants: Record<string, Variants> = {
    left: {
      hidden: { x: '-100%' },
      visible: { x: 0 },
    },
    right: {
      hidden: { x: '100%' },
      visible: { x: 0 },
    },
    top: {
      hidden: { y: '-100%' },
      visible: { y: 0 },
    },
    bottom: {
      hidden: { y: '100%' },
      visible: { y: 0 },
    },
  };

  const sideClasses = {
    left: 'left-0 top-0 bottom-0',
    right: 'right-0 top-0 bottom-0',
    top: 'top-0 left-0 right-0',
    bottom: 'bottom-0 left-0 right-0',
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            variants={backdropVariants}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className={`absolute ${sideClasses[side]} ${className || ''}`}
            variants={drawerVariants[side]}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * TooltipTransition Component
 *
 * Lightweight animation for tooltips and popovers.
 *
 * @example
 * ```tsx
 * <TooltipTransition show={isHovered}>
 *   <div className="bg-gray-900 text-white px-2 py-1 rounded">
 *     Tooltip text
 *   </div>
 * </TooltipTransition>
 * ```
 */
interface TooltipTransitionProps {
  children: ReactNode;
  show: boolean;
  className?: string;
}

export function TooltipTransition({
  children,
  show,
  className
}: TooltipTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 5 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * DropdownTransition Component
 *
 * Dropdown menu animation with origin-aware scaling.
 *
 * @example
 * ```tsx
 * <DropdownTransition show={isOpen}>
 *   <ul className="bg-white shadow-lg rounded-lg">
 *     <li>Item 1</li>
 *     <li>Item 2</li>
 *   </ul>
 * </DropdownTransition>
 * ```
 */
export function DropdownTransition({
  children,
  show,
  className
}: TooltipTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{
            duration: 0.2,
            ease: [0.16, 1, 0.3, 1] // Custom easing for smooth dropdown
          }}
          className={className}
          style={{ transformOrigin: 'top' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
