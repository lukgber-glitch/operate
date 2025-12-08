<objective>
Research and document UX improvements for the Operate chat interface, focusing on the proactive suggestion system that makes the app "world's best" for business automation.
</objective>

<context>
Operate's core differentiator:
- User opens app → App proactively shows suggestions
- Suggestions cover: cash flow, taxes, expenses, invoices, etc.
- Click on suggestion → It "locks in" to the AI chatbot
- Chat becomes the command center for business operations

Current state:
- Chat interface exists at apps/web/src/components/chat/
- GreetingHeader.tsx shows welcome messages
- Dashboard shows various business cards
- Suggestion system may be basic or incomplete
</context>

<research_areas>
1. **Proactive Suggestion System**
   - What suggestions should appear on app open?
   - How to prioritize suggestions (urgency, impact)?
   - Suggestion categories:
     * Cash flow alerts ("Invoice #123 is 30 days overdue")
     * Tax reminders ("VAT filing due in 5 days")
     * Expense insights ("You're spending 40% more on software this month")
     * Action items ("3 invoices ready to send")
     * Opportunities ("Vendor X offers 2% early payment discount")

2. **Chat Lock-In Mechanism**
   - How should clicking a suggestion work?
   - Should it pre-populate chat with context?
   - Should it create a task/thread?
   - Conversation persistence for each suggestion

3. **AI Chat Capabilities**
   - What actions can users take via chat?
   - Natural language commands ("Send invoice to John")
   - Confirmation flows for sensitive actions
   - Multi-step workflows via chat

4. **Dashboard Integration**
   - How do suggestions relate to dashboard cards?
   - Should dashboard be chat-first or data-first?
   - Widget customization options

5. **User Experience Flows**
   - First-time user experience
   - Daily user flow (open → see suggestions → act)
   - Mobile responsiveness for chat
   - Keyboard shortcuts for power users

6. **Competitive Analysis**
   - How do apps like Mercury, Brex, Ramp handle proactive UX?
   - AI-first business tools to learn from
   - What makes users return daily?
</research_areas>

<methodology>
1. **Current State Analysis**
   - Review existing chat components
   - Map current suggestion capabilities
   - Identify gaps in UX flow

2. **User Journey Mapping**
   - Document ideal user flow
   - Identify friction points
   - Map touchpoints for suggestions

3. **Feature Ideation**
   - List all possible suggestion types
   - Prioritize by user value
   - Identify quick wins

4. **Technical Feasibility**
   - What can be implemented easily?
   - What requires new backend work?
   - What needs AI model changes?

5. **Design Recommendations**
   - UI patterns for suggestions
   - Interaction patterns for lock-in
   - Notification and alert design
</methodology>

<output>
Save findings to: `./audits/ux-chat-research.md`

Structure:
## Executive Summary
[Vision for world-class chat UX]

## Current State Assessment
[What exists today, what works, what doesn't]

## Proactive Suggestion System Design
### Suggestion Types
[Categorized list of all suggestion types]
### Priority Algorithm
[How to rank and order suggestions]
### Delivery Timing
[When to show what suggestions]

## Chat Lock-In Mechanism
### Interaction Design
[How clicking suggestions works]
### Context Passing
[What data flows into chat]
### Conversation Management
[Thread/history handling]

## AI Chat Capabilities
### Supported Commands
[What users can do via chat]
### Confirmation Flows
[How to handle risky actions]
### Multi-Step Workflows
[Complex task handling]

## Quick Wins (Easy to Implement)
[Features with high impact, low effort]

## Medium-Term Enhancements
[Valuable features requiring more work]

## Long-Term Vision
[World-class features for the roadmap]

## Implementation Recommendations
[Prioritized feature list with estimates]
</output>

<success_criteria>
- Clear vision for suggestion system documented
- Lock-in mechanism fully designed
- AI chat capabilities mapped
- Quick wins identified
- Actionable implementation roadmap created
</success_criteria>
