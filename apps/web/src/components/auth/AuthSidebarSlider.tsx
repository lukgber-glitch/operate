'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { slides } from './slides/slideData';

export function AuthSidebarSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance slides
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const currentSlide = slides[currentIndex];

  // Safety check (should never happen but TypeScript needs it)
  if (!currentSlide) {
    return null;
  }

  const Icon = currentSlide.icon;

  return (
    <div
      className="h-full w-full flex flex-col"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main slide area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Background gradient - animates with slide */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`bg-${currentSlide.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className={cn(
              'absolute inset-0 bg-gradient-to-br',
              currentSlide.accentFrom,
              currentSlide.accentTo
            )}
          />
        </AnimatePresence>

        {/* Static pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dot-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dot-pattern)" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-8 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1]
              }}
              className="flex flex-col items-center"
            >
              {/* Icon */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className={cn(
                  'w-20 h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6 shadow-2xl',
                  currentSlide.accentFrom,
                  currentSlide.accentTo
                )}
              >
                <Icon className="w-10 h-10 text-white" />
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-2xl font-bold text-white mb-3"
              >
                {currentSlide.title}
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-gray-300 text-base leading-relaxed max-w-xs"
              >
                {currentSlide.description}
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="py-6 flex justify-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => goToSlide(index)}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              currentIndex === index
                ? 'bg-white w-8'
                : 'bg-white/40 hover:bg-white/60 w-2'
            )}
            aria-label={`Go to slide ${index + 1}: ${slide.title}`}
          />
        ))}
      </div>

      {/* Bottom tagline */}
      <div className="pb-8 px-8 text-center">
        <p className="text-gray-400 text-sm">
          Everything you need to run your business
        </p>
        <p className="text-gray-500 text-xs mt-1">
          Join thousands of businesses automating their finances
        </p>
      </div>
    </div>
  );
}
