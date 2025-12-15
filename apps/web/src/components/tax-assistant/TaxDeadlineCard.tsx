"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface TaxDeadline {
  id: string;
  name: string;
  description?: string;
  date: string;
  type: string;
  actionUrl?: string;
}

interface TaxDeadlineCardProps {
  deadline: TaxDeadline;
  compact?: boolean;
}

export function TaxDeadlineCard({ deadline, compact = false }: TaxDeadlineCardProps) {
  const router = useRouter();

  const deadlineDate = new Date(deadline.date);
  const today = new Date();
  const daysUntil = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Determine status and styling
  let status: "OVERDUE" | "DUE_SOON" | "UPCOMING";
  let statusColor: string;
  let borderColor: string;

  if (daysUntil < 0) {
    status = "OVERDUE";
    statusColor = "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400";
    borderColor = "border-red-200 dark:border-red-800";
  } else if (daysUntil <= 7) {
    status = "DUE_SOON";
    statusColor = "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-400";
    borderColor = "border-orange-200 dark:border-orange-800";
  } else {
    status = "UPCOMING";
    statusColor = "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400";
    borderColor = "border-blue-200 dark:border-blue-800";
  }

  const handleAction = () => {
    if (deadline.actionUrl) {
      router.push(deadline.actionUrl);
    }
  };

  if (compact) {
    return (
      <div className={`p-3 border rounded-lg ${borderColor} space-y-2`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{deadline.name}</div>
            <div className="text-xs text-muted-foreground">
              {format(deadlineDate, "MMM d, yyyy")}
            </div>
          </div>
          <Badge className={`${statusColor} text-xs`}>
            {daysUntil < 0 ? "Overdue" : `${daysUntil}d`}
          </Badge>
        </div>
        {deadline.actionUrl && (
          <Button size="sm" className="w-full" onClick={handleAction}>
            File Now
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={`p-6 ${borderColor}`}>
      <div className="flex items-start gap-4">
        {/* Calendar Icon */}
        <div className={`p-3 rounded-lg ${statusColor}`}>
          <Calendar className="h-6 w-6" />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{deadline.name}</h3>
              {deadline.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {deadline.description}
                </p>
              )}
            </div>

            {/* Status Badge */}
            <Badge className={statusColor}>
              {status === "OVERDUE"
                ? "Overdue"
                : status === "DUE_SOON"
                ? "Due Soon"
                : "Upcoming"}
            </Badge>
          </div>

          {/* Date & Countdown */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {format(deadlineDate, "EEEE, MMMM d, yyyy")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {daysUntil < 0
                  ? `${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} overdue`
                  : daysUntil === 0
                  ? "Due today!"
                  : daysUntil === 1
                  ? "Due tomorrow"
                  : `${daysUntil} days remaining`}
              </span>
            </div>
          </div>

          {/* Type Badge */}
          <div>
            <Badge variant="outline">{deadline.type.replace(/_/g, " ")}</Badge>
          </div>

          {/* Actions */}
          {deadline.actionUrl && (
            <div className="pt-2">
              <Button onClick={handleAction} size="sm">
                File Now
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
