'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Plus, PanelLeftClose, PanelLeft, History } from 'lucide-react';
import { gsap } from 'gsap';
import { useConversationHistory } from '@/hooks/use-conversation-history';
import { ConversationItem } from './ConversationItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface ChatHistoryProps {
  isOpen?: boolean;
  onClose?: () => void;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  className?: string;
}

/**
 * ChatHistory - Animated conversation history dropdown/panel
 *
 * S10-03 Implementation:
 * - Slides in from right (desktop) or bottom (mobile) with GSAP animations
 * - Lists previous conversations with preview, date/time
 * - Search functionality to find old conversations
 * - "New Chat" button to start fresh
 * - Uses design tokens for consistent styling
 * - API-integrated (GET /chatbot/conversations)
 *
 * Features:
 * - Date-based grouping (Today, Yesterday, This Week, Older)
 * - Smooth GSAP entrance/exit animations
 * - Search/filter conversations
 * - Delete conversation with confirmation
 * - Responsive: drawer on mobile, sidebar on desktop
 *
 * Design Tokens:
 * - --color-surface: Panel background
 * - --shadow-lg: Panel elevation
 * - --radius-lg: Panel border radius
 * - --space-*: Consistent spacing
 */
export function ChatHistory({
  isOpen = false,
  onClose,
  onNewChat,
  onSelectConversation,
  className,
}: ChatHistoryProps) {
  const {
    groupedConversations,
    activeConversationId,
    searchQuery,
    setSearchQuery,
    deleteConversation,
    isLoading,
  } = useConversationHistory();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Refs for GSAP animations
  const sidebarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const conversationRefs = useRef<(HTMLDivElement | null)[]>([]);

  // GSAP: Animate sidebar entrance
  useEffect(() => {
    if (!sidebarRef.current || isCollapsed) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        sidebarRef.current,
        {
          x: -320, // Slide from left
          opacity: 0,
        },
        {
          x: 0,
          opacity: 1,
          duration: 0.35,
          ease: 'power2.out',
        }
      );
    });

    return () => ctx.revert();
  }, [isCollapsed]);

  // GSAP: Animate content fade-in
  useEffect(() => {
    if (!contentRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.25,
          delay: 0.1,
          ease: 'power2.out',
        }
      );
    });

    return () => ctx.revert();
  }, [searchQuery, isLoading]);

  // GSAP: Stagger animate conversation items
  useEffect(() => {
    const validRefs = conversationRefs.current.filter(Boolean);
    if (validRefs.length === 0 || isLoading) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        validRefs,
        {
          opacity: 0,
          x: -20,
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.4,
          stagger: 0.05,
          ease: 'power2.out',
        }
      );
    });

    return () => ctx.revert();
  }, [groupedConversations, isLoading]);

  // Handle collapse with animation
  const handleToggleCollapse = () => {
    if (!sidebarRef.current) return;

    if (!isCollapsed) {
      // Animate collapse
      gsap.to(sidebarRef.current, {
        width: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.inOut',
        onComplete: () => setIsCollapsed(true),
      });
    } else {
      // Animate expand
      setIsCollapsed(false);
      gsap.fromTo(
        sidebarRef.current,
        { width: 0, opacity: 0 },
        {
          width: 320,
          opacity: 1,
          duration: 0.3,
          ease: 'power2.inOut',
        }
      );
    }
  };

  const handleSelectConversation = (id: string) => {
    onSelectConversation(id);
    setIsMobileOpen(false);
    onClose?.();
  };

  const handleNewChat = () => {
    onNewChat();
    setIsMobileOpen(false);
    onClose?.();
  };

  // Sidebar content (shared between desktop and mobile)
  const sidebarContent = (
    <div className="flex h-full flex-col" ref={contentRef}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Conversations</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleCollapse}
          className="h-8 w-8 md:flex hidden"
          aria-label="Toggle conversation history"
        >
          {isCollapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      {/* New Conversation Button */}
      <div className="px-4 pb-3">
        <Button
          onClick={handleNewChat}
          className="w-full justify-start bg-primary hover:bg-primary-hover text-white shadow-sm transition-all duration-150"
          style={{
            borderRadius: 'var(--radius-md)',
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              borderRadius: 'var(--radius-md)',
            }}
          />
        </div>
      </div>

      <Separator />

      {/* Conversations List */}
      <ScrollArea className="flex-1 px-2">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
              <span className="h-2 w-2 rounded-full bg-primary animate-bounce animation-delay-150" />
              <span className="h-2 w-2 rounded-full bg-primary animate-bounce animation-delay-300" />
            </div>
          </div>
        ) : groupedConversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {groupedConversations.map((group, groupIndex) => (
              <div key={group.label}>
                <h3
                  className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  style={{ fontSize: 'var(--font-size-xs)' }}
                >
                  {group.label}
                </h3>
                <div className="space-y-1">
                  {group.conversations.map((conversation, itemIndex) => (
                    <div
                      key={conversation.id}
                      ref={(el) => {
                        const index = groupIndex * 100 + itemIndex;
                        conversationRefs.current[index] = el;
                      }}
                    >
                      <ConversationItem
                        conversation={conversation}
                        isActive={conversation.id === activeConversationId}
                        onSelect={handleSelectConversation}
                        onDelete={deleteConversation}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  return (
    <>
      {/* Mobile: Sheet/Drawer */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open conversation history"
          >
            <History className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-80 p-0"
          style={{
            backgroundColor: 'var(--color-surface)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Desktop: Fixed Sidebar with GSAP animation */}
      <aside
        ref={sidebarRef}
        className={cn(
          'hidden md:flex flex-col border-r transition-all duration-300',
          isCollapsed ? 'w-0 overflow-hidden opacity-0' : 'w-80',
          className
        )}
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        {sidebarContent}
      </aside>

      {/* Desktop: Floating Toggle Button (when collapsed) */}
      {isCollapsed && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleCollapse}
          className="hidden md:flex fixed left-4 top-20 z-10 bg-surface shadow-md hover:shadow-lg"
          aria-label="Open conversation history"
          style={{
            backgroundColor: 'var(--color-surface)',
            boxShadow: 'var(--shadow-md)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <History className="h-5 w-5" />
        </Button>
      )}
    </>
  );
}
