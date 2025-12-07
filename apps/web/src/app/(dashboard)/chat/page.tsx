'use client';

import { Metadata } from 'next';
import { useAuth } from '@/hooks/use-auth';
import { useSuggestions } from '@/hooks/useSuggestions';
import { useConversationHistory } from '@/hooks/use-conversation-history';
import { useBankAccounts, useBankTransactions } from '@/hooks/use-banking';
import { useInvoices } from '@/hooks/use-invoices';
import { useCurrencyFormat } from '@/hooks/use-currency-format';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { ExtractionReviewStatus } from '@/types/extracted-invoice';
import { useRef, useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { SuggestionCard } from '@/components/chat/SuggestionCard';
import { Mail, Building2, Calendar, Mic, History, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { listExtractedInvoices } from '@/lib/api/extracted-invoices';

/**
 * Chat Landing Page Layout (S10-01)
 *
 * Specification from IMPLEMENTATION_PLAN.md:
 * - Welcome greeting with user's name
 * - Chat messages area (centered, max-width 800px)
 * - Suggestions bar above input
 * - Chat input with voice/history placeholders
 * - Three insight cards at bottom (Email, Bank, Upcoming)
 * - Responsive design (mobile-first)
 */
export default function ChatPage() {
  const { user } = useAuth();
  const { suggestions, dismissSuggestion } = useSuggestions({
    context: 'chat-landing',
  });

  const {
    activeConversation,
    activeConversationId,
    createConversation,
    addMessage,
    updateMessage,
  } = useConversationHistory();

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch real data from APIs
  const { accounts, fetchBankAccounts, isLoading: accountsLoading } = useBankAccounts();
  const { transactions, fetchTransactions, isLoading: transactionsLoading } = useBankTransactions({ pageSize: 5 });
  const { invoices, fetchInvoices, isLoading: invoicesLoading } = useInvoices({ status: 'SENT', pageSize: 10 });
  const [extractedInvoices, setExtractedInvoices] = useState<any[]>([]);
  const [extractedLoading, setExtractedLoading] = useState(false);
  const { formatWithSymbol } = useCurrencyFormat('EUR');

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Load active conversation messages
  useEffect(() => {
    if (activeConversation) {
      setMessages(activeConversation.messages);
    } else {
      setMessages([]);
    }
  }, [activeConversation]);

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch bank accounts and transactions
        await fetchBankAccounts();
        await fetchTransactions();

        // Fetch pending invoices
        await fetchInvoices({ status: 'SENT' });

        // Fetch extracted invoices from email
        setExtractedLoading(true);
        try {
          const extracted = await listExtractedInvoices({
            reviewStatus: ExtractionReviewStatus.PENDING_REVIEW,
            limit: 10
          });
          setExtractedInvoices(extracted.items || []);
        } catch (error) {
          console.error('Failed to fetch extracted invoices:', error);
          setExtractedInvoices([]);
        } finally {
          setExtractedLoading(false);
        }
      } catch (error) {
        console.error('Failed to load chat context data:', error);
      }
    };

    loadData();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    // Create or get conversation
    let conversationId = activeConversationId;
    if (!conversationId) {
      const newConversation = createConversation();
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

    // Add to local state for immediate UI update
    setMessages((prev) => [...prev, userMessage]);
    // Add to conversation history
    addMessage(conversationId, userMessage);
    setIsLoading(true);

    try {
      // Send message to API
      const response = await fetch('/api/v1/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, conversationId }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Update user message status
      const sentUserMessage = { ...userMessage, status: 'sent' as const };
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? sentUserMessage : msg
        )
      );
      updateMessage(conversationId, userMessage.id, { status: 'sent' });

      // Add assistant response
      const assistantMessage: ChatMessageType = {
        id: data.id,
        conversationId,
        role: 'assistant',
        content: data.content,
        timestamp: new Date(data.timestamp),
        status: 'sent',
        metadata: data.metadata,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      addMessage(conversationId, assistantMessage);
    } catch (error) {
      // Mark message as error
      const errorMessage = {
        ...userMessage,
        status: 'error' as const,
        metadata: {
          error:
            error instanceof Error
              ? error.message
              : 'Failed to send message',
        },
      };
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? errorMessage : msg
        )
      );
      updateMessage(conversationId, userMessage.id, {
        status: 'error',
        metadata: errorMessage.metadata,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle retrying a failed message
  const handleRetry = (messageId: string) => {
    const message = messages.find((msg) => msg.id === messageId);
    if (message && message.role === 'user') {
      // Remove the failed message
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      // Resend it
      handleSendMessage(message.content);
    }
  };

  // Handle applying a suggestion
  const handleApplySuggestion = async (id: string) => {
    const suggestion = suggestions.find((s) => s.id === id);
    if (!suggestion) return;

    // Pre-fill the chat input with suggestion title
    handleSendMessage(suggestion.title);
  };

  // Get top 3 suggestions for the suggestions bar
  const topSuggestions = suggestions.slice(0, 3);
  const hasMessages = messages.length > 0;

  // Calculate insights from real data
  const totalBalance = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
  const primaryAccount = accounts.find(acc => acc.isPrimary) || accounts[0];
  const primaryCurrency = primaryAccount?.currency || 'EUR';

  // Calculate week-over-week change
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentTransactions = transactions.filter(t =>
    new Date(t.transactionDate) >= weekAgo
  );
  const weeklyChange = recentTransactions.reduce((sum, t) =>
    sum + (t.type === 'CREDIT' ? t.amount : -t.amount), 0
  );

  // Count pending items
  const pendingInvoicesCount = invoices.length;
  const extractedInvoicesCount = extractedInvoices.length;
  const totalPendingReview = extractedInvoicesCount;

  // Get upcoming items (next 7 days)
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const upcomingInvoices = invoices.filter(inv => {
    const dueDate = new Date(inv.dueDate);
    return dueDate <= nextWeek && dueDate >= new Date();
  });

  const isLoadingData = accountsLoading || transactionsLoading || invoicesLoading || extractedLoading;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* Main Content Area */}
      <ScrollArea className="flex-1">
        <div
          className="mx-auto px-4 py-6 md:py-8"
          style={{
            maxWidth: '800px',
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Welcome Section */}
          <div className="text-center mb-6 md:mb-8">
            <h1
              className="font-semibold mb-2"
              style={{
                fontSize: 'var(--font-size-3xl)',
                color: 'var(--color-text-primary)',
              }}
            >
              {getGreeting()}, {user?.firstName || 'there'}!
            </h1>
            <p
              style={{
                fontSize: 'var(--font-size-base)',
                color: 'var(--color-text-secondary)',
              }}
            >
              How can I help you manage your business today?
            </p>
          </div>

          {/* Chat Messages Area */}
          <div
            className="flex-1 mb-6 md:mb-8"
            style={{
              minHeight: hasMessages ? '400px' : '200px',
            }}
          >
            {hasMessages ? (
              <div className="space-y-4 md:space-y-6">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onRetry={handleRetry}
                  />
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex gap-3">
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: 'var(--color-accent-light)',
                      }}
                    >
                      <div className="flex gap-1">
                        <span
                          className="h-2 w-2 rounded-full animate-bounce"
                          style={{ background: 'var(--color-primary)' }}
                        />
                        <span
                          className="h-2 w-2 rounded-full animate-bounce"
                          style={{
                            background: 'var(--color-primary)',
                            animationDelay: '150ms',
                          }}
                        />
                        <span
                          className="h-2 w-2 rounded-full animate-bounce"
                          style={{
                            background: 'var(--color-primary)',
                            animationDelay: '300ms',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Auto-scroll anchor */}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="text-center py-12">
                <p
                  style={{
                    fontSize: 'var(--font-size-lg)',
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  Start a conversation
                </p>
                <p
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  Ask me anything about your business
                </p>
              </div>
            )}
          </div>

          {/* Insight Cards - Three cards at bottom */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Email Insights Card */}
            <Card
              className="transition-all hover:shadow-md"
              style={{
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-surface)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="p-2 rounded-md"
                    style={{
                      background: 'var(--color-accent-light)',
                    }}
                  >
                    <Mail
                      className="h-5 w-5"
                      style={{ color: 'var(--color-primary)' }}
                    />
                  </div>
                  <CardTitle
                    style={{
                      fontSize: 'var(--font-size-base)',
                      fontWeight: '600',
                    }}
                  >
                    Email Insights
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--color-text-muted)' }} />
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                      Loading...
                    </span>
                  </div>
                ) : (
                  <CardDescription
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {totalPendingReview > 0
                      ? `${totalPendingReview} invoice${totalPendingReview !== 1 ? 's' : ''} to review`
                      : 'All caught up!'}
                  </CardDescription>
                )}
              </CardContent>
            </Card>

            {/* Bank Summary Card */}
            <Card
              className="transition-all hover:shadow-md"
              style={{
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-surface)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="p-2 rounded-md"
                    style={{
                      background: 'var(--color-accent-light)',
                    }}
                  >
                    <Building2
                      className="h-5 w-5"
                      style={{ color: 'var(--color-primary)' }}
                    />
                  </div>
                  <CardTitle
                    style={{
                      fontSize: 'var(--font-size-base)',
                      fontWeight: '600',
                    }}
                  >
                    Bank Summary
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--color-text-muted)' }} />
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                      Loading...
                    </span>
                  </div>
                ) : accounts.length > 0 ? (
                  <CardDescription
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {formatWithSymbol(totalBalance, primaryCurrency as any)} balance
                    <br />
                    {weeklyChange >= 0 ? '+' : ''}
                    {formatWithSymbol(weeklyChange, primaryCurrency as any)} this week
                  </CardDescription>
                ) : (
                  <CardDescription
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    No bank accounts connected
                  </CardDescription>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Card */}
            <Card
              className="transition-all hover:shadow-md"
              style={{
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-surface)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="p-2 rounded-md"
                    style={{
                      background: 'var(--color-accent-light)',
                    }}
                  >
                    <Calendar
                      className="h-5 w-5"
                      style={{ color: 'var(--color-primary)' }}
                    />
                  </div>
                  <CardTitle
                    style={{
                      fontSize: 'var(--font-size-base)',
                      fontWeight: '600',
                    }}
                  >
                    Upcoming
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--color-text-muted)' }} />
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                      Loading...
                    </span>
                  </div>
                ) : upcomingInvoices.length > 0 ? (
                  <CardDescription
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {upcomingInvoices.slice(0, 2).map((inv, idx) => {
                      const daysUntil = Math.ceil(
                        (new Date(inv.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                      );
                      return (
                        <div key={inv.id}>
                          {idx > 0 && <br />}
                          - Invoice #{inv.number} ({daysUntil}d)
                        </div>
                      );
                    })}
                    {upcomingInvoices.length > 2 && (
                      <>
                        <br />
                        <span style={{ color: 'var(--color-text-muted)' }}>
                          +{upcomingInvoices.length - 2} more
                        </span>
                      </>
                    )}
                  </CardDescription>
                ) : (
                  <CardDescription
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    No upcoming invoices
                  </CardDescription>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>

      {/* Fixed Input Area at Bottom */}
      <div
        className="border-t"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div
          className="mx-auto px-4"
          style={{
            maxWidth: '800px',
          }}
        >
          {/* Suggestions Bar above input */}
          {topSuggestions.length > 0 && !hasMessages && (
            <div
              className="py-3 border-b overflow-x-auto"
              style={{
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="flex gap-3">
                {topSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleApplySuggestion(suggestion.id)}
                    className="flex items-center gap-2 px-4 py-2 shrink-0 transition-all hover:scale-105"
                    style={{
                      background: 'var(--color-accent-light)',
                      color: 'var(--color-primary-dark)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    💡 {suggestion.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input with placeholders */}
          <ChatInput
            onSend={handleSendMessage}
            disabled={isLoading}
            isLoading={isLoading}
            placeholder="Ask anything about your business..."
            showAttachment={true}
            showVoice={true}
          />
        </div>
      </div>
    </div>
  );
}
