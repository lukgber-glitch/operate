import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Operate',
    default: 'Operate - Legal Information',
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
