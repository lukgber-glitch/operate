'use client';

import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useRef, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useConversationHistory } from '@/hooks/use-conversation-history';
import { useAIConsent } from '@/hooks/useAIConsent';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { SuggestionPills } from './SuggestionPills';
import { ChatHistoryDropdown } from './ChatHistoryDropdown';
import { AIConsentDialog } from '@/components/consent/AIConsentDialog';
import { GuruLoader } from '@/components/ui/guru-loader';
import { AnimatedGradientBackground } from '@/components/ui/animated-gradient-background';
import { MinimalHeader } from '@/components/dashboard/MinimalHeader';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { Brain, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ChatLandingProps {
  className?: string;
}

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
      staggerChildren: 0.1,
    },
  },
};

const greetingVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 200,
      damping: 20,
    },
  },
};

const chatContainerVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 200,
      damping: 25,
      delay: 0.2,
    },
  },
};

/**
 * Get time-based greeting
 */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * ChatLanding - Chat-centric landing page
 *
 * Features:
 * - Minimal header with dashboard/settings icons
 * - Large greeting with user's name
 * - Central chat rectangle (the hero element)
 * - Suggestion pills for quick actions
 * - Smooth morphing animations
 * - Full-screen chat experience
 */
export function ChatLanding({ className }: ChatLandingProps) {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  const {
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    addMessage,
    updateMessage,
  } = useConversationHistory();

  // AI Consent
  const {
    hasConsent,
    needsConsent,
    isLoading: consentLoading,
    giveConsent,
  } = useAIConsent();

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [attemptedMessage, setAttemptedMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // User info
  const firstName = user?.firstName || 'there';
  const greeting = getGreeting();

  // Load active conversation messages
  useEffect(() => {
    if (activeConversation) {
      setMessages(activeConversation.messages);
    } else {
      setMessages([]);
    }
  }, [activeConversation]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-show consent dialog when user needs consent
  useEffect(() => {
    if (!consentLoading && needsConsent && !showConsentDialog) {
      const timer = setTimeout(() => {
        setShowConsentDialog(true);
      }, 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [consentLoading, needsConsent, showConsentDialog]);

  // Send message handler
  const handleSendMessage = useCallback(
    async (content: string) => {
      // Check AI consent
      if (needsConsent || !hasConsent) {
        setAttemptedMessage(content);
        setShowConsentDialog(true);
        return;
      }

      let conversationId = activeConversationId;
      if (!conversationId) {
        const newConversation = await createConversation();
        conversationId = newConversation.id;
      }

      const userMessage: ChatMessageType = {
        id: crypto.randomUUID(),
        conversationId,
        role: 'user',
        content,
        timestamp: new Date(),
        status: 'sending',
      };

      setMessages((prev) => [...prev, userMessage]);
      addMessage(conversationId, userMessage);
      setIsLoading(true);
      setInputValue('');

      try {
        const response = await fetch(
          `/api/v1/chatbot/conversations/${conversationId}/messages`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ content }),
          }
        );

        if (!response.ok) throw new Error('Failed to send message');

        const data = await response.json();
        const [userResp, assistantResp] = data;

        // Update user message
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === userMessage.id
              ? { ...msg, status: 'sent' as const, id: userResp.id }
              : msg
          )
        );
        updateMessage(conversationId, userMessage.id, { status: 'sent' });

        // Add assistant response
        const assistantMessage: ChatMessageType = {
          id: assistantResp.id,
          conversationId,
          role: 'assistant',
          content: assistantResp.content,
          timestamp: new Date(assistantResp.createdAt),
          status: 'sent',
          metadata: {
            actionType: assistantResp.actionType,
            actionParams: assistantResp.actionParams,
            actionResult: assistantResp.actionResult,
            actionStatus: assistantResp.actionStatus,
          },
        };

        setMessages((prev) => [...prev, assistantMessage]);
        addMessage(conversationId, assistantMessage);
      } catch (error) {
        const errorMessage = {
          ...userMessage,
          status: 'error' as const,
          metadata: {
            error:
              error instanceof Error ? error.message : 'Failed to send message',
          },
        };
        setMessages((prev) =>
          prev.map((msg) => (msg.id === userMessage.id ? errorMessage : msg))
        );
        updateMessage(conversationId, userMessage.id, {
          status: 'error',
          metadata: errorMessage.metadata,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [
      activeConversationId,
      addMessage,
      createConversation,
      hasConsent,
      needsConsent,
      updateMessage,
    ]
  );

  // Retry failed message
  const handleRetry = useCallback(
    (messageId: string) => {
      const message = messages.find((msg) => msg.id === messageId);
      if (message?.role === 'user') {
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
        handleSendMessage(message.content);
      }
    },
    [messages, handleSendMessage]
  );

  // Session handlers
  const handleSelectSession = (id: string) => {
    setActiveConversationId(id);
    setShowHistory(false);
  };

  const handleNewSession = () => {
    createConversation();
    setMessages([]);
    setShowHistory(false);
  };

  // Consent handlers
  const handleConsentAccept = async () => {
    const success = await giveConsent();
    if (success) {
      setShowConsentDialog(false);
      if (attemptedMessage) {
        handleSendMessage(attemptedMessage);
        setAttemptedMessage(null);
      }
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <>
      {/* AI Consent Dialog */}
      <AIConsentDialog
        open={showConsentDialog}
        onOpenChange={setShowConsentDialog}
        onAccept={handleConsentAccept}
        onDecline={() => {
          setShowConsentDialog(false);
          setAttemptedMessage(null);
        }}
        isLoading={consentLoading}
      />

      {/* Minimal Header */}
      <MinimalHeader
        showHistory
        onHistoryClick={() => setShowHistory(!showHistory)}
      />

      {/* Animated Background */}
      <AnimatedGradientBackground
        theme="blue"
        intensity="subtle"
        showBlobs={true}
        fixed
      />

      {/* Main Container */}
      <motion.div
        className={cn(
          'min-h-screen pt-16 pb-4 px-4 relative',
          className
        )}
        variants={prefersReducedMotion ? undefined : containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-4xl mx-auto h-[calc(100vh-5rem)] flex flex-col">
          {/* Greeting Section */}
          <motion.div
            className="text-center py-6 md:py-10"
            variants={prefersReducedMotion ? undefined : greetingVariants}
          >
            <h1
              className="text-3xl md:text-4xl font-semibold mb-2"
              style={{ color: 'var(--color-blue-700)' }}
            >
              {greeting}, {firstName}
            </h1>
            <p
              className="text-base md:text-lg"
              style={{ color: 'var(--color-blue-600)' }}
            >
              How can I help you today?
            </p>
          </motion.div>

          {/* Chat History Dropdown (when toggled) */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <ChatHistoryDropdown
                  currentSessionId={activeConversationId || undefined}
                  onSelectSession={handleSelectSession}
                  onNewSession={handleNewSession}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Consent Warning */}
          {!consentLoading && !hasConsent && (
            <Alert className="mb-4 border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4" style={{ color: 'var(--color-blue-600)' }} />
              <AlertDescription className="flex items-center justify-between">
                <span style={{ color: 'var(--color-blue-700)' }}>
                  Enable AI to start chatting
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConsentDialog(true)}
                  className="ml-4 border-blue-300 hover:bg-blue-100"
                >
                  <Brain className="h-4 w-4 mr-2" style={{ color: 'var(--color-blue-600)' }} />
                  Enable AI
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Central Chat Rectangle - Glassmorphic */}
          <motion.div
            className="flex-1 flex flex-col min-h-0 rounded-2xl overflow-hidden glass-card-blue glass-noise glass-gradient"
            style={{
              boxShadow: '0 8px 32px rgba(13, 71, 161, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
            }}
            variants={prefersReducedMotion ? undefined : chatContainerVariants}
          >
            {/* Messages Area */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 md:p-6">
              {hasMessages ? (
                <div className="space-y-4 md:space-y-6">
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      onRetry={handleRetry}
                    />
                  ))}

                  {/* Loading indicator with GuruLoader */}
                  {isLoading && (
                    <div className="flex items-center gap-3 py-2">
                      <GuruLoader size={24} />
                      <span
                        className="text-sm animate-pulse"
                        style={{ color: 'var(--color-blue-600)' }}
                      >
                        Thinking...
                      </span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              ) : (
                // Empty State with Suggestion Pills
                <div className="h-full flex flex-col items-center justify-center py-8">
                  <GuruLoader size={48} className="mb-6 opacity-50" />
                  <p
                    className="text-lg mb-6 text-center"
                    style={{ color: 'var(--color-blue-600)' }}
                  >
                    Ask me anything about your business
                  </p>
                  <SuggestionPills
                    onSelect={(suggestion) => {
                      setInputValue(suggestion);
                    }}
                    maxItems={4}
                  />
                </div>
              )}
            </ScrollArea>

            {/* Suggestion Pills (when there are messages) */}
            {hasMessages && !isLoading && (
              <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--color-blue-100)' }}>
                <SuggestionPills
                  onSelect={handleSendMessage}
                  maxItems={3}
                  className="justify-start"
                />
              </div>
            )}

            {/* Chat Input - Glassmorphic */}
            <div
              className="p-4 border-t glass-blue-subtle"
              style={{
                borderColor: 'rgba(187, 222, 251, 0.4)',
              }}
            >
              <ChatInput
                onSend={handleSendMessage}
                value={inputValue}
                onChange={setInputValue}
                disabled={isLoading || !hasConsent}
                isLoading={isLoading}
                placeholder={
                  hasConsent
                    ? 'Ask anything about your business...'
                    : 'Enable AI to start chatting...'
                }
                showAttachment
                showVoice
              />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}

export default ChatLanding;
