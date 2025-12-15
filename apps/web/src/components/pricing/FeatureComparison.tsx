'use client';

import { CheckIcon, XIcon } from 'lucide-react';

interface Feature {
  name: string;
  free: boolean | string;
  starter: boolean | string;
  pro: boolean | string;
  business: boolean | string;
}

const features: Feature[] = [
  {
    name: 'Bank Connections',
    free: '1',
    starter: '3',
    pro: '10',
    business: 'Unlimited',
  },
  {
    name: 'AI Chat Messages',
    free: '50/month',
    starter: '200/month',
    pro: 'Unlimited',
    business: 'Unlimited',
  },
  {
    name: 'Invoices',
    free: '5/month',
    starter: 'Unlimited',
    pro: 'Unlimited',
    business: 'Unlimited',
  },
  {
    name: 'Email Invoice Sync',
    free: false,
    starter: true,
    pro: true,
    business: true,
  },
  {
    name: 'Basic Reports',
    free: true,
    starter: true,
    pro: true,
    business: true,
  },
  {
    name: 'DATEV Export',
    free: false,
    starter: true,
    pro: true,
    business: true,
  },
  {
    name: 'Tax Filing (UStVA)',
    free: false,
    starter: false,
    pro: true,
    business: true,
  },
  {
    name: 'EÜR Reports',
    free: false,
    starter: false,
    pro: true,
    business: true,
  },
  {
    name: 'BWA Reports',
    free: false,
    starter: false,
    pro: true,
    business: true,
  },
  {
    name: 'Cash Flow Predictions',
    free: false,
    starter: false,
    pro: true,
    business: true,
  },
  {
    name: 'Document OCR',
    free: false,
    starter: false,
    pro: true,
    business: true,
  },
  {
    name: 'Team Members',
    free: '1',
    starter: '1',
    pro: '3',
    business: 'Unlimited',
  },
  {
    name: 'API Access',
    free: false,
    starter: false,
    pro: false,
    business: true,
  },
  {
    name: 'Multi-Currency',
    free: false,
    starter: false,
    pro: false,
    business: true,
  },
  {
    name: 'Priority Support',
    free: false,
    starter: false,
    pro: true,
    business: true,
  },
  {
    name: 'Dedicated Support',
    free: false,
    starter: false,
    pro: false,
    business: true,
  },
];

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === 'string') {
    return <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{value}</span>;
  }

  if (value) {
    return (
      <div className="flex justify-center">
        <CheckIcon className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <XIcon className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
    </div>
  );
}

export function FeatureComparison() {
  return (
    <div className="w-full max-w-6xl mx-auto mt-24 mb-16">
      <h2 className="text-3xl font-bold text-center mb-12" style={{ color: 'var(--color-text-primary)' }}>
        Compare Plans
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2" style={{ borderColor: 'var(--color-border)' }}>
              <th className="text-left py-4 px-6 font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Feature
              </th>
              <th className="text-center py-4 px-6 font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Free
              </th>
              <th className="text-center py-4 px-6 font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Starter
              </th>
              <th className="text-center py-4 px-6 font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Pro
              </th>
              <th className="text-center py-4 px-6 font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Business
              </th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature, index) => (
              <tr
                key={index}
                className="border-b transition-colors hover:bg-[var(--color-background)]"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <td className="py-4 px-6 font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  {feature.name}
                </td>
                <td className="py-4 px-6 text-center">
                  <FeatureCell value={feature.free} />
                </td>
                <td className="py-4 px-6 text-center">
                  <FeatureCell value={feature.starter} />
                </td>
                <td className="py-4 px-6 text-center">
                  <FeatureCell value={feature.pro} />
                </td>
                <td className="py-4 px-6 text-center">
                  <FeatureCell value={feature.business} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
