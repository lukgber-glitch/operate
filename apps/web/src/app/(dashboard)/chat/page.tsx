'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { useSuggestions } from '@/hooks/useSuggestions';
import { useConversationHistory } from '@/hooks/use-conversation-history';
import { useBankAccounts, useBankTransactions } from '@/hooks/use-banking';
import { useInvoices } from '@/hooks/use-invoices';
import { useCurrencyFormat } from '@/hooks/use-currency-format';
import { useAIConsent } from '@/hooks/useAIConsent';
import { api } from '@/lib/api/client';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { ExtractionReviewStatus } from '@/types/extracted-invoice';
import { useRef, useEffect, useState, Suspense, lazy } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { Mail, Building2, Calendar, Mic, History, Loader2, Brain, AlertCircle } from 'lucide-react';
import { GuruLogo } from '@/components/ui/guru-logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { listExtractedInvoices } from '@/lib/api/extracted-invoices';
import { fadeUp, staggerContainer, scaleIn } from '@/lib/animation-variants';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { useChatWizardPanel } from '@/hooks/useChatWizardPanel';
import { WizardPanelContainer } from '@/components/panels/wizards';

// Lazy load non-critical components for faster initial render
const SuggestionChips = lazy(() => import('@/components/chat/SuggestionChips').then(m => ({ default: m.SuggestionChips })));
const ChatHistoryDropdown = lazy(() => import('@/components/chat/ChatHistoryDropdown').then(m => ({ default: m.ChatHistoryDropdown })));
const GreetingHeader = lazy(() => import('@/components/chat/GreetingHeader').then(m => ({ default: m.GreetingHeader })));
const AIConsentDialog = lazy(() => import('@/components/consent/AIConsentDialog').then(m => ({ default: m.AIConsentDialog })));

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
function ChatPageContent() {
  const { user } = useAuth();
  // Defer suggestions loading - not critical for initial render
  const { suggestions, dismissSuggestion } = useSuggestions({
    context: 'chat-landing',
  });

  const {
    activeConversation,
    activeConversationId,
    createConversation,
    addMessage,
    updateMessage,
    setActiveConversationId,
  } = useConversationHistory();

  // AI Consent Management
  const {
    hasConsent,
    needsConsent,
    isLoading: consentLoading,
    giveConsent,
    revokeConsent,
  } = useAIConsent();

  // Wizard Panel Management
  const {
    panelState,
    isOpen: isPanelOpen,
    currentGuidance,
    openPanel,
    closePanel,
    onStepChange: handlePanelStepChange,
    onPanelComplete,
    getPanelTitle,
  } = useChatWizardPanel();

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [attemptedMessage, setAttemptedMessage] = useState<string | null>(null);

  // Fetch real data from APIs
  const { accounts, fetchBankAccounts, isLoading: accountsLoading } = useBankAccounts();
  const { transactions, fetchTransactions, isLoading: transactionsLoading } = useBankTransactions({ pageSize: 5 });
  const { invoices, fetchInvoices, isLoading: invoicesLoading } = useInvoices({ status: 'SENT', pageSize: 10 });
  const [extractedInvoices, setExtractedInvoices] = useState<any[]>([]);
  const [extractedLoading, setExtractedLoading] = useState(false);
  const { formatWithSymbol } = useCurrencyFormat('EUR');

  // Load active conversation messages
  useEffect(() => {
    if (activeConversation) {
      setMessages(activeConversation.messages);
    } else {
      setMessages([]);
    }
  }, [activeConversation]);

  // Fetch data on mount - PARALLELIZED for performance
  useEffect(() => {
    const loadData = async () => {
      try {
        // Run all API calls in parallel for faster loading
        const [accountsResult, transactionsResult, invoicesResult, extractedResult] = await Promise.allSettled([
          fetchBankAccounts(),
          fetchTransactions(),
          fetchInvoices({ status: 'SENT' }),
          listExtractedInvoices({
            reviewStatus: ExtractionReviewStatus.PENDING_REVIEW,
            limit: 10
          })
        ]);

        // Handle extracted invoices result
        if (extractedResult.status === 'fulfilled') {
          setExtractedInvoices(extractedResult.value.items || []);
        } else {
          console.error('Failed to fetch extracted invoices:', extractedResult.reason);
          setExtractedInvoices([]);
        }
        setExtractedLoading(false);
      } catch (error) {
        console.error('Failed to load chat context data:', error);
        setExtractedLoading(false);
      }
    };

    loadData();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-show consent dialog when user needs consent (first visit to chat without consent)
  // Note: useAIConsent hook now initializes synchronously from localStorage,
  // so we no longer need complex race condition handling
  useEffect(() => {
    if (!consentLoading && needsConsent && !showConsentDialog) {
      // Small delay to let page render first
      const timer = setTimeout(() => {
        setShowConsentDialog(true);
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [consentLoading, needsConsent, showConsentDialog]);

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    // Check for AI consent before sending
    if (needsConsent || !hasConsent) {
      setAttemptedMessage(content);
      setShowConsentDialog(true);
      return;
    }

    // Create or get conversation
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

    // Add to local state for immediate UI update
    setMessages((prev) => [...prev, userMessage]);
    // Add to conversation history
    addMessage(conversationId, userMessage);
    setIsLoading(true);

    try {
      // Send message to API using apiClient for CSRF support
      interface MessageResponse {
        id: string;
        content: string;
        createdAt?: string;
        actionType?: string;
        actionParams?: Record<string, unknown>;
        actionResult?: {
          success: boolean;
          message: string;
          entityId?: string;
          entityType?: string;
          data?: unknown;
        };
        actionStatus?: string;
      }
      const { data } = await api.post<MessageResponse[]>(
        `/chatbot/conversations/${conversationId}/messages`,
        { content }
      );

      // Backend returns array of [userMessage, assistantMessage]
      const [userResp, assistantResp] = data || [];

      if (!userResp || !assistantResp) {
        throw new Error('Invalid response from server');
      }

      // Update user message status
      const sentUserMessage = { ...userMessage, status: 'sent' as const, id: userResp.id };
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? sentUserMessage : msg
        )
      );
      updateMessage(conversationId, userMessage.id, { status: 'sent' });

      // Add assistant response
      const assistantMessage: ChatMessageType = {
        id: assistantResp.id,
        conversationId,
        role: 'assistant',
        content: assistantResp.content,
        timestamp: assistantResp.createdAt ? new Date(assistantResp.createdAt) : new Date(),
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

      // Check if the action should trigger a panel wizard
      if (assistantResp.actionType) {
        checkForPanelTrigger(assistantResp.actionType, assistantResp.actionParams);
      }
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

  // Handle AI consent acceptance
  const handleConsentAccept = async () => {
    const success = await giveConsent();
    if (success) {
      setShowConsentDialog(false);
      // If there was an attempted message, send it now
      if (attemptedMessage) {
        handleSendMessage(attemptedMessage);
        setAttemptedMessage(null);
      }
    }
  };

  // Handle AI consent decline
  const handleConsentDecline = () => {
    setShowConsentDialog(false);
    setAttemptedMessage(null);
  };

  // Handle session selection from dropdown
  const handleSelectSession = (id: string) => {
    setActiveConversationId(id);
  };

  // Detect panel triggers from AI response action types
  const checkForPanelTrigger = (actionType?: string, actionParams?: any) => {
    const panelTriggers: Record<string, Parameters<typeof openPanel>[0]> = {
      'create_invoice': 'invoice_builder',
      'create_expense': 'expense_form',
      'create_customer': 'client_form',
      'request_leave': 'leave_request',
      'create_quote': 'quote_builder',
      'create_contract': 'contract_builder',
      'hire_employee': 'employee_onboard',
      'create_project': 'project_create',
    };

    const panelType = panelTriggers[actionType || ''];
    if (panelType) {
      openPanel(panelType, { initialData: actionParams });
    }
  };

  // Handle new session from dropdown
  const handleNewSession = () => {
    createConversation();
    setMessages([]);
  };

  // Get top 3 suggestions for the suggestions bar
  const safeSuggestions = Array.isArray(suggestions) ? suggestions : [];
  const topSuggestions = safeSuggestions.slice(0, 3);
  const hasMessages = messages.length > 0;

  // Ensure data is always an array for safe iteration
  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeInvoices = Array.isArray(invoices) ? invoices : [];
  const safeExtractedInvoices = Array.isArray(extractedInvoices) ? extractedInvoices : [];

  // Calculate insights from real data
  const totalBalance = safeAccounts.reduce((sum, account) => sum + (account.balance || 0), 0);
  const primaryAccount = safeAccounts.find(acc => acc.isPrimary) || safeAccounts[0];
  const primaryCurrency = primaryAccount?.currency || 'EUR';

  // Calculate week-over-week change
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentTransactions = safeTransactions.filter(t =>
    new Date(t.transactionDate) >= weekAgo
  );
  const weeklyChange = recentTransactions.reduce((sum, t) =>
    sum + (t.type === 'CREDIT' ? t.amount : -t.amount), 0
  );

  // Count pending items
  const pendingInvoicesCount = safeInvoices.length;
  const extractedInvoicesCount = safeExtractedInvoices.length;
  const totalPendingReview = extractedInvoicesCount;

  // Get upcoming items (next 7 days)
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const upcomingInvoices = safeInvoices.filter(inv => {
    const dueDate = new Date(inv.dueDate);
    return dueDate <= nextWeek && dueDate >= new Date();
  });

  const isLoadingData = accountsLoading || transactionsLoading || invoicesLoading || extractedLoading;

  // Card hover animation
  const cardHover = {
    scale: 1.02,
    transition: { type: 'spring' as const, stiffness: 400, damping: 17 }
  };

  return (
    <>
      {/* AI Consent Dialog - Lazy loaded with Suspense */}
      <Suspense fallback={null}>
        <AIConsentDialog
          open={showConsentDialog}
          onOpenChange={setShowConsentDialog}
          onAccept={handleConsentAccept}
          onDecline={handleConsentDecline}
          isLoading={consentLoading}
        />
      </Suspense>

      {/* Premium Chat Interface */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative"
      >
        {/* Greeting Header with animation */}
        <motion.div variants={fadeUp} className="mb-6 lg:mb-8">
          <Suspense fallback={
            <div className="h-12 animate-pulse bg-gradient-to-r from-slate-200 to-slate-100 rounded-lg" />
          }>
            <GreetingHeader />
          </Suspense>
        </motion.div>

        <motion.div variants={fadeUp} className="h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
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

            {/* Chat History Dropdown - Lazy loaded with Suspense */}
            <div className="mb-4">
              <Suspense fallback={
                <div className="h-10 animate-pulse bg-gray-200 rounded-lg" />
              }>
                <ChatHistoryDropdown
                  currentSessionId={activeConversationId || undefined}
                  onSelectSession={handleSelectSession}
                  onNewSession={handleNewSession}
                />
              </Suspense>
            </div>

            {/* AI Consent Warning - show when user hasn't consented */}
            {!consentLoading && !hasConsent && (
              <Alert className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="flex items-center justify-between text-amber-800 dark:text-amber-200">
                  <span>
                    AI features are disabled. Enable AI processing to use the chat assistant.
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConsentDialog(true)}
                    className="ml-4 border-amber-300 dark:border-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Enable AI
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Suggestion Chips - Shown when no messages (moved up for better visibility) */}
            {!hasMessages && (
              <div className="mb-6">
                <Suspense fallback={
                  <div className="flex flex-wrap gap-2 py-2 justify-center">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-8 w-40 animate-pulse bg-slate-200 dark:bg-slate-700 rounded-full" />
                    ))}
                  </div>
                }>
                  <SuggestionChips onSelect={handleSendMessage} />
                </Suspense>
              </div>
            )}

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

                {/* Panel Guidance Message */}
                {isPanelOpen && currentGuidance && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #06BF9D 0%, #059e82 100%)',
                      }}
                    >
                      <GuruLogo size={16} variant="light" />
                    </div>
                    <div
                      className="flex-1 rounded-2xl px-4 py-3"
                      style={{
                        background: 'linear-gradient(135deg, rgba(6, 191, 157, 0.08) 0%, rgba(6, 191, 157, 0.02) 100%)',
                        border: '1px solid rgba(6, 191, 157, 0.2)',
                      }}
                    >
                      <p className="text-sm text-emerald-200">{currentGuidance}</p>
                    </div>
                  </motion.div>
                )}

                {/* Auto-scroll anchor */}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <motion.div
                className="text-center py-12"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring' as const, stiffness: 200, damping: 25 }}
              >
                {/* Premium empty state with animated sparkle */}
                <motion.div
                  className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center mb-4"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(99, 91, 255, 0.1)',
                      '0 0 40px rgba(99, 91, 255, 0.2)',
                      '0 0 20px rgba(99, 91, 255, 0.1)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <GuruLogo size={32} variant="colored" className="opacity-60" />
                </motion.div>
                <p className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Start a conversation
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Ask me anything about your business
                </p>
              </motion.div>
            )}
          </div>

          {/* Chat Input - integrated with chat area */}
          <div className="mb-8">
            <ChatInput
              onSend={handleSendMessage}
              disabled={isLoading || (!consentLoading && needsConsent)}
              isLoading={isLoading}
              placeholder={
                consentLoading
                  ? "Loading..."
                  : hasConsent
                    ? "Ask anything about your business..."
                    : "Enable AI to use chat features..."
              }
              showAttachment={true}
              showVoice={true}
              showQuickActions={false}
              showHistory={false}
            />
          </div>

          {/* Insight Cards - At the bottom */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Email Insights Card */}
          <motion.div variants={fadeUp} whileHover={cardHover}>
            <Card className="rounded-[12px] border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-400/20 dark:to-blue-500/10">
                    <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Email Insights
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                {isLoadingData ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                    <span className="text-xs text-slate-400">Loading...</span>
                  </div>
                ) : (
                  <CardDescription className="text-xs text-slate-600 dark:text-slate-300">
                    {totalPendingReview > 0
                      ? `${totalPendingReview} invoice${totalPendingReview !== 1 ? 's' : ''} to review`
                      : 'All caught up!'}
                  </CardDescription>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Bank Summary Card */}
          <motion.div variants={fadeUp} whileHover={cardHover}>
            <Card className="rounded-[12px] border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 dark:from-emerald-400/20 dark:to-emerald-500/10">
                    <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Bank Summary
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                {isLoadingData ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                    <span className="text-xs text-slate-400">Loading...</span>
                  </div>
                ) : accounts.length > 0 ? (
                  <CardDescription className="text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-medium">{formatWithSymbol(totalBalance, primaryCurrency as any)}</span> balance
                    {' • '}
                    <span className={weeklyChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>
                      {weeklyChange >= 0 ? '+' : ''}
                      {formatWithSymbol(weeklyChange, primaryCurrency as any)}
                    </span> this week
                  </CardDescription>
                ) : (
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                    No bank accounts connected
                  </CardDescription>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Upcoming Card */}
          <motion.div variants={fadeUp} whileHover={cardHover}>
            <Card className="rounded-[12px] border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/5 dark:from-purple-400/20 dark:to-purple-500/10">
                    <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Upcoming
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                {isLoadingData ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                    <span className="text-xs text-slate-400">Loading...</span>
                  </div>
                ) : upcomingInvoices.length > 0 ? (
                  <CardDescription className="text-xs text-slate-600 dark:text-slate-300">
                    {upcomingInvoices.slice(0, 2).map((inv, idx) => {
                      const daysUntil = Math.ceil(
                        (new Date(inv.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                      );
                      return (
                        <span key={inv.id}>
                          {idx > 0 && ' • '}
                          #{inv.number} <span className="text-purple-600 dark:text-purple-400 font-medium">({daysUntil}d)</span>
                        </span>
                      );
                    })}
                    {upcomingInvoices.length > 2 && (
                      <span className="text-slate-400"> +{upcomingInvoices.length - 2}</span>
                    )}
                  </CardDescription>
                ) : (
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                    No upcoming invoices
                  </CardDescription>
                )}
              </CardContent>
            </Card>
          </motion.div>
          </motion.div>
        </div>
      </ScrollArea>
        </motion.div>
      </motion.div>
    {/* Wizard Panel Container */}
      <WizardPanelContainer
        type={panelState.type}
        isOpen={isPanelOpen}
        onClose={closePanel}
        onComplete={onPanelComplete}
        onStepChange={handlePanelStepChange}
        title={getPanelTitle()}
        size={panelState.size}
        initialData={panelState.initialData}
      />
    </>
  );
}

export default function ChatPage() {
  return (
    <ErrorBoundary>
      <ChatPageContent />
    </ErrorBoundary>
  );
}
