'use client';

/**
 * GreetingHeader Visual Examples
 *
 * This file demonstrates how the GreetingHeader component appears
 * in different states and times of day.
 */

import { HeadlineOutside } from '@/components/ui/headline-outside';

export function GreetingHeaderExamples() {
  return (
    <div className="space-y-8 p-8 bg-[var(--color-background)]">
      <div>
        <h2 className="text-lg font-semibold mb-4">Time-based Greetings</h2>

        {/* Morning Example */}
        <div className="mb-6 p-6 bg-[var(--color-surface)] rounded-lg">
          <p className="text-sm text-[var(--color-text-muted)] mb-2">
            6:00 AM - 11:59 AM
          </p>
          <HeadlineOutside className="animate-fade-in">
            Good morning, Alex
          </HeadlineOutside>
        </div>

        {/* Afternoon Example */}
        <div className="mb-6 p-6 bg-[var(--color-surface)] rounded-lg">
          <p className="text-sm text-[var(--color-text-muted)] mb-2">
            12:00 PM - 5:59 PM
          </p>
          <HeadlineOutside className="animate-fade-in">
            Good afternoon, Sarah
          </HeadlineOutside>
        </div>

        {/* Evening Example */}
        <div className="mb-6 p-6 bg-[var(--color-surface)] rounded-lg">
          <p className="text-sm text-[var(--color-text-muted)] mb-2">
            6:00 PM - 11:59 PM
          </p>
          <HeadlineOutside className="animate-fade-in">
            Good evening, Michael
          </HeadlineOutside>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Fallback State</h2>

        {/* No user logged in */}
        <div className="p-6 bg-[var(--color-surface)] rounded-lg">
          <p className="text-sm text-[var(--color-text-muted)] mb-2">
            When user information is unavailable
          </p>
          <HeadlineOutside className="animate-fade-in">
            Good morning, there
          </HeadlineOutside>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">In Context (Chat Page Layout)</h2>

        {/* Full layout example */}
        <div className="max-w-[800px] mx-auto">
          {/* Greeting outside the card */}
          <div className="mb-6">
            <HeadlineOutside className="animate-fade-in">
              Good afternoon, Jordan
            </HeadlineOutside>
          </div>

          {/* Chat content card */}
          <div
            className="p-6 rounded-lg"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <p className="text-[var(--color-text-secondary)]">
              Chat messages would appear here...
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Design Specifications</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-[var(--color-surface)] rounded-lg">
            <h3 className="font-semibold mb-2">Typography</h3>
            <ul className="text-sm space-y-1 text-[var(--color-text-secondary)]">
              <li>Font size: 24px</li>
              <li>Font weight: 600 (semibold)</li>
              <li>Line height: tight</li>
              <li>Color: text-secondary</li>
            </ul>
          </div>

          <div className="p-4 bg-[var(--color-surface)] rounded-lg">
            <h3 className="font-semibold mb-2">Animation</h3>
            <ul className="text-sm space-y-1 text-[var(--color-text-secondary)]">
              <li>Type: fade-in</li>
              <li>Duration: 0.3s</li>
              <li>Timing: ease-out</li>
              <li>Trigger: On mount</li>
            </ul>
          </div>

          <div className="p-4 bg-[var(--color-surface)] rounded-lg">
            <h3 className="font-semibold mb-2">Spacing</h3>
            <ul className="text-sm space-y-1 text-[var(--color-text-secondary)]">
              <li>Margin bottom: 24px</li>
              <li>Text alignment: left</li>
              <li>No padding</li>
            </ul>
          </div>

          <div className="p-4 bg-[var(--color-surface)] rounded-lg">
            <h3 className="font-semibold mb-2">Responsiveness</h3>
            <ul className="text-sm space-y-1 text-[var(--color-text-secondary)]">
              <li>Mobile: Same styling</li>
              <li>Tablet: Same styling</li>
              <li>Desktop: Same styling</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GreetingHeaderExamples;
