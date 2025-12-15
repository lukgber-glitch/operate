'use client';

import { Separator } from '@/components/ui/separator';

const currentYear = new Date().getFullYear();

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

const legalLinks: FooterLink[] = [
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Payment Terms', href: '/payment-terms' },
  { label: 'Cookie Policy', href: '/cookies' },
  { label: 'AI Disclaimer', href: '/ai-disclaimer' },
  { label: 'DPA', href: '/dpa' },
  { label: 'Impressum', href: '/impressum' },
];

const footerLinks: FooterLink[] = [
  { label: 'FAQ', href: '/faq' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Acceptable Use', href: '/acceptable-use' },
  { label: 'Contact', href: 'mailto:support@operate.guru', external: true },
];

export function Footer() {
  return (
    <footer
      className="w-full border-t bg-background"
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="container mx-auto px-4 py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* Brand Section */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Operate</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              AI-powered financial automation platform for small businesses and freelancers.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Quick Links</h3>
            <nav aria-label="Footer navigation">
              <ul className="space-y-2">
                {footerLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:underline"
                      {...(link.external && {
                        target: '_blank',
                        rel: 'noopener noreferrer',
                      })}
                    >
                      {link.label}
                      {link.external && (
                        <span className="sr-only"> (opens in new window)</span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Legal Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Legal</h3>
            <nav aria-label="Legal information">
              <ul className="space-y-2">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:underline"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>
            &copy; {currentYear} Operate. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            <a
              href="/privacy"
              className="hover:text-foreground transition-colors hover:underline"
            >
              Privacy
            </a>
            <span aria-hidden="true">•</span>
            <a
              href="/terms"
              className="hover:text-foreground transition-colors hover:underline"
            >
              Terms
            </a>
            <span aria-hidden="true">•</span>
            <a
              href="/cookies"
              className="hover:text-foreground transition-colors hover:underline"
            >
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
