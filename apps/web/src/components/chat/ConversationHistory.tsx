'use client';

import { useState } from 'react';
import { Search, Plus, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useConversationHistory } from '@/hooks/use-conversation-history';
import { ConversationItem } from './ConversationItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface ConversationHistoryProps {
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  className?: string;
}

/**
 * ConversationHistory - Sidebar showing conversation history
 *
 * Features:
 * - Collapsible sidebar (desktop) / drawer (mobile)
 * - Date-based grouping (Today, Yesterday, This Week, Older)
 * - Search/filter conversations
 * - New conversation button
 * - Delete conversation with confirmation
 * - Responsive: drawer on mobile, sidebar on desktop
 *
 * Desktop: Fixed sidebar with toggle button
 * Mobile: Sheet/drawer triggered by button in header
 */
export function ConversationHistory({
  onNewConversation,
  onSelectConversation,
  className,
}: ConversationHistoryProps) {
  const {
    groupedConversations,
    activeConversationId,
    searchQuery,
    setSearchQuery,
    deleteConversation,
  } = useConversationHistory();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleSelectConversation = (id: string) => {
    onSelectConversation(id);
    setIsMobileOpen(false); // Close mobile drawer on selection
  };

  const handleNewConversation = () => {
    onNewConversation();
    setIsMobileOpen(false);
  };

  // Sidebar content (shared between desktop and mobile)
  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <h2 className="text-lg font-semibold">Conversations</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 md:flex hidden"
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
          onClick={handleNewConversation}
          className="w-full justify-start"
          variant="outline"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Conversation
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
          />
        </div>
      </div>

      <Separator />

      {/* Conversations List */}
      <ScrollArea className="flex-1 px-2">
        {groupedConversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {groupedConversations.map((group) => (
              <div key={group.label}>
                <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </h3>
                <div className="space-y-1">
                  {group.conversations.map((conversation) => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      isActive={conversation.id === activeConversationId}
                      onSelect={handleSelectConversation}
                      onDelete={deleteConversation}
                    />
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
            <PanelLeft className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Desktop: Fixed Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r bg-background transition-all duration-300',
          isCollapsed ? 'w-0 overflow-hidden' : 'w-80',
          className
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop: Toggle Button (when collapsed) */}
      {isCollapsed && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="hidden md:flex absolute left-4 top-20 z-10"
          aria-label="Open conversation history"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
      )}
    </>
  );
}
