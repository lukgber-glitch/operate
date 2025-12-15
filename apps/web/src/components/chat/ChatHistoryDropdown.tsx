'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  MessageSquare,
  Plus,
  Clock,
  Search,
  X,
  Pin,
  Pencil,
  Trash2,
  MoreHorizontal,
  Check,
} from 'lucide-react';
import { useConversationHistory } from '@/hooks/use-conversation-history';
import { ChatConversation } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface ChatHistoryDropdownProps {
  currentSessionId?: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onRenameSession?: (id: string, newTitle: string) => void;
  onDeleteSession?: (id: string) => void;
  onPinSession?: (id: string) => void;
  className?: string;
  /** Enable Cmd/Ctrl+K shortcut to open */
  enableKeyboardShortcut?: boolean;
}

// Animation variants
const dropdownVariants = {
  hidden: {
    opacity: 0,
    y: -10,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: { duration: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.03,
      type: 'spring' as const,
      stiffness: 300,
      damping: 25,
    },
  }),
};

/**
 * ChatHistoryDropdown - Enhanced dropdown for conversation history
 *
 * Features:
 * - Search through conversations
 * - Time-based grouping (Today, Yesterday, This Week, etc.)
 * - Hover actions (rename, delete, pin)
 * - Keyboard shortcut (Cmd/Ctrl+K)
 * - Glassmorphic styling with blue theme
 * - Framer Motion animations
 * - Mobile-friendly
 * - Accessibility support
 */
