import {
  MessageSquare,
  Building2,
  FileText,
  Calculator,
  Globe,
  Zap,
  LucideIcon
} from 'lucide-react';

export interface Slide {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  accentFrom: string;
  accentTo: string;
}

export const slides: Slide[] = [
  {
    id: 'ai-assistant',
    icon: MessageSquare,
    title: 'AI Business Assistant',
    description: 'Ask anything about your finances, invoices, or taxes. Get instant answers powered by Claude AI.',
    accentFrom: 'from-blue-600',
    accentTo: 'to-purple-600',
  },
  {
    id: 'banking',
    icon: Building2,
    title: '10,000+ Bank Connections',
    description: 'Connect to banks across EU, UK & US. Automatic transaction import and smart categorization.',
    accentFrom: 'from-emerald-600',
    accentTo: 'to-teal-600',
  },
  {
    id: 'invoicing',
    icon: FileText,
    title: 'Smart Invoicing',
    description: 'Create professional invoices in seconds. Auto-send, track payments, and manage recurring billing.',
    accentFrom: 'from-orange-500',
    accentTo: 'to-amber-500',
  },
  {
    id: 'tax',
    icon: Calculator,
    title: 'Tax Compliance',
    description: 'VAT returns for Germany, Austria & UK. Never miss a deadline with proactive AI reminders.',
    accentFrom: 'from-red-500',
    accentTo: 'to-rose-500',
  },
  {
    id: 'currency',
    icon: Globe,
    title: 'Multi-Currency',
    description: 'Handle transactions in 150+ currencies. Real-time exchange rates and automatic conversion.',
    accentFrom: 'from-indigo-500',
    accentTo: 'to-blue-500',
  },
  {
    id: 'autopilot',
    icon: Zap,
    title: 'Autopilot Mode',
    description: 'AI handles routine tasks while you focus on growth. Email processing, categorization, reconciliation.',
    accentFrom: 'from-violet-500',
    accentTo: 'to-fuchsia-500',
  },
];
