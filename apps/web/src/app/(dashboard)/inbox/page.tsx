'use client';

import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animation-variants';
import { Bell, CheckCheck, Clock, Mail, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GlassCard } from '@/components/ui/glass-card';
import { toast } from '@/components/ui/use-toast';

interface InboxMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  timestamp: Date;
  from?: string;
}

const mockMessages: InboxMessage[] = [
  {
    id: '1',
    title: 'New Invoice Received',
    message: 'Invoice #INV-2024-001 from Acme Corp has been received and is ready for review.',
    type: 'info',
    isRead: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    from: 'System',
  },
  {
    id: '2',
    title: 'Payment Due Reminder',
    message: 'Invoice #INV-2024-098 is due in 3 days. Please ensure payment is processed.',
    type: 'warning',
    isRead: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    from: 'Finance',
  },
  {
    id: '3',
    title: 'Expense Approved',
    message: 'Your expense claim for EUR 245.50 has been approved and will be reimbursed.',
    type: 'success',
    isRead: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    from: 'HR',
  },
  {
    id: '4',
    title: 'Failed Bank Sync',
    message: 'Unable to sync transactions from Deutsche Bank. Please reconnect your account.',
    type: 'error',
    isRead: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    from: 'System',
  },
  {
    id: '5',
    title: 'Monthly Report Available',
    message: 'Your financial report for November 2024 is now available for download.',
    type: 'info',
    isRead: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    from: 'Reports',
  },
];

export default function InboxPage() {
  const [messages, setMessages] = useState<InboxMessage[]>(mockMessages);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = messages.filter((m) => !m.isRead).length;
  const filteredMessages = filter === 'unread' ? messages.filter((m) => !m.isRead) : messages;

  const handleMarkAsRead = (id: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, isRead: true } : msg))
    );
    toast({
      title: 'Marked as read',
      description: 'Message has been marked as read.',
    });
  };

  const handleMarkAllAsRead = () => {
    setMessages((prev) => prev.map((msg) => ({ ...msg, isRead: true })));
    toast({
      title: 'All marked as read',
      description: 'All messages have been marked as read.',
    });
  };

  const handleDelete = (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
    toast({
      title: 'Message deleted',
      description: 'Message has been removed from your inbox.',
    });
  };

  const getTypeColor = (type: InboxMessage['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
          <p className="text-white/70">
            {unreadCount > 0
              ? `${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
            <Badge variant="secondary" className="ml-2">
              {messages.length}
            </Badge>
          </Button>
          <Button
            variant={filter === 'unread' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Unread
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>
      </motion.div>

      {/* Messages List */}
      <motion.div variants={fadeUp} className="space-y-3">
        {filteredMessages.length === 0 ? (
          <GlassCard padding="lg">
            <div className="flex flex-col items-center justify-center py-16">
              <Mail className="h-16 w-16 text-white/70/50" />
              <h3 className="mt-4 text-lg font-semibold">No messages</h3>
              <p className="mt-2 text-sm text-white/70">
                {filter === 'unread'
                  ? "You're all caught up! No unread messages."
                  : 'Your inbox is empty.'}
              </p>
            </div>
          </GlassCard>
        ) : (
          filteredMessages.map((message) => (
            <GlassCard
              key={message.id}
              className={`rounded-[16px] transition-all hover:shadow-md ${
                message.isRead ? 'opacity-75' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`mt-1 p-2 rounded-md ${
                        message.isRead
                          ? 'bg-gray-100 dark:bg-gray-800'
                          : 'bg-primary/10'
                      }`}
                    >
                      <Bell
                        className={`h-5 w-5 ${
                          message.isRead
                            ? 'text-gray-500'
                            : 'text-primary'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base font-semibold">
                          {message.title}
                        </CardTitle>
                        {!message.isRead && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/70 mb-2">
                        <span className="font-medium">{message.from}</span>
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(message.timestamp)}</span>
                        <Badge className={getTypeColor(message.type)}>
                          {message.type}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {message.message}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {!message.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMarkAsRead(message.id)}
                      >
                        <CheckCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(message.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </GlassCard>
          ))
        )}
      </motion.div>
    </motion.div>
  );
}
