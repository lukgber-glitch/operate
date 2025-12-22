/**
 * Daily Summary Prompts for Autopilot Module
 * AI-powered daily summary generation for autopilot activities
 */

export interface DailySummaryData {
  date: Date;
  actionsCompleted: number;
  actionsPending: number;
  actionsRejected: number;
  transactionsCategorized: number;
  receiptsProcessed: number;
  invoicesCreated: number;
  remindersSent: number;
  reconciliationsCompleted: number;
  timeSavedMinutes: number;
  actionDetails?: Array<{
    type: string;
    status: string;
    description: string;
    createdAt: Date;
  }>;
}

export const DAILY_SUMMARY_SYSTEM_PROMPT = `You are an AI assistant specializing in business automation and workflow optimization.

Your role is to summarize the daily activities of the Operate autopilot system, which automates routine business tasks to help small business owners focus on their work.

## Your Responsibilities

1. **Summarize Accomplishments**: Highlight what autopilot accomplished during the day
2. **Provide Insights**: Extract meaningful patterns and trends from the data
3. **Suggest Improvements**: Identify opportunities for better automation
4. **Flag Concerns**: Call attention to unusual patterns or potential issues
5. **Celebrate Wins**: Acknowledge time saved and efficiency gained

## Key Metrics to Consider

- **Actions Completed**: Tasks successfully executed by autopilot
- **Actions Pending**: Tasks awaiting user approval
- **Actions Rejected**: Tasks declined by the user (may indicate areas for improvement)
- **Transactions Categorized**: Bank transactions automatically classified
- **Receipts Processed**: Receipts extracted and filed
- **Invoices Created**: Invoices automatically generated from completed work
- **Reminders Sent**: Payment reminders sent to clients
- **Reconciliations Completed**: Bank transactions matched to invoices/expenses
- **Time Saved**: Estimated time saved in minutes/hours

## Tone and Style

- **Professional but Friendly**: Business-appropriate with a warm, encouraging tone
- **Concise**: Get to the point quickly, respect the user's time
- **Actionable**: Focus on insights the user can act on
- **Positive**: Emphasize accomplishments and improvements
- **Transparent**: Be honest about limitations and areas for improvement

## Patterns to Identify

- **Recurring Tasks**: Actions that happen regularly (good automation candidates)
- **High Rejection Rates**: Action types frequently rejected by the user
- **Time Savings**: Cumulative impact of automation
- **Workload Trends**: Increasing/decreasing activity levels
- **Bottlenecks**: Areas where manual approval is frequently needed

## When to Flag Concerns

- Unusual number of rejections for a specific action type
- Significant decrease in automation activity (might indicate issues)
- High number of pending actions (user might be overwhelmed)
- Patterns suggesting automation rules need refinement
- Potential compliance or tax issues

## Response Format

Provide a natural language summary that includes:

1. **Opening**: Brief, engaging summary of the day
2. **Key Metrics**: Highlight the most important numbers
3. **Accomplishments**: What autopilot achieved today
4. **Time Impact**: How much time was saved
5. **Insights**: Notable patterns or trends
6. **Suggestions** (if applicable): Ideas for improvement
7. **Concerns** (if applicable): Issues requiring attention
8. **Closing**: Encouraging note about progress

Keep the summary to 3-5 paragraphs. Be specific but concise.`;

/**
 * Build daily summary prompt for Claude
 */
export function buildDailySummaryPrompt(data: DailySummaryData): string {
  const parts: string[] = [
    '## Daily Autopilot Summary Request',
    '',
    `**Date**: ${data.date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
    '',
    '## Activity Metrics',
    '',
    `- **Actions Completed**: ${data.actionsCompleted}`,
    `- **Actions Pending Approval**: ${data.actionsPending}`,
    `- **Actions Rejected**: ${data.actionsRejected}`,
    '',
    '## Breakdown by Type',
    '',
    `- **Transactions Categorized**: ${data.transactionsCategorized}`,
    `- **Receipts Processed**: ${data.receiptsProcessed}`,
    `- **Invoices Created**: ${data.invoicesCreated}`,
    `- **Payment Reminders Sent**: ${data.remindersSent}`,
    `- **Reconciliations Completed**: ${data.reconciliationsCompleted}`,
    '',
    '## Time Impact',
    '',
    `- **Time Saved**: ${data.timeSavedMinutes} minutes (${formatTimeEstimate(data.timeSavedMinutes)})`,
  ];

  // Add action details if available
  if (data.actionDetails && data.actionDetails.length > 0) {
    parts.push('', '## Recent Actions', '');

    // Group actions by type
    const actionsByType = data.actionDetails.reduce(
      (acc, action) => {
        if (!acc[action.type]) {
          acc[action.type] = [];
        }
        acc[action.type]!.push(action);
        return acc;
      },
      {} as Record<string, typeof data.actionDetails>,
    );

    // Show up to 3 actions per type
    Object.entries(actionsByType).forEach(([type, actions]) => {
      parts.push(`### ${formatActionType(type)}`);
      actions.slice(0, 3).forEach((action) => {
        parts.push(
          `- ${action.status === 'EXECUTED' ? '✓' : action.status === 'PENDING' ? '○' : '✗'} ${action.description}`,
        );
      });
      if (actions.length > 3) {
        parts.push(`- ... and ${actions.length - 3} more`);
      }
      parts.push('');
    });
  }

  parts.push('', '## Instructions', '');
  parts.push(
    'Based on the metrics above, generate a comprehensive daily summary that:',
  );
  parts.push('');
  parts.push('1. Highlights key accomplishments and time saved');
  parts.push('2. Identifies notable patterns or trends');
  parts.push('3. Suggests improvements if rejection rate is high (>20%)');
  parts.push('4. Flags any concerns if pending actions are accumulating');
  parts.push(
    '5. Celebrates progress and encourages continued automation adoption',
  );
  parts.push('');
  parts.push(
    'Write in a professional but friendly tone, as if you\'re a helpful assistant reporting on the day\'s progress.',
  );

  return parts.join('\n');
}

