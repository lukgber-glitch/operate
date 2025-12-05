'use client';

/**
 * SkeletonShowcase - Example page demonstrating all skeleton components
 *
 * This file is for development/reference only and should not be included in production builds.
 *
 * Usage:
 * - View in Storybook or create a /dev/skeletons route
 * - Reference for implementing loading states
 * - Visual testing of skeleton components
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChatMessageSkeleton,
  ChatMessageListSkeleton,
  SuggestionCardSkeleton,
  SuggestionCardListSkeleton,
  ConversationItemSkeleton,
  ConversationListSkeleton,
  DashboardWidgetSkeleton,
  DashboardGridSkeleton,
  OnboardingStepSkeleton,
  OnboardingWelcomeSkeleton,
  OnboardingCompletionSkeleton,
  NavItemSkeleton,
  NavMenuSkeleton,
  SidebarSkeleton,
} from './index';

export function SkeletonShowcase() {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Skeleton Components Showcase</h1>
        <p className="text-muted-foreground">
          Complete collection of loading skeleton components for Operate/CoachOS
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="navigation">Navigation</TabsTrigger>
        </TabsList>

        {/* Chat Skeletons */}
        <TabsContent value="chat" className="space-y-8">
          <Section title="Single Message Skeletons">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-3">User Message</h4>
                <ChatMessageSkeleton type="user" />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-3">Assistant Message</h4>
                <ChatMessageSkeleton type="assistant" />
              </div>
            </div>
          </Section>

          <Section title="Chat Message List">
            <ChatMessageListSkeleton count={3} />
          </Section>
        </TabsContent>

        {/* Suggestion Skeletons */}
        <TabsContent value="suggestions" className="space-y-8">
          <Section title="Full Suggestion Card">
            <SuggestionCardSkeleton />
          </Section>

          <Section title="Compact Suggestion Card">
            <div className="max-w-[280px]">
              <SuggestionCardSkeleton compact />
            </div>
          </Section>

          <Section title="Horizontal Suggestion List">
            <SuggestionCardListSkeleton count={5} compact />
          </Section>

          <Section title="Vertical Suggestion List">
            <SuggestionCardListSkeleton count={3} />
          </Section>
        </TabsContent>

        {/* Conversation Skeletons */}
        <TabsContent value="conversations" className="space-y-8">
          <Section title="Single Conversation Item">
            <div className="max-w-md">
              <ConversationItemSkeleton />
            </div>
          </Section>

          <Section title="Conversation List">
            <div className="max-w-md">
              <ConversationListSkeleton count={5} />
            </div>
          </Section>
        </TabsContent>

        {/* Dashboard Skeletons */}
        <TabsContent value="dashboard" className="space-y-8">
          <Section title="Chart Widget">
            <DashboardWidgetSkeleton variant="chart" />
          </Section>

          <Section title="Stat Widget">
            <DashboardWidgetSkeleton variant="stat" />
          </Section>

          <Section title="List Widget">
            <DashboardWidgetSkeleton variant="list" />
          </Section>

          <Section title="Table Widget">
            <DashboardWidgetSkeleton variant="table" />
          </Section>

          <Section title="Dashboard Grid (Mixed Widgets)">
            <DashboardGridSkeleton count={6} />
          </Section>
        </TabsContent>

        {/* Onboarding Skeletons */}
        <TabsContent value="onboarding" className="space-y-8">
          <Section title="Welcome Step">
            <OnboardingWelcomeSkeleton />
          </Section>

          <Section title="Regular Step">
            <OnboardingStepSkeleton showProgress showNavigation />
          </Section>

          <Section title="Completion Step">
            <OnboardingCompletionSkeleton />
          </Section>
        </TabsContent>

        {/* Navigation Skeletons */}
        <TabsContent value="navigation" className="space-y-8">
          <Section title="Single Nav Item (Expanded)">
            <div className="max-w-xs">
              <NavItemSkeleton isExpanded={true} />
            </div>
          </Section>

          <Section title="Nav Item with Children (Expanded)">
            <div className="max-w-xs">
              <NavItemSkeleton isExpanded={true} hasChildren />
            </div>
          </Section>

          <Section title="Nav Item (Collapsed)">
            <div className="max-w-xs">
              <NavItemSkeleton isExpanded={false} />
            </div>
          </Section>

          <Section title="Nav Menu (Expanded)">
            <div className="max-w-xs">
              <NavMenuSkeleton count={6} isExpanded={true} />
            </div>
          </Section>

          <Section title="Complete Sidebar (Expanded)">
            <div className="max-w-xs h-[600px] border rounded-lg overflow-hidden">
              <SidebarSkeleton isExpanded={true} />
            </div>
          </Section>

          <Section title="Complete Sidebar (Collapsed)">
            <div className="max-w-[80px] h-[600px] border rounded-lg overflow-hidden">
              <SidebarSkeleton isExpanded={false} />
            </div>
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">{title}</h3>
      <div className="border rounded-lg p-6 bg-card">{children}</div>
    </div>
  );
}

export default SkeletonShowcase;
