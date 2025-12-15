"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import {
  taxAssistantApi,
  type TaxSuggestion,
  type TaxDeadline,
  type TaxSummary,
  type SuggestionsFilters,
  type DeadlinesFilters,
} from "@/lib/api/tax-assistant";

// Hooks
export function useTaxSuggestions(filters?: SuggestionsFilters) {
  return useQuery({
    queryKey: ["tax-suggestions", filters],
    queryFn: () => taxAssistantApi.getSuggestions(filters),
  });
}

export function useTaxDeadlines(filters?: DeadlinesFilters) {
  return useQuery({
    queryKey: ["tax-deadlines", filters],
    queryFn: () => taxAssistantApi.getDeadlines(filters),
  });
}

export function useTaxSummary() {
  return useQuery({
    queryKey: ["tax-summary"],
    queryFn: () => taxAssistantApi.getSummary(),
  });
}

export function useDismissSuggestion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (suggestionId: string) => taxAssistantApi.dismissSuggestion(suggestionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["tax-summary"] });
      toast({
        title: "Suggestion dismissed",
        description: "The suggestion has been removed from your list.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to dismiss suggestion. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useCompleteSuggestion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (suggestionId: string) => taxAssistantApi.completeSuggestion(suggestionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["tax-summary"] });
      toast({
        title: "Suggestion completed",
        description: "Great work! The suggestion has been marked as complete.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete suggestion. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useRunAnalysis() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => taxAssistantApi.runAnalysis(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["tax-summary"] });
      toast({
        title: "Analysis complete",
        description: "Your tax data has been analyzed for new opportunities.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to run analysis. Please try again.",
        variant: "destructive",
      });
    },
  });
}
