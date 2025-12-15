"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaxSuggestionCard } from "@/components/tax-assistant/TaxSuggestionCard";
import { useTaxSuggestions } from "@/hooks/use-tax-assistant";
import { Search, Filter, ArrowUpDown } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function TaxSuggestionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ACTIVE");
  const [sortBy, setSortBy] = useState<string>("SAVINGS_DESC");

  const { data: suggestions, isLoading } = useTaxSuggestions({
    priority: priorityFilter !== "ALL" ? [priorityFilter] : undefined,
    type: typeFilter !== "ALL" ? typeFilter : undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
  });

  // Client-side filtering and sorting
  const filteredSuggestions = suggestions
    ?.filter((s) => {
      if (!searchQuery) return true;
      return (
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "SAVINGS_DESC":
          return b.potentialSavings - a.potentialSavings;
        case "SAVINGS_ASC":
          return a.potentialSavings - b.potentialSavings;
        case "PRIORITY":
          const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        default:
          return 0;
      }
    }) || [];

  const totalPotentialSavings = filteredSuggestions.reduce(
    (sum, s) => sum + s.potentialSavings,
    0
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Tax Suggestions</h1>
        <p className="text-muted-foreground mt-1">
          All tax-saving opportunities and recommendations
        </p>
      </div>

      {/* Summary Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Total Potential Savings</div>
            <div className="text-2xl font-bold text-green-600">
              €{totalPotentialSavings.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Active Suggestions</div>
            <div className="text-2xl font-bold">{filteredSuggestions.length}</div>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suggestions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Priority Filter */}
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priorities</SelectItem>
              <SelectItem value="HIGH">High Priority</SelectItem>
              <SelectItem value="MEDIUM">Medium Priority</SelectItem>
              <SelectItem value="LOW">Low Priority</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="DISMISSED">Dismissed</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SAVINGS_DESC">Savings (High to Low)</SelectItem>
              <SelectItem value="SAVINGS_ASC">Savings (Low to High)</SelectItem>
              <SelectItem value="PRIORITY">Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Suggestions List */}
      {isLoading ? (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">Loading suggestions...</div>
        </Card>
      ) : filteredSuggestions.length === 0 ? (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            No suggestions found. Try adjusting your filters.
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSuggestions.map((suggestion) => (
            <TaxSuggestionCard key={suggestion.id} suggestion={suggestion} />
          ))}
        </div>
      )}
    </div>
  );
}
