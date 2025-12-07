'use client';

import { useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: 'Can I change my plan later?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. When upgrading, you\'ll be charged a prorated amount for the remainder of your billing period. When downgrading, the change will take effect at the start of your next billing period.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and SEPA Direct Debit for European customers. All payments are processed securely through Stripe.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes! All paid plans include a 14-day free trial. No credit card required to start. You can cancel anytime during the trial period without being charged.',
  },
  {
    question: 'What happens when I reach my AI message limit?',
    answer: 'On the Free and Starter plans, you\'ll receive a notification when you\'re approaching your monthly limit. You can upgrade to a higher plan for more messages, or wait until your limit resets at the start of the next month.',
  },
  {
    question: 'Can I cancel my subscription?',
    answer: 'Yes, you can cancel your subscription at any time from your account settings. If you cancel, you\'ll continue to have access to your plan features until the end of your current billing period.',
  },
  {
    question: 'Do you offer discounts for annual billing?',
    answer: 'Yes! Annual billing saves you 17% compared to monthly billing. That\'s like getting 2 months free when you pay annually.',
  },
  {
    question: 'What banks do you support?',
    answer: 'We support 4,000+ banks across Europe and the UK through TrueLayer and Tink, and most US banks through Plaid. If your bank isn\'t supported, you can still import transactions manually via CSV.',
  },
  {
    question: 'Is my financial data secure?',
    answer: 'Absolutely. We use bank-level encryption (AES-256) and never store your banking credentials. We\'re SOC 2 Type II certified and fully GDPR compliant. Your data is encrypted both in transit and at rest.',
  },
];

function FAQItem({ faq, index }: { faq: FAQ; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="border-b pb-6"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left py-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded-lg px-2"
        aria-expanded={isOpen}
      >
        <h3 className="text-lg font-semibold pr-8" style={{ color: 'var(--color-text-primary)' }}>
          {faq.question}
        </h3>
        <ChevronDownIcon
          className="w-5 h-5 flex-shrink-0 transition-transform duration-200"
          style={{
            color: 'var(--color-primary)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isOpen ? '500px' : '0',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <p className="pt-2 pb-4 px-2 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {faq.answer}
        </p>
      </div>
    </div>
  );
}

export function PricingFAQ() {
  return (
    <div className="w-full max-w-3xl mx-auto mt-24 mb-16 px-4">
      <h2 className="text-3xl font-bold text-center mb-12" style={{ color: 'var(--color-text-primary)' }}>
        Frequently Asked Questions
      </h2>

      <div className="space-y-2">
        {faqs.map((faq, index) => (
          <FAQItem key={index} faq={faq} index={index} />
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Still have questions?
        </p>
        <a
          href="mailto:support@operate.guru"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-lg)] font-semibold transition-colors"
          style={{
            backgroundColor: 'var(--color-background)',
            color: 'var(--color-primary)',
          }}
        >
          Contact Support
        </a>
      </div>
    </div>
  );
}
