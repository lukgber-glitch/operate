/**
 * Dashboard Integration Example
 *
 * This example shows how to integrate AnimatedGrid and PageTransition
 * into the dashboard for smooth card animations.
 *
 * To use: Apply this pattern to apps/web/src/app/(dashboard)/page.tsx
 */

'use client';

import { usePathname } from 'next/navigation';
import {
  PageTransition,
  AnimatedGrid,
  AnimatedGridItem,
  ScaleList,
  ScaleListItem,
  ModalTransition,
} from '@/components/transitions';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// Example dashboard card types
interface DashboardCard {
  id: string;
  title: string;
  value: string | number;
  change?: number;
  icon: string;
  color: string;
}

// Example stat card component
function StatCard({ card }: { card: DashboardCard }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {card.title}
        </h3>
        <span className={`text-2xl ${card.color}`}>{card.icon}</span>
      </div>
      <div className="text-3xl font-bold">{card.value}</div>
      {card.change !== undefined && (
        <div
          className={`text-sm mt-2 ${
            card.change >= 0 ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {card.change >= 0 ? '↑' : '↓'} {Math.abs(card.change)}%
        </div>
      )}
    </div>
  );
}

// Example chart card component
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}

// Example recent activity item
interface ActivityItem {
  id: string;
  type: 'invoice' | 'payment' | 'client' | 'expense';
  description: string;
  time: string;
  amount?: string;
}

function ActivityItem({ item }: { item: ActivityItem }) {
  const icons = {
    invoice: '📄',
    payment: '💰',
    client: '👤',
    expense: '🛒',
  };

  return (
    <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icons[item.type]}</span>
        <div>
          <p className="font-medium">{item.description}</p>
          <p className="text-sm text-gray-500">{item.time}</p>
        </div>
      </div>
      {item.amount && (
        <span className="font-semibold text-green-600">{item.amount}</span>
      )}
    </div>
  );
}

/**
 * Main Dashboard Component
 */
export function DashboardExample() {
  const pathname = usePathname();
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  const statCards: DashboardCard[] = [
    {
      id: '1',
      title: 'Total Revenue',
      value: '€45,231',
      change: 12.5,
      icon: '💰',
      color: 'text-green-600',
    },
    {
      id: '2',
      title: 'Active Clients',
      value: 24,
      change: 8.2,
      icon: '👥',
      color: 'text-blue-600',
    },
    {
      id: '3',
      title: 'Pending Invoices',
      value: 8,
      change: -3.1,
      icon: '📄',
      color: 'text-orange-600',
    },
    {
      id: '4',
      title: 'Outstanding',
      value: '€12,450',
      change: 5.4,
      icon: '⏱️',
      color: 'text-purple-600',
    },
  ];

  const recentActivity: ActivityItem[] = [
    {
      id: '1',
      type: 'invoice',
      description: 'Invoice #INV-1234 sent to Client A',
      time: '2 hours ago',
      amount: '€1,250',
    },
    {
      id: '2',
      type: 'payment',
      description: 'Payment received from Client B',
      time: '4 hours ago',
      amount: '€3,400',
    },
    {
      id: '3',
      type: 'client',
      description: 'New client added: Company XYZ',
      time: '5 hours ago',
    },
    {
      id: '4',
      type: 'expense',
      description: 'Office supplies expense recorded',
      time: '1 day ago',
      amount: '€145',
    },
  ];

  return (
    <PageTransition pageKey={pathname}>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome back! Here's what's happening.
            </p>
          </div>
          <Button onClick={() => setIsQuickActionOpen(true)}>
            Quick Action
          </Button>
        </div>

        {/* Stat Cards with Grid Animation */}
        <AnimatedGrid
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          staggerDelay={0.05}
        >
          {statCards.map((card) => (
            <AnimatedGridItem key={card.id}>
              <StatCard card={card} />
            </AnimatedGridItem>
          ))}
        </AnimatedGrid>

        {/* Charts Section */}
        <AnimatedGrid
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          staggerDelay={0.08}
        >
          <AnimatedGridItem>
            <ChartCard title="Revenue Overview">
              <div className="h-64 flex items-center justify-center text-gray-400">
                Chart placeholder
              </div>
            </ChartCard>
          </AnimatedGridItem>

          <AnimatedGridItem>
            <ChartCard title="Client Distribution">
              <div className="h-64 flex items-center justify-center text-gray-400">
                Chart placeholder
              </div>
            </ChartCard>
          </AnimatedGridItem>
        </AnimatedGrid>

        {/* Recent Activity with Scale Animation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <ScaleList staggerDelay={0.06}>
            {recentActivity.map((item) => (
              <ScaleListItem key={item.id}>
                <ActivityItem item={item} />
              </ScaleListItem>
            ))}
          </ScaleList>
        </div>

        {/* Quick Action Modal */}
        <ModalTransition
          isOpen={isQuickActionOpen}
          onClose={() => setIsQuickActionOpen(false)}
          variant="scale"
          className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
        >
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full p-4 text-left border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              📄 Create Invoice
            </button>
            <button className="w-full p-4 text-left border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              👤 Add Client
            </button>
            <button className="w-full p-4 text-left border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              💰 Record Payment
            </button>
            <button className="w-full p-4 text-left border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              🛒 Add Expense
            </button>
          </div>
        </ModalTransition>
      </div>
    </PageTransition>
  );
}

/**
 * Loading State with Skeleton Animation
 */
import { motion } from 'framer-motion';

export function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        ))}
      </div>
    </div>
  );
}
