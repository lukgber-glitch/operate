/**
 * Chat Store Tests
 * Unit tests for chat state management
 */

import { useChatStore } from './chatStore';
import type { ChatConversation, ChatMessage } from '../types/chat';

describe('ChatStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useChatStore.getState().resetStore();
  });

  describe('Conversation Management', () => {
    it('should add a conversation', () => {
      const { addConversation } = useChatStore.getState();

      const conv: ChatConversation = {
        id: '1',
        title: 'Test Conversation',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addConversation(conv);

      const state = useChatStore.getState();
      expect(state.conversations).toHaveLength(1);
      expect(state.conversations[0].id).toBe('1');
    });

    it('should set active conversation', () => {
      const { addConversation, setActiveConversation } = useChatStore.getState();

      const conv: ChatConversation = {
        id: '1',
        title: 'Test',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addConversation(conv);
      setActiveConversation('1');

      expect(useChatStore.getState().activeConversationId).toBe('1');
    });

    it('should update conversation', () => {
      const { addConversation, updateConversation } = useChatStore.getState();

      const conv: ChatConversation = {
        id: '1',
        title: 'Original Title',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addConversation(conv);
      updateConversation('1', { title: 'Updated Title' });

      const state = useChatStore.getState();
      expect(state.conversations[0].title).toBe('Updated Title');
    });

    it('should delete conversation', () => {
      const { addConversation, deleteConversation, setActiveConversation } =
        useChatStore.getState();

      const conv: ChatConversation = {
        id: '1',
        title: 'Test',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addConversation(conv);
      setActiveConversation('1');
      deleteConversation('1');

      const state = useChatStore.getState();
      expect(state.conversations).toHaveLength(0);
      expect(state.activeConversationId).toBeNull();
    });
  });

  describe('Message Management', () => {
    beforeEach(() => {
      const { addConversation } = useChatStore.getState();

      const conv: ChatConversation = {
        id: 'conv1',
        title: 'Test Conversation',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addConversation(conv);
    });

    it('should add message to conversation', () => {
      const { addMessage } = useChatStore.getState();

      const message: ChatMessage = {
        id: 'msg1',
        role: 'user',
        content: 'Hello',
        timestamp: new Date(),
      };

      addMessage('conv1', message);

      const state = useChatStore.getState();
      expect(state.messages['conv1']).toHaveLength(1);
      expect(state.messages['conv1'][0].content).toBe('Hello');
    });

    it('should update message', () => {
      const { addMessage, updateMessage } = useChatStore.getState();

      const message: ChatMessage = {
        id: 'msg1',
        role: 'user',
        content: 'Original',
        timestamp: new Date(),
      };

      addMessage('conv1', message);
      updateMessage('conv1', 'msg1', { content: 'Updated' });

      const state = useChatStore.getState();
      expect(state.messages['conv1'][0].content).toBe('Updated');
    });

    it('should delete message', () => {
      const { addMessage, deleteMessage } = useChatStore.getState();

      const message: ChatMessage = {
        id: 'msg1',
        role: 'user',
        content: 'Hello',
        timestamp: new Date(),
      };

      addMessage('conv1', message);
      deleteMessage('conv1', 'msg1');

      const state = useChatStore.getState();
      expect(state.messages['conv1']).toHaveLength(0);
    });

    it('should clear conversation messages', () => {
      const { addMessage, clearConversation } = useChatStore.getState();

      const message1: ChatMessage = {
        id: 'msg1',
        role: 'user',
        content: 'Hello',
        timestamp: new Date(),
      };

      const message2: ChatMessage = {
        id: 'msg2',
        role: 'assistant',
        content: 'Hi there',
        timestamp: new Date(),
      };

      addMessage('conv1', message1);
      addMessage('conv1', message2);
      clearConversation('conv1');

      const state = useChatStore.getState();
      expect(state.messages['conv1']).toHaveLength(0);
    });
  });

  describe('Pending Messages (Optimistic Updates)', () => {
    it('should add pending message', () => {
      const { addPendingMessage } = useChatStore.getState();

      const tempId = addPendingMessage({
        id: '',
        conversationId: 'conv1',
        role: 'user',
        content: 'Sending...',
        timestamp: new Date(),
        status: 'sending',
      });

      const state = useChatStore.getState();
      expect(state.pendingMessages).toHaveLength(1);
      expect(state.pendingMessages[0].tempId).toBe(tempId);
      expect(state.isSending).toBe(true);
    });

    it('should confirm pending message', () => {
      const { addPendingMessage, confirmMessage, addConversation } =
        useChatStore.getState();

      // Add conversation first
      const conv: ChatConversation = {
        id: 'conv1',
        title: 'Test',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      addConversation(conv);

      const tempId = addPendingMessage({
        id: '',
        conversationId: 'conv1',
        role: 'user',
        content: 'Sending...',
        timestamp: new Date(),
        status: 'sending',
      });

      const realMessage: ChatMessage = {
        id: 'real_msg1',
        conversationId: 'conv1',
        role: 'user',
        content: 'Sending...',
        timestamp: new Date(),
        status: 'sent',
      };

      confirmMessage(tempId, realMessage);

      const state = useChatStore.getState();
      expect(state.pendingMessages).toHaveLength(0);
      expect(state.messages['conv1']).toHaveLength(1);
      expect(state.messages['conv1'][0].id).toBe('real_msg1');
      expect(state.isSending).toBe(false);
    });

    it('should fail pending message', () => {
      const { addPendingMessage, failMessage } = useChatStore.getState();

      const tempId = addPendingMessage({
        id: '',
        conversationId: 'conv1',
        role: 'user',
        content: 'Failed message',
        timestamp: new Date(),
        status: 'sending',
      });

      failMessage(tempId, 'Network error');

      const state = useChatStore.getState();
      expect(state.pendingMessages).toHaveLength(1);
      expect(state.pendingMessages[0].status).toBe('error');
      expect(state.pendingMessages[0].error).toBe('Network error');
    });

    it('should remove pending message', () => {
      const { addPendingMessage, removePendingMessage } = useChatStore.getState();

      const tempId = addPendingMessage({
        id: '',
        conversationId: 'conv1',
        role: 'user',
        content: 'Test',
        timestamp: new Date(),
        status: 'sending',
      });

      removePendingMessage(tempId);

      const state = useChatStore.getState();
      expect(state.pendingMessages).toHaveLength(0);
    });
  });

  describe('Suggestions', () => {
    it('should set suggestions', () => {
      const { setSuggestions } = useChatStore.getState();

      const suggestions = [
        {
          id: 'sug1',
          type: 'QUICK_ACTION' as const,
          title: 'Create Invoice',
          description: 'Quick action to create invoice',
          priority: 'MEDIUM' as const,
          page: 'invoices',
          createdAt: new Date(),
        },
      ];

      setSuggestions(suggestions);

      const state = useChatStore.getState();
      expect(state.suggestions).toHaveLength(1);
    });

    it('should add suggestion', () => {
      const { addSuggestion } = useChatStore.getState();

      const suggestion = {
        id: 'sug1',
        type: 'INSIGHT' as const,
        title: 'Tax Insight',
        description: 'Tax optimization available',
        priority: 'HIGH' as const,
        page: 'tax',
        createdAt: new Date(),
      };

      addSuggestion(suggestion);

      const state = useChatStore.getState();
      expect(state.suggestions).toHaveLength(1);
    });

    it('should remove suggestion', () => {
      const { addSuggestion, removeSuggestion } = useChatStore.getState();

      const suggestion = {
        id: 'sug1',
        type: 'WARNING' as const,
        title: 'Warning',
        description: 'Test warning',
        priority: 'URGENT' as const,
        page: 'dashboard',
        createdAt: new Date(),
      };

      addSuggestion(suggestion);
      removeSuggestion('sug1');

      const state = useChatStore.getState();
      expect(state.suggestions).toHaveLength(0);
    });

    it('should clear all suggestions', () => {
      const { setSuggestions, clearSuggestions } = useChatStore.getState();

      const suggestions = [
        {
          id: 'sug1',
          type: 'QUICK_ACTION' as const,
          title: 'Action 1',
          description: 'Test',
          priority: 'LOW' as const,
          page: 'test',
          createdAt: new Date(),
        },
        {
          id: 'sug2',
          type: 'QUICK_ACTION' as const,
          title: 'Action 2',
          description: 'Test',
          priority: 'LOW' as const,
          page: 'test',
          createdAt: new Date(),
        },
      ];

      setSuggestions(suggestions);
      clearSuggestions();

      const state = useChatStore.getState();
      expect(state.suggestions).toHaveLength(0);
    });
  });

  describe('UI State', () => {
    it('should set loading state', () => {
      const { setLoading } = useChatStore.getState();

      setLoading(true);
      expect(useChatStore.getState().isLoading).toBe(true);

      setLoading(false);
      expect(useChatStore.getState().isLoading).toBe(false);
    });

    it('should set typing state', () => {
      const { setTyping } = useChatStore.getState();

      setTyping(true);
      expect(useChatStore.getState().isTyping).toBe(true);

      setTyping(false);
      expect(useChatStore.getState().isTyping).toBe(false);
    });

    it('should set error state', () => {
      const { setError } = useChatStore.getState();

      setError('Test error');
      expect(useChatStore.getState().error).toBe('Test error');

      setError(null);
      expect(useChatStore.getState().error).toBeNull();
    });
  });

  describe('Selectors', () => {
    beforeEach(() => {
      const { addConversation, addMessage, setActiveConversation } =
        useChatStore.getState();

      const conv: ChatConversation = {
        id: 'conv1',
        title: 'Test Conversation',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addConversation(conv);
      setActiveConversation('conv1');

      const message: ChatMessage = {
        id: 'msg1',
        role: 'user',
        content: 'Test message',
        timestamp: new Date(),
      };

      addMessage('conv1', message);
    });

    it('should get active conversation', () => {
      const { getActiveConversation } = useChatStore.getState();
      const activeConv = getActiveConversation();

      expect(activeConv).toBeDefined();
      expect(activeConv?.id).toBe('conv1');
    });

    it('should get active messages', () => {
      const { getActiveMessages } = useChatStore.getState();
      const messages = getActiveMessages();

      expect(messages).toHaveLength(1);
      expect(messages[0].content).toBe('Test message');
    });

    it('should get conversation by id', () => {
      const { getConversation } = useChatStore.getState();
      const conv = getConversation('conv1');

      expect(conv).toBeDefined();
      expect(conv?.title).toBe('Test Conversation');
    });

    it('should get messages for conversation', () => {
      const { getMessages } = useChatStore.getState();
      const messages = getMessages('conv1');

      expect(messages).toHaveLength(1);
    });

    it('should check if has conversations', () => {
      const { hasConversations } = useChatStore.getState();

      expect(hasConversations()).toBe(true);
    });
  });

  describe('Bulk Operations', () => {
    it('should reset store', () => {
      const { addConversation, resetStore } = useChatStore.getState();

      const conv: ChatConversation = {
        id: '1',
        title: 'Test',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addConversation(conv);
      resetStore();

      const state = useChatStore.getState();
      expect(state.conversations).toHaveLength(0);
      expect(state.messages).toEqual({});
      expect(state.activeConversationId).toBeNull();
    });

    it('should hydrate conversations', () => {
      const { hydrateConversations } = useChatStore.getState();

      const conversations: ChatConversation[] = [
        {
          id: '1',
          title: 'Conv 1',
          messages: [
            {
              id: 'msg1',
              role: 'user',
              content: 'Hello',
              timestamp: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          title: 'Conv 2',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      hydrateConversations(conversations);

      const state = useChatStore.getState();
      expect(state.conversations).toHaveLength(2);
      expect(state.messages['1']).toHaveLength(1);
      expect(state.messages['2']).toHaveLength(0);
    });
  });
});
