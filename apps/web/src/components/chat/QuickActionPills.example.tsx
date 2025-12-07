'use client';

import { useState } from 'react';
import {
  FileText,
  TrendingUp,
  Calculator,
  Mail,
  Building2,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Download,
  Upload,
} from 'lucide-react';
import { QuickActionPills } from './QuickActionPills';
import { ChatInput } from './ChatInput';

/**
 * QuickActionPills Example - Demonstrates contextual action suggestions
 *
 * This example shows:
 * 1. Default actions for empty chat
 * 2. Contextual actions after specific responses
 * 3. Integration with ChatInput component
 */

export function QuickActionPillsExample() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<string[]>([]);

  // Contextual actions based on conversation state
  const getContextualActions = () => {
    const lastMessage = messages[messages.length - 1];

    // After invoice response
    if (lastMessage?.includes('invoice')) {
      return [
        { icon: CheckCircle, label: 'Mark as paid', action: 'Mark invoice INV-001 as paid' },
        { icon: Mail, label: 'Send reminder', action: 'Send payment reminder for INV-001' },
        { icon: Download, label: 'Download PDF', action: 'Download invoice INV-001 as PDF' },
        { icon: ArrowRight, label: 'Next invoice', action: 'Show next unpaid invoice' },
      ];
    }

    // After cash flow response
    if (lastMessage?.includes('cash flow')) {
      return [
        { icon: TrendingUp, label: 'Next month', action: 'Show cash flow forecast for next month' },
        { icon: AlertCircle, label: 'Low balance alerts', action: 'Show upcoming low balance alerts' },
        { icon: FileText, label: 'Export report', action: 'Export cash flow report as CSV' },
        { icon: Calculator, label: 'What-if analysis', action: 'Run cash flow what-if scenario' },
      ];
    }

    // After tax response
    if (lastMessage?.includes('tax')) {
      return [
        { icon: Calculator, label: 'Quarterly estimate', action: 'Calculate quarterly tax estimate' },
        { icon: FileText, label: 'Deductions', action: 'Show available tax deductions' },
        { icon: Upload, label: 'File return', action: 'Start tax return filing' },
        { icon: Mail, label: 'Tax documents', action: 'Show tax documents checklist' },
      ];
    }

    // After bank response
    if (lastMessage?.includes('bank')) {
      return [
        { icon: TrendingUp, label: 'Transactions', action: 'Show recent bank transactions' },
        { icon: Building2, label: 'Connect account', action: 'Connect another bank account' },
        { icon: Download, label: 'Export statement', action: 'Export bank statement' },
        { icon: AlertCircle, label: 'Reconcile', action: 'Start bank reconciliation' },
      ];
    }

    // Default actions (empty or generic state)
    return undefined; // Will use default actions from QuickActionPills
  };

  const handleSend = (message: string) => {
    console.log('Sending message:', message);
    setMessages([...messages, message]);
    setInputValue('');

    // Simulate assistant response
    setTimeout(() => {
      let response = '';
      if (message.includes('invoice')) {
        response = 'Here are your recent invoices. Invoice INV-001 for $1,200 is still unpaid.';
      } else if (message.includes('cash flow')) {
        response = 'Your cash flow forecast shows a positive trend with $15,000 expected next month.';
      } else if (message.includes('tax')) {
        response = 'Your current tax liability is estimated at $8,500 for Q4 2023.';
      } else if (message.includes('bank')) {
        response = 'Your main business account has a balance of $24,500 with 15 transactions this week.';
      } else {
        response = 'I can help you with invoices, cash flow, taxes, bank accounts, and more!';
      }
      setMessages(prev => [...prev, response]);
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Quick Action Pills Demo</h2>
        <p className="text-muted-foreground">
          Try asking about invoices, cash flow, taxes, or bank accounts to see contextual actions appear.
        </p>
      </div>

      {/* Message History */}
      <div className="border rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-y-auto bg-muted/30">
        {messages.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No messages yet. Try the quick actions below!
          </p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  index % 2 === 0
                    ? 'bg-primary/10 ml-8'
                    : 'bg-secondary/10 mr-8'
                }`}
              >
                <div className="text-sm font-medium mb-1">
                  {index % 2 === 0 ? 'You' : 'Assistant'}
                </div>
                <div className="text-sm">{msg}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Input with Quick Actions */}
      <div className="border rounded-lg overflow-hidden">
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
          placeholder="Ask about your business..."
          showAttachment={false}
          showVoice={false}
          showQuickActions={true}
          quickActions={getContextualActions()}
        />
      </div>

      {/* State Information */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p><strong>Current State:</strong></p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>
            Messages: {messages.length}
          </li>
          <li>
            Last topic: {
              messages.length === 0
                ? 'None (showing default actions)'
                : (messages[messages.length - 1] ?? '').includes('invoice')
                ? 'Invoice management'
                : (messages[messages.length - 1] ?? '').includes('cash flow')
                ? 'Cash flow forecast'
                : (messages[messages.length - 1] ?? '').includes('tax')
                ? 'Tax summary'
                : (messages[messages.length - 1] ?? '').includes('bank')
                ? 'Bank accounts'
                : 'General'
            }
          </li>
          <li>
            Action pills: {getContextualActions() ? 'Contextual' : 'Default'}
          </li>
        </ul>
      </div>

      {/* Usage Notes */}
      <div className="border-t pt-4 space-y-2 text-sm text-muted-foreground">
        <h3 className="font-semibold text-foreground">Usage Notes:</h3>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>
            <strong>Default Actions:</strong> Shown when no contextual actions available
          </li>
          <li>
            <strong>Contextual Actions:</strong> Change based on conversation topic
          </li>
          <li>
            <strong>Click Behavior:</strong> Fills chat input with action text
          </li>
          <li>
            <strong>Animation:</strong> GSAP stagger animation on pills appear
          </li>
          <li>
            <strong>Responsive:</strong> Horizontal scroll on mobile, subtle scrollbar on desktop
          </li>
        </ul>
      </div>
    </div>
  );
}
