"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaxDeadlineCard } from "@/components/tax-assistant/TaxDeadlineCard";
import { TaxDeadlineCalendar } from "@/components/tax-assistant/TaxDeadlineCalendar";
import { useTaxDeadlines } from "@/hooks/use-tax-assistant";
import { Calendar, List, Download } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TaxDeadlinesPage() {
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const { data: deadlines, isLoading } = useTaxDeadlines({});

  const filteredDeadlines = deadlines?.filter((d) => {
    if (typeFilter !== "ALL" && d.type !== typeFilter) return false;

    const daysUntil = Math.ceil((new Date(d.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (statusFilter === "UPCOMING" && daysUntil > 7) return false;
    if (statusFilter === "DUE_SOON" && (daysUntil <= 0 || daysUntil > 7)) return false;
    if (statusFilter === "OVERDUE" && daysUntil > 0) return false;

    return true;
  }) || [];

  const exportToCalendar = () => {
    // Generate .ics file
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Operate//Tax Deadlines//EN",
      ...filteredDeadlines.flatMap((deadline) => [
        "BEGIN:VEVENT",
        `UID:${deadline.id}@operate.guru`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
        `DTSTART:${new Date(deadline.date).toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
        `SUMMARY:${deadline.name}`,
        `DESCRIPTION:${deadline.description || ""}`,
        "END:VEVENT",
      ]),
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tax-deadlines.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tax Deadlines</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage important tax filing dates
          </p>
        </div>
        <Button onClick={exportToCalendar} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export to Calendar
        </Button>
      </div>

      {/* View Toggle & Filters */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "calendar")}>
            <TabsList>
              <TabsTrigger value="list">
                <List className="h-4 w-4 mr-2" />
                List View
              </TabsTrigger>
              <TabsTrigger value="calendar">
                <Calendar className="h-4 w-4 mr-2" />
                Calendar View
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="VAT_RETURN">VAT Return</SelectItem>
                <SelectItem value="INCOME_TAX">Income Tax</SelectItem>
                <SelectItem value="QUARTERLY_ESTIMATE">Quarterly Estimate</SelectItem>
                <SelectItem value="ANNUAL_FILING">Annual Filing</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="UPCOMING">Upcoming</SelectItem>
                <SelectItem value="DUE_SOON">Due Soon (7 days)</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">Loading deadlines...</div>
        </Card>
      ) : filteredDeadlines.length === 0 ? (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            No deadlines found. Try adjusting your filters.
          </div>
        </Card>
      ) : viewMode === "list" ? (
        <div className="space-y-4">
          {filteredDeadlines.map((deadline) => (
            <TaxDeadlineCard key={deadline.id} deadline={deadline} />
          ))}
        </div>
      ) : (
        <Card className="p-6">
          <TaxDeadlineCalendar deadlines={filteredDeadlines} />
        </Card>
      )}
    </div>
  );
}
