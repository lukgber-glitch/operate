'use client';

import { Mail } from 'lucide-react';
import { EmailActivityFeed } from '@/components/intelligence/EmailActivityFeed';
import { RelationshipHealthCard } from '@/components/intelligence/RelationshipHealthCard';
import { SuggestionsPanel } from '@/components/intelligence/SuggestionsPanel';
import { AutoCreatedEntities } from '@/components/intelligence/AutoCreatedEntities';

export default function EmailIntelligencePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Mail className="h-8 w-8 text-blue-600" />
          Email Intelligence
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          AI-powered email analysis, entity extraction, and smart suggestions
        </p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Suggestions (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <SuggestionsPanel />
          <EmailActivityFeed limit={15} />
        </div>

        {/* Right Column - Stats & Info (1/3 width) */}
        <div className="space-y-6">
          <RelationshipHealthCard />
          <AutoCreatedEntities limit={8} />
        </div>
      </div>
    </div>
  );
}
