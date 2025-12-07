'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, MessageSquare, Plus, Clock } from 'lucide-react';
import { gsap } from 'gsap';
import { useConversationHistory } from '@/hooks/use-conversation-history';
import { ChatConversation } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface ChatHistoryDropdownProps {
  currentSessionId?: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  className?: string;
}

/**
 * ChatHistoryDropdown - Compact dropdown for conversation history
 *
 * A minimal, professional dropdown component that sits at the top of the chat container.
 * Features:
 * - Click to expand/collapse dropdown
 * - List of past conversations with dates
 * - Message count and relative timestamps
 * - "New conversation" button
 * - Smooth GSAP animations
 * - Brand color integration (#06BF9D primary, #048A71 dark, #48D9BE secondary)
 * - Mobile-friendly with full width on small screens
 * - Keyboard accessible
 */
export function ChatHistoryDropdown({
  currentSessionId,
  onSelectSession,
  onNewSession,
  className,
}: ChatHistoryDropdownProps) {
  const {
    groupedConversations,
    activeConversationId,
    isLoading,
  } = useConversationHistory();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Get current conversation title
  const currentConversation = groupedConversations
    .flatMap(group => group.conversations)
    .find(conv => conv.id === (currentSessionId || activeConversationId));

  const displayTitle = currentConversation?.title || 'New Chat';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // GSAP: Animate dropdown open/close
  useEffect(() => {
    if (!contentRef.current) return;

    const ctx = gsap.context(() => {
      if (isOpen) {
        // Open animation
        gsap.fromTo(
          contentRef.current,
          {
            opacity: 0,
            y: -10,
            scaleY: 0.95,
          },
          {
            opacity: 1,
            y: 0,
            scaleY: 1,
            duration: 0.2,
            ease: 'power2.out',
          }
        );
      } else {
        // Close animation
        gsap.to(contentRef.current, {
          opacity: 0,
          y: -10,
          scaleY: 0.95,
          duration: 0.15,
          ease: 'power2.in',
        });
      }
    });

    return () => ctx.revert();
  }, [isOpen]);

  // GSAP: Stagger animate items when opening
  useEffect(() => {
    if (!isOpen) return;

    const validRefs = itemRefs.current.filter(Boolean);
    if (validRefs.length === 0) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // No animation if user prefers reduced motion
      gsap.set(validRefs, { opacity: 1, x: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        validRefs,
        {
          opacity: 0,
          x: -10,
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.25,
          stagger: 0.03,
          ease: 'power2.out',
          delay: 0.05,
        }
      );
    });

    return () => ctx.revert();
  }, [isOpen, groupedConversations]);

  // Toggle dropdown
  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  // Handle session selection
  const handleSelectSession = (id: string) => {
    onSelectSession(id);
    setIsOpen(false);
  };

  // Handle new session
  const handleNewSession = () => {
    onNewSession();
    setIsOpen(false);
  };

  // Format relative time
  const formatRelativeTime = (date: Date) => {
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
  };

  // Get message count for conversation
  const getMessageCount = (conversation: ChatConversation) => {
    return conversation.messages.length;
  };

  // Get all conversations flattened
  const allConversations = groupedConversations.flatMap(group => group.conversations);

  return (
    <div ref={dropdownRef} className={cn('relative w-full', className)}>
      {/* Dropdown Trigger */}
      <button
        onClick={handleToggle}
        className={cn(
          'flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-200',
          'hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30',
          isOpen && 'bg-muted/50'
        )}
        style={{
          borderRadius: 'var(--radius-xl)',
        }}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <MessageSquare
            className="h-5 w-5 shrink-0"
            style={{ color: 'var(--color-primary)' }}
          />
          <span className="text-sm font-medium truncate text-foreground">
            {displayTitle}
          </span>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div
          ref={contentRef}
          className={cn(
            'absolute top-full left-0 right-0 mt-2 z-50',
            'rounded-xl shadow-lg border',
            'md:max-w-md'
          )}
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div className="p-3">
            {/* New Conversation Button */}
            <Button
              onClick={handleNewSession}
              className="w-full justify-start mb-3 text-white shadow-sm transition-all duration-150"
              style={{
                backgroundColor: 'var(--color-primary)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New conversation
            </Button>

            <Separator className="mb-3" />

            {/* Conversations List */}
            <ScrollArea className="max-h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex gap-1">
                    <span
                      className="h-2 w-2 rounded-full animate-bounce"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    />
                    <span
                      className="h-2 w-2 rounded-full animate-bounce"
                      style={{
                        backgroundColor: 'var(--color-primary)',
                        animationDelay: '150ms',
                      }}
                    />
                    <span
                      className="h-2 w-2 rounded-full animate-bounce"
                      style={{
                        backgroundColor: 'var(--color-primary)',
                        animationDelay: '300ms',
                      }}
                    />
                  </div>
                </div>
              ) : allConversations.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No conversations yet
                </div>
              ) : (
                <div className="space-y-1">
                  {groupedConversations.map((group, groupIndex) => (
                    <div key={group.label} className="mb-4 last:mb-0">
                      {/* Group Label */}
                      <h3
                        className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                        style={{ fontSize: 'var(--font-size-xs)' }}
                      >
                        {group.label}
                      </h3>

                      {/* Group Items */}
                      <div className="space-y-0.5">
                        {group.conversations.map((conversation, itemIndex) => {
                          const isActive = conversation.id === (currentSessionId || activeConversationId);
                          const messageCount = getMessageCount(conversation);

                          return (
                            <div
                              key={conversation.id}
                              ref={(el) => {
                                const index = groupIndex * 100 + itemIndex;
                                itemRefs.current[index] = el;
                              }}
                            >
                              <button
                                onClick={() => handleSelectSession(conversation.id)}
                                className={cn(
                                  'w-full flex items-start gap-3 px-3 py-2.5 rounded-lg',
                                  'transition-colors duration-150',
                                  'hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30',
                                  isActive && 'bg-muted'
                                )}
                                style={{
                                  borderRadius: 'var(--radius-lg)',
                                }}
                              >
                                {/* Icon */}
                                <div
                                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                                  style={{
                                    backgroundColor: isActive
                                      ? 'var(--color-primary)'
                                      : 'var(--color-border)',
                                    color: isActive ? 'white' : 'var(--color-text-secondary)',
                                  }}
                                >
                                  <MessageSquare className="h-3.5 w-3.5" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 text-left">
                                  <div className="flex items-start justify-between gap-2 mb-0.5">
                                    <h4
                                      className={cn(
                                        'text-sm font-medium truncate',
                                        isActive ? 'text-foreground' : 'text-foreground/90'
                                      )}
                                    >
                                      {conversation.title}
                                    </h4>
                                  </div>

                                  {/* Metadata */}
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatRelativeTime(conversation.updatedAt)}
                                    </span>
                                    <span>•</span>
                                    <span>
                                      {messageCount} {messageCount === 1 ? 'message' : 'messages'}
                                    </span>
                                  </div>
                                </div>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}
