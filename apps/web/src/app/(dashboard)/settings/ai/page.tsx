'use client';

import { motion } from 'framer-motion';

import { AISettings } from '@/components/settings/AISettings';
import { Card, CardContent } from '@/components/ui/card';
import { GlassCard } from '@/components/ui/glass-card';
import { fadeUp, staggerContainer } from '@/lib/animation-variants';

/**
 * AI Settings Page
 *
 * Provides user controls for AI consent and data processing.
 * Accessible from Settings > AI Processing
 */
export default function AISettingsPage() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="container max-w-4xl py-6 space-y-6"
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl text-white font-semibold tracking-tight">AI Processing</h1>
        <p className="text-white/70">Configure AI processing and data usage preferences</p>
      </motion.div>
      <motion.div variants={fadeUp}>
        <GlassCard padding="lg">
            <AISettings />
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