export function ChatHistoryDropdown({
  currentSessionId,
  onSelectSession,
  onNewSession,
  onRenameSession,
  onDeleteSession,
  onPinSession,
  className,
  enableKeyboardShortcut = true,
}: ChatHistoryDropdownProps) {
  const {
    groupedConversations,
    activeConversationId,
    isLoading,
  } = useConversationHistory();

  const prefersReducedMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Get current conversation title
  const currentConversation = useMemo(() => {
    return groupedConversations
      .flatMap(group => group.conversations)
      .find(conv => conv.id === (currentSessionId || activeConversationId));
  }, [groupedConversations, currentSessionId, activeConversationId]);

  const displayTitle = currentConversation?.title || 'New Chat';

  // Filter conversations based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupedConversations;

    const query = searchQuery.toLowerCase();
    return groupedConversations
      .map(group => ({
        ...group,
        conversations: group.conversations.filter(conv =>
          conv.title.toLowerCase().includes(query) ||
          conv.messages.some(msg =>
            msg.content.toLowerCase().includes(query)
          )
        ),
      }))
      .filter(group => group.conversations.length > 0);
  }, [groupedConversations, searchQuery]);

  // Total conversation count
  const totalConversations = useMemo(() => {
    return groupedConversations.reduce(
      (sum, group) => sum + group.conversations.length,
      0
    );
  }, [groupedConversations]);

  // Keyboard shortcut (Cmd/Ctrl+K)
  useEffect(() => {
    if (!enableKeyboardShortcut) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchQuery('');
        setEditingId(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcut, isOpen]);

  // Focus search when opening
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Focus edit input when editing
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setEditingId(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handlers
  const handleToggle = () => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      setSearchQuery('');
      setEditingId(null);
    }
  };

  const handleSelectSession = (id: string) => {
    onSelectSession(id);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleNewSession = () => {
    onNewSession();
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleStartRename = (conversation: ChatConversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
  };

  const handleSaveRename = () => {
    if (editingId && editingTitle.trim() && onRenameSession) {
      onRenameSession(editingId, editingTitle.trim());
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteSession) {
      onDeleteSession(id);
    }
  };

  const handlePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPinSession) {
      onPinSession(id);
    }
  };

  // Format relative time
  const formatRelativeTime = useCallback((date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 172800) return 'Yesterday';
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }, []);

  return (
    <div ref={dropdownRef} className={cn('relative w-full', className)}>
      {/* Dropdown Trigger */}
      <motion.button
        onClick={handleToggle}
        className={cn(
          'flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400',
          isOpen ? 'ring-2 ring-blue-400' : 'hover:bg-blue-50/50'
        )}
        style={{
          background: isOpen ? 'rgba(227, 242, 253, 0.6)' : 'transparent',
          borderColor: 'var(--color-blue-200)',
        }}
        whileHover={prefersReducedMotion ? {} : { scale: 1.01 }}
        whileTap={prefersReducedMotion ? {} : { scale: 0.99 }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Chat history"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <MessageSquare
            className="h-5 w-5 shrink-0"
            style={{ color: 'var(--color-blue-600)' }}
          />
          <span
            className="text-sm font-medium truncate"
            style={{ color: 'var(--color-blue-700)' }}
          >
            {displayTitle}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Keyboard shortcut hint */}
          {enableKeyboardShortcut && (
            <kbd
              className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded"
              style={{
                background: 'var(--color-blue-100)',
                color: 'var(--color-blue-600)',
              }}
            >
              <span className="text-[10px]">⌘</span>K
            </kbd>
          )}

          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
            style={{ color: 'var(--color-blue-500)' }}
          />
        </div>
      </motion.button>

      {/* Dropdown Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={prefersReducedMotion ? undefined : dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute top-full left-0 right-0 mt-2 z-50 overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--color-blue-200)',
              borderRadius: 'var(--radius-xl, 16px)',
              boxShadow: '0 8px 32px rgba(13, 71, 161, 0.15)',
            }}
            role="listbox"
          >
            <div className="p-3">
              {/* Search Input */}
              <div className="relative mb-3">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: 'var(--color-blue-400)' }}
                />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className={cn(
                    'pl-9 pr-8 h-10 rounded-lg border-blue-200',
                    'focus:border-blue-400 focus:ring-2 focus:ring-blue-200',
                    'placeholder:text-blue-400'
                  )}
                  style={{ background: 'rgba(227, 242, 253, 0.3)' }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-blue-100"
                    aria-label="Clear search"
                  >
                    <X className="h-3 w-3" style={{ color: 'var(--color-blue-500)' }} />
                  </button>
                )}
              </div>

              {/* New Conversation Button */}
              <Button
                onClick={handleNewSession}
                className="w-full justify-start mb-3 text-white shadow-sm"
                style={{
                  background: 'var(--color-blue-600)',
                  borderRadius: 'var(--radius-lg, 12px)',
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                New conversation
              </Button>

              <Separator className="mb-3" style={{ background: 'var(--color-blue-100)' }} />

              {/* Conversations List */}
              <ScrollArea className="max-h-[350px]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="h-2 w-2 rounded-full"
                          style={{ background: 'var(--color-blue-500)' }}
                          animate={{ y: [0, -6, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.15,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : filteredGroups.length === 0 ? (
                  <div className="py-8 text-center">
                    <MessageSquare
                      className="h-8 w-8 mx-auto mb-2 opacity-30"
                      style={{ color: 'var(--color-blue-400)' }}
                    />
                    <p className="text-sm" style={{ color: 'var(--color-blue-500)' }}>
                      {searchQuery ? 'No matches found' : 'No conversations yet'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredGroups.map((group) => (
                      <div key={group.label}>
                        {/* Group Label */}
                        <h3
                          className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider"
                          style={{ color: 'var(--color-blue-500)' }}
                        >
                          {group.label}
                        </h3>

                        {/* Group Items */}
                        <div className="space-y-0.5">
                          {group.conversations.map((conversation, index) => {
                            const isActive = conversation.id === (currentSessionId || activeConversationId);
                            const isEditing = editingId === conversation.id;
                            const isHovered = hoveredId === conversation.id;
                            const messageCount = conversation.messages.length;

                            return (
                              <motion.div
                                key={conversation.id}
                                variants={prefersReducedMotion ? undefined : itemVariants}
                                initial="hidden"
                                animate="visible"
                                custom={index}
                                onMouseEnter={() => setHoveredId(conversation.id)}
                                onMouseLeave={() => setHoveredId(null)}
                              >
                                <div
                                  onClick={() => !isEditing && handleSelectSession(conversation.id)}
                                  className={cn(
                                    'group relative flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer',
                                    'transition-colors duration-150',
                                    isActive
                                      ? 'bg-blue-100/80'
                                      : 'hover:bg-blue-50/60'
                                  )}
                                  role="option"
                                  aria-selected={isActive}
                                >
                                  {/* Icon */}
                                  <div
                                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                                    style={{
                                      background: isActive
                                        ? 'var(--color-blue-600)'
                                        : 'var(--color-blue-100)',
                                      color: isActive ? 'white' : 'var(--color-blue-500)',
                                    }}
                                  >
                                    <MessageSquare className="h-3.5 w-3.5" />
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    {isEditing ? (
                                      <div className="flex items-center gap-2">
                                        <Input
                                          ref={editInputRef}
                                          value={editingTitle}
                                          onChange={(e) => setEditingTitle(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveRename();
                                            if (e.key === 'Escape') handleCancelRename();
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          className="h-7 text-sm"
                                        />
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-7 w-7"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSaveRename();
                                          }}
                                        >
                                          <Check className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-7 w-7"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCancelRename();
                                          }}
                                        >
                                          <X className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <>
                                        <h4
                                          className="text-sm font-medium truncate mb-0.5"
                                          style={{
                                            color: isActive
                                              ? 'var(--color-blue-700)'
                                              : 'var(--color-blue-600)',
                                          }}
                                        >
                                          {conversation.title}
                                        </h4>

                                        <div
                                          className="flex items-center gap-2 text-xs"
                                          style={{ color: 'var(--color-blue-400)' }}
                                        >
                                          <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatRelativeTime(conversation.updatedAt)}
                                          </span>
                                          <span>•</span>
                                          <span>
                                            {messageCount} {messageCount === 1 ? 'message' : 'messages'}
                                          </span>
                                        </div>
                                      </>
                                    )}
                                  </div>

                                  {/* Hover Actions */}
                                  {!isEditing && (isHovered || isActive) && (
                                    <div className="flex items-center gap-1 shrink-0">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <MoreHorizontal className="h-4 w-4" style={{ color: 'var(--color-blue-500)' }} />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40">
                                          {onRenameSession && (
                                            <DropdownMenuItem onClick={(e) => handleStartRename(conversation, e as unknown as React.MouseEvent)}>
                                              <Pencil className="h-4 w-4 mr-2" />
                                              Rename
                                            </DropdownMenuItem>
                                          )}
                                          {onPinSession && (
                                            <DropdownMenuItem onClick={(e) => handlePin(conversation.id, e as unknown as React.MouseEvent)}>
                                              <Pin className="h-4 w-4 mr-2" />
                                              Pin
                                            </DropdownMenuItem>
                                          )}
                                          {onDeleteSession && (
                                            <DropdownMenuItem
                                              onClick={(e) => handleDelete(conversation.id, e as unknown as React.MouseEvent)}
                                              className="text-red-600 focus:text-red-600"
                                            >
                                              <Trash2 className="h-4 w-4 mr-2" />
                                              Delete
                                            </DropdownMenuItem>
                                          )}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Footer with count */}
              {totalConversations > 0 && (
                <div
                  className="mt-3 pt-3 text-center text-xs border-t"
                  style={{
                    borderColor: 'var(--color-blue-100)',
                    color: 'var(--color-blue-400)',
                  }}
                >
                  {searchQuery
                    ? `${filteredGroups.reduce((sum, g) => sum + g.conversations.length, 0)} of ${totalConversations} conversations`
                    : `${totalConversations} conversation${totalConversations === 1 ? '' : 's'}`}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ChatHistoryDropdown;
