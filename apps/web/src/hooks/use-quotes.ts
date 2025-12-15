'use client';

import { useState, useCallback } from 'react';

import { useToast } from '@/components/ui/use-toast';

// Quote Types
export interface Quote {
  id: string;
  number: string;
  title: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: {
    street?: string;
    city?: string;
    postalCode?: string;
    countryCode: string;
  };
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';
  issueDate: string;
  validUntil: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  discount?: number;
  currency: string;
  notes?: string;
  terms?: string;
  items?: QuoteItem[];
  createdAt: string;
  updatedAt: string;
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  amount: number;
}

export interface QuoteFilters {
  search?: string;
  status?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateQuoteRequest {
  title: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: {
    street?: string;
    city?: string;
    postalCode?: string;
    countryCode: string;
  };
  issueDate: string;
  validUntil: string;
  currency: string;
  discount?: number;
  notes?: string;
  terms?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }[];
}

export interface UpdateQuoteRequest extends Partial<CreateQuoteRequest> {}

interface UseQuotesState {
  quotes: Quote[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

export function useQuotes(initialFilters?: QuoteFilters) {
  const { toast } = useToast();
  const [state, setState] = useState<UseQuotesState>({
    quotes: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
    isLoading: false,
    error: null,
  });

  const [filters, setFilters] = useState<QuoteFilters>(initialFilters || {});

  const fetchQuotes = useCallback(async (customFilters?: QuoteFilters) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // TODO: Replace with actual API call
      // const response = await quotesApi.getQuotes({ ...filters, ...customFilters });

      // Mock data for now
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockQuotes: Quote[] = [
        {
          id: '1',
          number: 'QUO-2024-001',
          title: 'Website Redesign Project',
          customerName: 'Acme Corp',
          customerEmail: 'contact@acme.com',
          status: 'SENT',
          issueDate: '2024-11-15',
          validUntil: '2024-12-15',
          subtotal: 22800,
          taxAmount: 4332,
          totalAmount: 27132,
          currency: 'EUR',
          createdAt: '2024-11-15T10:00:00Z',
          updatedAt: '2024-11-15T10:00:00Z',
        },
        {
          id: '2',
          number: 'QUO-2024-002',
          title: 'Mobile App Development',
          customerName: 'Tech Startup Inc',
          customerEmail: 'info@techstartup.com',
          status: 'ACCEPTED',
          issueDate: '2024-11-10',
          validUntil: '2024-12-10',
          subtotal: 45000,
          taxAmount: 8550,
          totalAmount: 53550,
          currency: 'EUR',
          createdAt: '2024-11-10T14:30:00Z',
          updatedAt: '2024-11-12T09:15:00Z',
        },
        {
          id: '3',
          number: 'QUO-2024-003',
          title: 'Brand Identity Package',
          customerName: 'Fashion Brand Ltd',
          customerEmail: 'hello@fashionbrand.com',
          status: 'DRAFT',
          issueDate: '2024-11-18',
          validUntil: '2024-12-18',
          subtotal: 12000,
          taxAmount: 2280,
          totalAmount: 14280,
          currency: 'EUR',
          createdAt: '2024-11-18T11:20:00Z',
          updatedAt: '2024-11-18T11:20:00Z',
        },
      ];

      setState({
        quotes: mockQuotes,
        total: mockQuotes.length,
        page: 1,
        pageSize: 10,
        totalPages: 1,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch quotes';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [filters, toast]);

  const createQuote = useCallback(async (data: CreateQuoteRequest) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // TODO: Replace with actual API call
      // const quote = await quotesApi.createQuote(data);

      await new Promise(resolve => setTimeout(resolve, 500));
      const newQuote: Quote = {
        id: Date.now().toString(),
        number: `QUO-2024-${String(state.quotes.length + 1).padStart(3, '0')}`,
        ...data,
        items: data.items.map((item, index) => ({
          ...item,
          id: `${Date.now()}-${index}`,
          amount: item.quantity * item.unitPrice,
        })),
        status: 'DRAFT',
        subtotal: 0,
        taxAmount: 0,
        totalAmount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setState(prev => ({
        ...prev,
        quotes: [newQuote, ...prev.quotes],
        total: prev.total + 1,
        isLoading: false,
      }));
      toast({
        title: 'Success',
        description: 'Quote created successfully',
      });
      return newQuote;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create quote';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  }, [state.quotes.length, toast]);

  const updateQuote = useCallback(async (id: string, data: UpdateQuoteRequest) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // TODO: Replace with actual API call
      // const quote = await quotesApi.updateQuote(id, data);

      await new Promise(resolve => setTimeout(resolve, 500));
      setState(prev => ({
        ...prev,
        quotes: prev.quotes.map(q => {
          if (q.id === id) {
            return {
              ...q,
              ...data,
              items: data.items ? data.items.map((item, index) => ({
                ...item,
                id: `${Date.now()}-${index}`,
                amount: item.quantity * item.unitPrice,
              })) : q.items,
              updatedAt: new Date().toISOString()
            };
          }
          return q;
        }),
        isLoading: false,
      }));
      toast({
        title: 'Success',
        description: 'Quote updated successfully',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update quote';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const deleteQuote = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // TODO: Replace with actual API call
      // await quotesApi.deleteQuote(id);

      await new Promise(resolve => setTimeout(resolve, 500));
      setState(prev => ({
        ...prev,
        quotes: prev.quotes.filter(q => q.id !== id),
        total: prev.total - 1,
        isLoading: false,
      }));
      toast({
        title: 'Success',
        description: 'Quote deleted successfully',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete quote';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const sendQuote = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // TODO: Replace with actual API call
      // const quote = await quotesApi.sendQuote(id);

      await new Promise(resolve => setTimeout(resolve, 500));
      setState(prev => ({
        ...prev,
        quotes: prev.quotes.map(q => q.id === id ? { ...q, status: 'SENT' as const, updatedAt: new Date().toISOString() } : q),
        isLoading: false,
      }));
      toast({
        title: 'Success',
        description: 'Quote sent successfully',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send quote';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const convertQuote = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // TODO: Replace with actual API call
      // const invoice = await quotesApi.convertToInvoice(id);

      await new Promise(resolve => setTimeout(resolve, 500));
      setState(prev => ({
        ...prev,
        quotes: prev.quotes.map(q => q.id === id ? { ...q, status: 'CONVERTED' as const, updatedAt: new Date().toISOString() } : q),
        isLoading: false,
      }));
      toast({
        title: 'Success',
        description: 'Quote converted to invoice',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to convert quote';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  return {
    ...state,
    filters,
    setFilters,
    fetchQuotes,
    createQuote,
    updateQuote,
    deleteQuote,
    sendQuote,
    convertQuote,
  };
}

export function useQuote(id: string) {
  const { toast } = useToast();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      // const data = await quotesApi.getQuote(id);

      await new Promise(resolve => setTimeout(resolve, 500));
      // Mock data
      const mockQuote: Quote = {
        id,
        number: 'QUO-2024-001',
        title: 'Website Redesign Project',
        customerName: 'Acme Corp',
        customerEmail: 'contact@acme.com',
        status: 'SENT',
        issueDate: '2024-11-15',
        validUntil: '2024-12-15',
        subtotal: 22800,
        taxAmount: 4332,
        totalAmount: 27132,
        currency: 'EUR',
        createdAt: '2024-11-15T10:00:00Z',
        updatedAt: '2024-11-15T10:00:00Z',
      };
      setQuote(mockQuote);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch quote';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [id, toast]);

  const updateQuote = useCallback(async (data: UpdateQuoteRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      // const updated = await quotesApi.updateQuote(id, data);

      await new Promise(resolve => setTimeout(resolve, 500));
      if (!quote) {
        throw new Error('Quote not found');
      }
      const updated = {
        ...quote,
        ...data,
        items: data.items ? data.items.map((item, index) => ({
          ...item,
          id: `${Date.now()}-${index}`,
          amount: item.quantity * item.unitPrice,
        })) : quote.items,
        updatedAt: new Date().toISOString()
      };
      setQuote(updated);
      toast({
        title: 'Success',
        description: 'Quote updated successfully',
      });
      return updated;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update quote';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [id, quote, toast]);

  return {
    quote,
    isLoading,
    error,
    fetchQuote,
    updateQuote,
  };
}
