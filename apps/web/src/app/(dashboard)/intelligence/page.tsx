import { Brain, Mail, Building2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { AnimatedCard } from '@/components/ui/animated-card';
import { HeadlineOutside } from '@/components/ui/headline-outside';
import { Button } from '@/components/ui/button';

export default function IntelligencePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <HeadlineOutside subtitle="AI-powered insights and automation for your business">
        <span className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-purple-600" />
          Intelligence
        </span>
      </HeadlineOutside>

      {/* Intelligence Features Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Email Intelligence */}
        <AnimatedCard variant="elevated" padding="lg" className="hover:shadow-lg transition-shadow">
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/intelligence/email">
                  View Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <h3 className="text-lg font-semibold mt-4">Email Intelligence</h3>
            <p className="text-sm text-muted-foreground">
              Automatic email classification, entity extraction, and smart suggestions
            </p>
            <div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-green-500" />
                <div>
                  <p className="text-sm font-medium">Auto-Classification</p>
                  <p className="text-xs text-muted-foreground">
                    Emails sorted into 23+ categories automatically
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-green-500" />
                <div>
                  <p className="text-sm font-medium">Entity Extraction</p>
                  <p className="text-xs text-muted-foreground">
                    Companies, contacts, amounts, and dates detected
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-green-500" />
                <div>
                  <p className="text-sm font-medium">Smart Suggestions</p>
                  <p className="text-xs text-muted-foreground">
                    Actionable recommendations based on email content
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-green-500" />
                <div>
                  <p className="text-sm font-medium">Relationship Tracking</p>
                  <p className="text-xs text-muted-foreground">
                    Monitor customer and vendor engagement health
                  </p>
                </div>
              </div>
            </div>
            </div>
          </div>
        </AnimatedCard>

        {/* Bank Intelligence (Coming Soon) */}
        <AnimatedCard variant="elevated" padding="lg" className="opacity-60">
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs font-medium">
                Coming Soon
              </div>
            </div>
            <h3 className="text-lg font-semibold mt-4">Bank Intelligence</h3>
            <p className="text-sm text-muted-foreground">
              Smart transaction categorization and cash flow predictions
            </p>
            <div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-gray-400" />
                <div>
                  <p className="text-sm font-medium">Auto-Categorization</p>
                  <p className="text-xs text-muted-foreground">
                    Transactions categorized with 95%+ accuracy
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-gray-400" />
                <div>
                  <p className="text-sm font-medium">Cash Flow Predictions</p>
                  <p className="text-xs text-muted-foreground">
                    30-day forecast based on patterns
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-gray-400" />
                <div>
                  <p className="text-sm font-medium">Anomaly Detection</p>
                  <p className="text-xs text-muted-foreground">
                    Unusual transactions flagged automatically
                  </p>
                </div>
              </div>
            </div>
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Getting Started */}
      <AnimatedCard variant="elevated" padding="lg">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Getting Started with Intelligence</h3>
            <p className="text-sm text-muted-foreground">
              Here's how to make the most of AI-powered automation
            </p>
          </div>
          <div>
          <ol className="space-y-4">
            <li className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                1
              </div>
              <div>
                <h4 className="font-semibold">Connect Your Email</h4>
                <p className="text-sm text-muted-foreground">
                  Go to Settings → Email to connect your email account. We'll start processing
                  incoming emails automatically.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                2
              </div>
              <div>
                <h4 className="font-semibold">Review Suggestions</h4>
                <p className="text-sm text-muted-foreground">
                  Check the Email Intelligence dashboard daily for AI-generated suggestions.
                  Complete or dismiss them with one click.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                3
              </div>
              <div>
                <h4 className="font-semibold">Monitor Relationships</h4>
                <p className="text-sm text-muted-foreground">
                  Track customer and vendor engagement. Get alerts when relationships need
                  attention before they become problems.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                4
              </div>
              <div>
                <h4 className="font-semibold">Let It Learn</h4>
                <p className="text-sm text-muted-foreground">
                  The more you use it, the smarter it gets. Review auto-created entities and
                  the system will improve its accuracy over time.
                </p>
              </div>
            </li>
          </ol>
          </div>
        </div>
      </AnimatedCard>
    </div>
  );
}
