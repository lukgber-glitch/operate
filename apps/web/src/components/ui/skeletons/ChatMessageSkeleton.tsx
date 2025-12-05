import { Skeleton } from './Skeleton';

export interface ChatMessageSkeletonProps {
  /**
   * Type of message skeleton (user or assistant)
   * - user: Shows skeleton aligned to right with smaller avatar
   * - assistant: Shows skeleton aligned to left with larger content area
   */
  type?: 'user' | 'assistant';
}

/**
 * ChatMessageSkeleton - Loading skeleton for chat messages
 *
 * Features:
 * - Mimics chat bubble layout
 * - Avatar placeholder
 * - Multiple text line skeletons
 * - Different layouts for user vs assistant messages
 *
 * @example
 * // User message skeleton
 * <ChatMessageSkeleton type="user" />
 *
 * // Assistant message skeleton
 * <ChatMessageSkeleton type="assistant" />
 */
export function ChatMessageSkeleton({ type = 'assistant' }: ChatMessageSkeletonProps) {
  if (type === 'user') {
    return (
      <div className="flex gap-3 justify-end animate-pulse">
        <div className="flex-1 max-w-[80%] space-y-2">
          <Skeleton className="h-4 w-3/4 ml-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6 ml-auto" />
        </div>
        <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
      </div>
    );
  }

  return (
    <div className="flex gap-3 animate-pulse">
      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
      <div className="flex-1 max-w-[80%] space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

/**
 * ChatMessageListSkeleton - Multiple chat message skeletons
 *
 * Shows a realistic conversation loading state with alternating user/assistant messages
 *
 * @example
 * <ChatMessageListSkeleton count={3} />
 */
export function ChatMessageListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <ChatMessageSkeleton
          key={i}
          type={i % 2 === 0 ? 'assistant' : 'user'}
        />
      ))}
    </div>
  );
}
