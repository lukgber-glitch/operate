/**
 * WelcomeBackground Component
 * Premium animated gradient background with navy base, blurple/cyan accents, and skewed geometric section
 * Inspired by Stripe's geometric gradient system
 */

'use client'

import * as React from 'react'

export function WelcomeBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base navy gradient layer */}
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(99, 91, 255, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(2, 188, 245, 0.15) 0%, transparent 50%),
            linear-gradient(135deg, #0a2540 0%, #1a3a5a 100%)
          `,
        }}
      />

      {/* Animated gradient overlay - 15s cycle */}
      <div
        className="absolute inset-0 animate-gradient-shift"
        style={{
          background: 'linear-gradient(45deg, #635bff, #02bcf5, #ff7600)',
          backgroundSize: '400% 400%',
          opacity: 0.1,
          mixBlendMode: 'overlay',
        }}
      />
    </div>
  )
}
