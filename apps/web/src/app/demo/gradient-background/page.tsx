'use client';

import { useState } from 'react';
import { GradientBackground, GradientBlob } from '@/components/animation';

export default function GradientBackgroundDemo() {
  const [intensity, setIntensity] = useState<'subtle' | 'medium' | 'vibrant'>('subtle');
  const [showBlobs, setShowBlobs] = useState(true);
  const [customMode, setCustomMode] = useState(false);

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      {!customMode && <GradientBackground intensity={intensity} disabled={!showBlobs} />}

      {/* Custom blobs mode */}
      {customMode && showBlobs && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
          <GradientBlob
            color="#06BF9D"
            size={50}
            blur={180}
            opacity={0.4}
            duration={60}
            delay={0}
            path="figure8"
            className="top-[20%] left-[20%]"
          />
          <GradientBlob
            color="#48D9BE"
            size={35}
            blur={140}
            opacity={0.3}
            duration={45}
            delay={5}
            path="circular"
            className="top-[60%] right-[15%]"
          />
          <GradientBlob
            color="#84D9C9"
            size={40}
            blur={160}
            opacity={0.35}
            duration={50}
            delay={10}
            path="organic"
            className="bottom-[20%] left-[40%]"
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold mb-4">Gradient Background Demo</h1>
            <p className="text-lg text-text-secondary">
              Showcase of the GSAP-powered gradient mesh background
            </p>
          </div>

          {/* Controls */}
          <div className="bg-surface/80 backdrop-blur-sm rounded-token-lg p-8 mb-8 border border-border-default">
            <h2 className="text-2xl font-semibold mb-6">Controls</h2>

            {/* Toggle visibility */}
            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBlobs}
                  onChange={(e) => setShowBlobs(e.target.checked)}
                  className="w-5 h-5"
                />
                <span className="text-base font-medium">Show Background</span>
              </label>
            </div>

            {/* Mode toggle */}
            <div className="mb-6">
              <label className="text-sm font-medium mb-3 block">Mode</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setCustomMode(false)}
                  className={`px-4 py-2 rounded-token-md transition-colors ${
                    !customMode
                      ? 'bg-brand-primary text-white'
                      : 'bg-surface border border-border-default'
                  }`}
                >
                  Default (Organic)
                </button>
                <button
                  onClick={() => setCustomMode(true)}
                  className={`px-4 py-2 rounded-token-md transition-colors ${
                    customMode
                      ? 'bg-brand-primary text-white'
                      : 'bg-surface border border-border-default'
                  }`}
                >
                  Custom Patterns
                </button>
              </div>
            </div>

            {/* Intensity control (only for default mode) */}
            {!customMode && (
              <div className="mb-6">
                <label className="text-sm font-medium mb-3 block">
                  Intensity: <span className="text-brand-primary">{intensity}</span>
                </label>
                <div className="flex gap-3">
                  {(['subtle', 'medium', 'vibrant'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setIntensity(level)}
                      className={`px-4 py-2 rounded-token-md transition-colors capitalize ${
                        intensity === level
                          ? 'bg-brand-primary text-white'
                          : 'bg-surface border border-border-default'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pattern info (for custom mode) */}
            {customMode && (
              <div className="mt-4 p-4 bg-info/10 rounded-token-md border border-info/20">
                <h3 className="font-semibold mb-2">Custom Patterns</h3>
                <ul className="text-sm space-y-1 text-text-secondary">
                  <li>• Top-left blob: Figure-8 pattern (60s cycle)</li>
                  <li>• Right blob: Circular pattern (45s cycle)</li>
                  <li>• Bottom blob: Organic pattern (50s cycle)</li>
                </ul>
              </div>
            )}
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-surface/80 backdrop-blur-sm rounded-token-lg p-6 border border-border-default">
              <h3 className="text-xl font-semibold mb-3">Performance</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>✓ GPU-accelerated transforms</li>
                <li>✓ 60fps on most devices</li>
                <li>✓ Pauses when tab hidden</li>
                <li>✓ Mobile optimized</li>
              </ul>
            </div>

            <div className="bg-surface/80 backdrop-blur-sm rounded-token-lg p-6 border border-border-default">
              <h3 className="text-xl font-semibold mb-3">Accessibility</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>✓ Respects prefers-reduced-motion</li>
                <li>✓ Low-end device detection</li>
                <li>✓ ARIA hidden</li>
                <li>✓ Dark mode support</li>
              </ul>
            </div>
          </div>

          {/* Color Palette */}
          <div className="bg-surface/80 backdrop-blur-sm rounded-token-lg p-8 border border-border-default">
            <h3 className="text-xl font-semibold mb-4">Brand Colors</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div
                  className="h-24 rounded-token-md mb-2"
                  style={{ backgroundColor: '#06BF9D' }}
                />
                <p className="text-sm font-medium">Primary</p>
                <p className="text-xs text-text-secondary">#06BF9D</p>
              </div>
              <div>
                <div
                  className="h-24 rounded-token-md mb-2"
                  style={{ backgroundColor: '#48D9BE' }}
                />
                <p className="text-sm font-medium">Secondary</p>
                <p className="text-xs text-text-secondary">#48D9BE</p>
              </div>
              <div>
                <div
                  className="h-24 rounded-token-md mb-2"
                  style={{ backgroundColor: '#84D9C9' }}
                />
                <p className="text-sm font-medium">Tertiary</p>
                <p className="text-xs text-text-secondary">#84D9C9</p>
              </div>
            </div>
          </div>

          {/* Code Example */}
          <div className="mt-8 bg-surface/80 backdrop-blur-sm rounded-token-lg p-8 border border-border-default">
            <h3 className="text-xl font-semibold mb-4">Usage</h3>
            <pre className="bg-black/5 dark:bg-white/5 p-4 rounded-token-md overflow-x-auto text-sm">
              <code>{`import { GradientBackground } from '@/components/animation';

// Basic usage (already in layout.tsx)
<GradientBackground />

// With intensity control
<GradientBackground intensity="${intensity}" />`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
