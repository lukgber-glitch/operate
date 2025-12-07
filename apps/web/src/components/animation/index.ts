/**
 * Animation Components and Utilities
 *
 * Exports all animation-related components for the Operate app
 */

// Existing exports
export { GradientBackground } from './gradient-background';
export { GradientBlob } from './GradientBlob';
export { LogoEntrance } from './LogoEntrance';
export { LogoMorph } from './LogoMorph';

// Page transition system exports
export { TransitionProvider, useTransitionContext } from './TransitionProvider';
export { PageTransition, type PageTransitionProps } from './PageTransition';
export { MorphButton, MorphTarget, type MorphButtonProps } from './MorphButton';
