// Example Chat Page with AI Disclaimer
// Copy this pattern to your actual chat page

'use client';

import { AIDisclaimerBanner } from '@/components/chat/AIDisclaimerBanner';
import { ChatPanel } from '@/components/chat/ChatPanel';

export default function ChatPage() {
  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">AI Assistant</h1>
        <p className="text-muted-foreground">
          Get help with your accounting, taxes, and business questions
        </p>
      </div>

      {/* AI Disclaimer Banner - dismissible for 30 days */}
      <AIDisclaimerBanner />

      {/* Chat Interface */}
      <div className="bg-card rounded-lg border p-4 md:p-6">
        <ChatPanel isOpen={true} onClose={() => {}} />
      </div>

      {/* Additional Info */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
        <p>
          <strong>Tip:</strong> You can ask questions about invoices, expenses, tax deductions,
          cash flow, and more. The AI will provide information based on your business data.
        </p>
      </div>
    </div>
  );
}