/**
 * Build weekly summary prompt for Claude
 */
export function buildWeeklySummaryPrompt(weeklyData: {
  startDate: Date;
  endDate: Date;
  totalActionsCompleted: number;
  totalActionsPending: number;
  totalActionsRejected: number;
  totalTimeSavedMinutes: number;
  dailySummaries: DailySummaryData[];
}): string {
  const parts: string[] = [
    '## Weekly Autopilot Summary Request',
    '',
    `**Period**: ${weeklyData.startDate.toLocaleDateString()} - ${weeklyData.endDate.toLocaleDateString()}`,
    '',
    '## Weekly Totals',
    '',
    `- **Total Actions Completed**: ${weeklyData.totalActionsCompleted}`,
    `- **Total Actions Pending**: ${weeklyData.totalActionsPending}`,
    `- **Total Actions Rejected**: ${weeklyData.totalActionsRejected}`,
    `- **Total Time Saved**: ${weeklyData.totalTimeSavedMinutes} minutes (${formatTimeEstimate(weeklyData.totalTimeSavedMinutes)})`,
    '',
    '## Daily Breakdown',
    '',
  ];

  // Add daily summaries
  weeklyData.dailySummaries.forEach((day) => {
    parts.push(
      `- **${day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}**: ${day.actionsCompleted} completed, ${day.timeSavedMinutes} min saved`,
    );
  });

  parts.push('', '## Instructions', '');
  parts.push('Based on the weekly metrics above, generate a weekly summary that:');
  parts.push('');
  parts.push('1. Highlights overall progress and cumulative time savings');
  parts.push('2. Identifies trends across the week (increasing/decreasing activity)');
  parts.push('3. Compares weekdays to identify busy/slow periods');
  parts.push('4. Suggests optimizations based on weekly patterns');
  parts.push('5. Celebrates wins and encourages continued use');
  parts.push('');
  parts.push(
    'Keep it concise (2-4 paragraphs) with a focus on weekly trends and insights.',
  );

  return parts.join('\n');
}

/**
 * Build prompt for action recommendations
 */
export function buildRecommendationPrompt(data: {
  frequentlyRejectedTypes: Array<{ type: string; count: number }>;
  underutilizedFeatures: string[];
  automationOpportunities: Array<{ description: string; potentialTimeSavings: number }>;
}): string {
  const parts: string[] = [
    '## Autopilot Optimization Recommendations',
    '',
    'Analyze the following autopilot usage patterns and provide recommendations:',
    '',
  ];

  if (data.frequentlyRejectedTypes.length > 0) {
    parts.push('### Frequently Rejected Action Types', '');
    data.frequentlyRejectedTypes.forEach(({ type, count }) => {
      parts.push(`- **${formatActionType(type)}**: ${count} rejections`);
    });
    parts.push('');
  }

  if (data.underutilizedFeatures.length > 0) {
    parts.push('### Underutilized Features', '');
    data.underutilizedFeatures.forEach((feature) => {
      parts.push(`- ${feature}`);
    });
    parts.push('');
  }

  if (data.automationOpportunities.length > 0) {
    parts.push('### Potential Automation Opportunities', '');
    data.automationOpportunities.forEach((opp) => {
      parts.push(
        `- ${opp.description} (Est. ${opp.potentialTimeSavings} min/week saved)`,
      );
    });
    parts.push('');
  }

  parts.push('## Instructions', '');
  parts.push('Provide 3-5 specific, actionable recommendations to:');
  parts.push('');
  parts.push('1. Reduce rejection rates (adjust automation rules/thresholds)');
  parts.push('2. Encourage adoption of underutilized features');
  parts.push('3. Implement new automation opportunities');
  parts.push('4. Improve overall autopilot effectiveness');
  parts.push('');
  parts.push('Each recommendation should include:');
  parts.push('- **What** to do');
  parts.push('- **Why** it will help');
  parts.push('- **How** to implement it');
  parts.push('- **Expected impact** (time/effort savings)');

  return parts.join('\n');
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format time estimate in human-readable format
 */
function formatTimeEstimate(minutes: number): string {
  if (minutes < 60) {
    return `~${minutes} minutes`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `~${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }

  return `~${hours}h ${remainingMinutes}m`;
}

/**
 * Format action type to human-readable string
 */
function formatActionType(type: string): string {
  const formatted = type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return formatted;
}
