"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
  addDays,
} from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TaxDeadline {
  id: string;
  name: string;
  date: string;
  type: string;
}

interface TaxDeadlineCalendarProps {
  deadlines?: TaxDeadline[];
}

export function TaxDeadlineCalendar({ deadlines = [] }: TaxDeadlineCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const rows: Date[][] = [];
  let days: Date[] = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      days.push(day);
      day = addDays(day, 1);
    }
    rows.push(days);
    days = [];
  }

  const getDeadlinesForDate = (date: Date) => {
    return deadlines.filter((deadline) =>
      isSameDay(new Date(deadline.date), date)
    );
  };

  const getDateStatus = (date: Date) => {
    const dayDeadlines = getDeadlinesForDate(date);
    if (dayDeadlines.length === 0) return null;

    const today = new Date();
    const daysUntil = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return "overdue";
    if (daysUntil <= 7) return "dueSoon";
    return "upcoming";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-muted">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium border-r last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        {rows.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-t">
            {week.map((day, dayIndex) => {
              const dayDeadlines = getDeadlinesForDate(day);
              const status = getDateStatus(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={dayIndex}
                  className={`min-h-[100px] p-2 border-r last:border-r-0 ${
                    !isCurrentMonth ? "bg-muted/30" : ""
                  } ${isToday ? "bg-blue-50 dark:bg-blue-950" : ""}`}
                >
                  <div className="text-sm font-medium mb-1">
                    {format(day, dateFormat)}
                  </div>

                  {dayDeadlines.length > 0 && (
                    <div className="space-y-1">
                      {dayDeadlines.slice(0, 2).map((deadline) => (
                        <Popover key={deadline.id}>
                          <PopoverTrigger asChild>
                            <button
                              className={`w-full text-left px-2 py-1 rounded text-xs truncate ${
                                status === "overdue"
                                  ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400"
                                  : status === "dueSoon"
                                  ? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-400"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400"
                              }`}
                            >
                              {deadline.name}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-2">
                              <h4 className="font-semibold">{deadline.name}</h4>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(deadline.date), "EEEE, MMMM d, yyyy")}
                              </div>
                              <Badge variant="outline">
                                {deadline.type.replace(/_/g, " ")}
                              </Badge>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ))}
                      {dayDeadlines.length > 2 && (
                        <div className="text-xs text-muted-foreground px-2">
                          +{dayDeadlines.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-950" />
          <span>Overdue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-100 dark:bg-orange-950" />
          <span>Due Soon (7 days)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-950" />
          <span>Upcoming</span>
        </div>
      </div>
    </div>
  );
}
