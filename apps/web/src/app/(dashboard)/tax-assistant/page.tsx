"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaxSavingsCard } from "@/components/tax-assistant/TaxSavingsCard";
import { TaxSuggestionsList } from "@/components/tax-assistant/TaxSuggestionsList";
import { TaxDeadlineCard } from "@/components/tax-assistant/TaxDeadlineCard";
import { TaxDeadlineCalendar } from "@/components/tax-assistant/TaxDeadlineCalendar";
import { useTaxSummary, useTaxSuggestions, useTaxDeadlines, useRunAnalysis } from "@/hooks/use-tax-assistant";
import { Lightbulb, Calendar, RefreshCw, Filter } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

export default function TaxAssistantPage() {
  const [showCalendar, setShowCalendar] = useState(false);
  const { data: summary, isLoading: summaryLoading } = useTaxSummary();
  const { data: suggestions, isLoading: suggestionsLoading } = useTaxSuggestions({
    limit: 5,
    priority: ["HIGH", "MEDIUM"]
  });
  const { data: upcomingDeadlines, isLoading: deadlinesLoading } = useTaxDeadlines({
    daysAhead: 30,
    limit: 3
  });
  const runAnalysis = useRunAnalysis();

  const urgentDeadlines = upcomingDeadlines?.filter(d => {
    const daysUntil = Math.ceil((new Date(d.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 7;
  }) || [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Lightbulb className="h-8 w-8 text-yellow-500" />
            Smart Tax Assistant
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered tax savings and deadline tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCalendar(!showCalendar)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            {showCalendar ? "List View" : "Calendar View"}
          </Button>
          <Button
            onClick={() => runAnalysis.mutate()}
            disabled={runAnalysis.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${runAnalysis.isPending ? "animate-spin" : ""}`} />
            Run Analysis
          </Button>
        </div>
      </div>

      {/* Urgent Deadlines Alert */}
      {urgentDeadlines.length > 0 && (
        <Alert variant="destructive">
          <Calendar className="h-4 w-4" />
          <AlertDescription>
            <strong>Urgent:</strong> You have {urgentDeadlines.length} deadline{urgentDeadlines.length > 1 ? 's' : ''} due within 7 days!
          </AlertDescription>
        </Alert>
      )}

      {/* Top Section: Savings & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Potential Savings */}
        <div className="lg:col-span-2">
          <TaxSavingsCard
            totalSavings={summary?.totalPotentialSavings || 0}
            activeSuggestions={summary?.activeSuggestionsCount || 0}
            completedSuggestions={summary?.completedSuggestionsCount || 0}
            isLoading={summaryLoading}
          />
        </div>

        {/* Upcoming Deadlines */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Upcoming Deadlines</h2>
            <Link href="/tax-assistant/deadlines">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
          <div className="space-y-3">
            {deadlinesLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : upcomingDeadlines?.length === 0 ? (
              <div className="text-sm text-muted-foreground">No upcoming deadlines</div>
            ) : (
              upcomingDeadlines?.map((deadline) => (
                <TaxDeadlineCard key={deadline.id} deadline={deadline} compact />
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Main Content: Suggestions or Calendar */}
      {showCalendar ? (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Tax Calendar</h2>
          <TaxDeadlineCalendar />
        </Card>
      ) : (
        <>
          {/* Active Suggestions */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Tax-Saving Opportunities
              </h2>
              <Link href="/tax-assistant/suggestions">
                <Button variant="ghost" size="sm">
                  View All Suggestions
                </Button>
              </Link>
            </div>
            <TaxSuggestionsList
              suggestions={suggestions || []}
              isLoading={suggestionsLoading}
            />
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/tax/deductions/new">
                <Button variant="outline" className="w-full">
                  Add Deduction
                </Button>
              </Link>
              <Link href="/tax/filing">
                <Button variant="outline" className="w-full">
                  File Taxes
                </Button>
              </Link>
              <Link href="/tax/reports">
                <Button variant="outline" className="w-full">
                  View Reports
                </Button>
              </Link>
              <Link href="/finance/expenses">
                <Button variant="outline" className="w-full">
                  Track Expenses
                </Button>
              </Link>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
