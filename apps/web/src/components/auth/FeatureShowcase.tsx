'use client';

import { motion } from 'framer-motion';
import {
  MessageSquare,
  Building2,
  FileText,
  Calculator,
  Globe,
  Zap
} from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    title: 'AI Business Assistant',
    description: 'Ask anything about your finances, invoices, or taxes',
  },
  {
    icon: Building2,
    title: 'Bank Connections',
    description: 'Connect 10,000+ banks across EU, UK & US',
  },
  {
    icon: FileText,
    title: 'Smart Invoicing',
    description: 'Create, send & track invoices automatically',
  },
  {
    icon: Calculator,
    title: 'Tax Compliance',
    description: 'VAT returns for Germany, Austria & UK',
  },
  {
    icon: Globe,
    title: 'Multi-Currency',
    description: 'Handle transactions in any currency',
  },
  {
    icon: Zap,
    title: 'Autopilot Mode',
    description: 'AI handles routine tasks while you focus on growth',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 20,
    },
  },
};

export function FeatureShowcase() {
  return (
    <motion.div
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Everything you need to run your business
        </h2>
        <p className="text-gray-300/80 text-sm">
          Join thousands of businesses automating their finances
        </p>
      </motion.div>

      <div className="space-y-3">
        {features.map((feature) => (
          <motion.div
            key={feature.title}
            variants={itemVariants}
            className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <feature.icon className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-medium text-sm">{feature.title}</h3>
              <p className="text-gray-400 text-xs mt-0.5">{feature.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
