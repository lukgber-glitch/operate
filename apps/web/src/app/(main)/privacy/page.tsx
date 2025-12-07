'use client';

import { useEffect, useRef } from 'react';
import { Metadata } from 'next';
import { gsap } from 'gsap';

export default function PrivacyPolicyPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hero animation
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current.children,
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out',
        }
      );
    }

    // Content animation
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        {
          opacity: 0,
          y: 20,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay: 0.4,
          ease: 'power3.out',
        }
      );
    }
  }, []);

  return (
    <div className="min-h-screen py-16 px-4" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Hero Section */}
      <div ref={heroRef} className="max-w-4xl mx-auto text-center mb-16">
        <h1
          className="text-5xl md:text-6xl font-bold mb-6"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Privacy Policy
        </h1>
        <p
          className="text-xl md:text-2xl mb-4"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Your privacy is important to us
        </p>
        <p
          className="text-sm"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Last updated: December 7, 2025
        </p>
      </div>

      {/* Content */}
      <div ref={contentRef} className="max-w-4xl mx-auto">
        <div
          className="p-8 md:p-12 rounded-[var(--radius-2xl)] prose prose-lg max-w-none"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          {/* Table of Contents */}
          <nav className="mb-12 p-6 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Table of Contents
            </h2>
            <ol className="space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
              <li><a href="#introduction" className="hover:underline">1. Introduction</a></li>
              <li><a href="#data-collected" className="hover:underline">2. Data We Collect</a></li>
              <li><a href="#how-we-use" className="hover:underline">3. How We Use Your Data</a></li>
              <li><a href="#ai-processing" className="hover:underline">4. AI and Automated Processing</a></li>
              <li><a href="#data-sharing" className="hover:underline">5. Data Sharing and Third Parties</a></li>
              <li><a href="#international-transfers" className="hover:underline">6. International Data Transfers</a></li>
              <li><a href="#data-retention" className="hover:underline">7. Data Retention</a></li>
              <li><a href="#your-rights" className="hover:underline">8. Your Rights (GDPR)</a></li>
              <li><a href="#cookies" className="hover:underline">9. Cookies and Tracking</a></li>
              <li><a href="#children" className="hover:underline">10. Children's Privacy</a></li>
              <li><a href="#security" className="hover:underline">11. Security Measures</a></li>
              <li><a href="#changes" className="hover:underline">12. Changes to This Policy</a></li>
              <li><a href="#contact" className="hover:underline">13. Contact Us</a></li>
            </ol>
          </nav>

          {/* 1. Introduction */}
          <section id="introduction" className="mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              1. Introduction
            </h2>
            <div style={{ color: 'var(--color-text-secondary)' }}>
              <p className="mb-4">
                Welcome to Operate ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal data. This Privacy Policy explains how we collect, use, share, and protect your information when you use our AI-powered business automation platform at{' '}
                <a href="https://operate.guru" className="text-blue-600 hover:underline">https://operate.guru</a> (the "Service").
              </p>
              <p className="mb-4">
                Operate is operated from Germany and complies with the European Union's General Data Protection Regulation (GDPR), as well as applicable German data protection laws. This policy applies to all users of our Service, regardless of location.
              </p>
              <p className="mb-4">
                By using Operate, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, please do not use our Service.
              </p>
            </div>
          </section>

          {/* 2. Data We Collect */}
          <section id="data-collected" className="mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              2. Data We Collect
            </h2>
            <div style={{ color: 'var(--color-text-secondary)' }}>
              <p className="mb-4">
                We collect several types of information to provide and improve our Service:
              </p>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                2.1 Personal Information
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Name and email address</li>
                <li>Password (stored in hashed format only)</li>
                <li>Profile information (avatar, preferences, language settings)</li>
                <li>Phone number (optional)</li>
                <li>Business information (company name, tax ID, VAT number)</li>
              </ul>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                2.2 Financial Data
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Bank account information (obtained via secure third-party banking APIs)</li>
                <li>Transaction data (amounts, dates, descriptions, categories)</li>
                <li>Invoice data (amounts, vendors, customers, line items)</li>
                <li>Expense records and receipts</li>
                <li>Payment method information (processed by Stripe; we do not store full credit card numbers)</li>
              </ul>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                2.3 Business Data
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Customer information (names, contact details, payment terms)</li>
                <li>Vendor/supplier information</li>
                <li>Employee data (for payroll and HR features)</li>
                <li>Business documents (contracts, agreements, receipts)</li>
              </ul>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                2.4 Tax-Related Data
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Tax identification numbers</li>
                <li>VAT numbers and settings</li>
                <li>Tax filing history and documents</li>
                <li>ELSTER integration data (for German tax filing)</li>
              </ul>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                2.5 Communication Data
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Email content (only when you explicitly grant permission for email invoice extraction)</li>
                <li>Chat conversations with our AI assistant</li>
                <li>Support requests and correspondence</li>
              </ul>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                2.6 Documents and Files
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Uploaded invoices, receipts, and business documents</li>
                <li>Scanned documents processed through OCR (Optical Character Recognition)</li>
                <li>Document metadata (file names, upload dates, file types)</li>
              </ul>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                2.7 Usage Data
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>IP address and device information</li>
                <li>Browser type and version</li>
                <li>Pages visited and features used</li>
                <li>Time and date of access</li>
                <li>Error logs and diagnostic data</li>
              </ul>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                2.8 Authentication Data
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>OAuth tokens (Google, Microsoft) - stored securely</li>
                <li>Session tokens and refresh tokens</li>
                <li>Two-factor authentication settings</li>
              </ul>
            </div>
          </section>

          {/* 3. How We Use Your Data */}
          <section id="how-we-use" className="mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              3. How We Use Your Data
            </h2>
            <div style={{ color: 'var(--color-text-secondary)' }}>
              <p className="mb-4">
                We use your personal data for the following purposes, based on these legal bases under GDPR:
              </p>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                3.1 Service Provision (Contract Performance)
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Operating and maintaining your Operate account</li>
                <li>Processing transactions and managing invoices</li>
                <li>Connecting to your bank accounts via secure APIs</li>
                <li>Providing AI-powered business automation features</li>
                <li>Generating financial reports and insights</li>
              </ul>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                3.2 Legal Compliance
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Assisting with tax filing and compliance (ELSTER, VAT reporting)</li>
                <li>Maintaining records as required by German and EU tax laws</li>
                <li>Identity verification (via Persona) for fraud prevention</li>
                <li>Responding to legal requests and preventing fraud</li>
              </ul>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                3.3 Legitimate Interests
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Improving our AI models and automation features</li>
                <li>Analyzing usage patterns to enhance user experience</li>
                <li>Detecting and preventing security threats</li>
                <li>Sending service announcements and important updates</li>
                <li>Customer support and troubleshooting</li>
              </ul>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                3.4 With Your Consent
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Accessing your email for invoice extraction (only when explicitly granted)</li>
                <li>Sending marketing communications (you can opt out anytime)</li>
                <li>Using non-essential cookies for analytics</li>
              </ul>
            </div>
          </section>

          {/* 4. AI and Automated Processing */}
          <section id="ai-processing" className="mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              4. AI and Automated Processing
            </h2>
            <div style={{ color: 'var(--color-text-secondary)' }}>
              <p className="mb-4">
                Operate uses artificial intelligence (AI) powered by Anthropic Claude to automate various business tasks. Here's how we use AI and your rights regarding automated decisions:
              </p>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                4.1 AI-Powered Features
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Transaction Classification:</strong> Automatically categorizing bank transactions by type (income, expense, tax-deductible, etc.)</li>
                <li><strong>Invoice Extraction:</strong> Reading invoices from emails and documents using OCR and AI</li>
                <li><strong>Chat Assistant:</strong> Providing conversational AI to help you manage your business</li>
                <li><strong>Document Search:</strong> AI-powered natural language search across your documents</li>
                <li><strong>Cash Flow Predictions:</strong> Forecasting future cash flow based on historical data</li>
                <li><strong>Expense Matching:</strong> Automatically matching receipts to bank transactions</li>
                <li><strong>Tax Optimization:</strong> Suggesting tax-saving strategies based on your business data</li>
              </ul>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                4.2 Data Sent to AI Providers
              </h3>
              <p className="mb-4">
                When you use AI features, relevant data is sent to Anthropic's Claude API for processing. This may include:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Transaction descriptions and amounts</li>
                <li>Invoice content and metadata</li>
                <li>Your chat messages and questions</li>
                <li>Document text extracted via OCR</li>
              </ul>
              <p className="mb-4">
                Anthropic does not use your data to train their AI models. All data processing complies with their data protection agreements.
              </p>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                4.3 Your Rights Regarding Automated Decisions
              </h3>
              <p className="mb-4">
                Under GDPR Article 22, you have the right to:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Human Review:</strong> Request human review of any automated decision that significantly affects you</li>
                <li><strong>Explanation:</strong> Receive an explanation of how an automated decision was made</li>
                <li><strong>Contest:</strong> Challenge an automated decision and have it reconsidered</li>
                <li><strong>Opt-Out:</strong> Disable certain AI features (though this may limit functionality)</li>
              </ul>
              <p className="mb-4">
                Important: Our AI features are designed to <strong>assist</strong>, not replace your judgment. Final decisions on financial matters, tax filing, and business operations always remain with you.
              </p>
            </div>
          </section>

          {/* 5. Data Sharing */}
          <section id="data-sharing" className="mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              5. Data Sharing and Third Parties
            </h2>
            <div style={{ color: 'var(--color-text-secondary)' }}>
              <p className="mb-4">
                We share your data with third-party service providers only as necessary to operate our Service. All third parties are contractually bound to protect your data and use it only for the purposes we specify.
              </p>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                5.1 Third-Party Service Providers
              </h3>

              <div className="mb-6">
                <h4 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  Anthropic (Claude AI)
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Purpose:</strong> AI processing for chat, classification, and automation</li>
                  <li><strong>Data Shared:</strong> Chat messages, transaction descriptions, invoice content</li>
                  <li><strong>Location:</strong> United States (EU-US Data Privacy Framework compliant)</li>
                  <li><strong>Privacy Policy:</strong> <a href="https://www.anthropic.com/privacy" className="text-blue-600 hover:underline">anthropic.com/privacy</a></li>
                </ul>
              </div>

              <div className="mb-6">
                <h4 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  TrueLayer / Tink / Plaid (Banking Data)
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Purpose:</strong> Secure connection to your bank accounts</li>
                  <li><strong>Data Shared:</strong> Bank credentials (encrypted), transaction data</li>
                  <li><strong>Location:</strong> EU (TrueLayer/Tink), US (Plaid - EU-US DPF compliant)</li>
                  <li><strong>Note:</strong> These providers are regulated financial institutions with strict data protection requirements</li>
                </ul>
              </div>

              <div className="mb-6">
                <h4 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  Stripe (Payment Processing)
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Purpose:</strong> Subscription billing and payment processing</li>
                  <li><strong>Data Shared:</strong> Name, email, payment method information</li>
                  <li><strong>Location:</strong> United States (EU-US Data Privacy Framework compliant)</li>
                  <li><strong>Privacy Policy:</strong> <a href="https://stripe.com/privacy" className="text-blue-600 hover:underline">stripe.com/privacy</a></li>
                </ul>
              </div>

              <div className="mb-6">
                <h4 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  Mindee (Document OCR)
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Purpose:</strong> Extracting text from invoices and receipts</li>
                  <li><strong>Data Shared:</strong> Uploaded documents (images/PDFs)</li>
                  <li><strong>Location:</strong> EU (GDPR compliant)</li>
                </ul>
              </div>

              <div className="mb-6">
                <h4 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  Persona (Identity Verification)
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Purpose:</strong> KYC (Know Your Customer) verification for fraud prevention</li>
                  <li><strong>Data Shared:</strong> Name, ID documents, biometric data (during verification only)</li>
                  <li><strong>Location:</strong> United States (EU-US Data Privacy Framework compliant)</li>
                </ul>
              </div>

              <div className="mb-6">
                <h4 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  Sentry (Error Tracking)
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Purpose:</strong> Monitoring application errors and performance</li>
                  <li><strong>Data Shared:</strong> Error logs, stack traces, anonymized usage data</li>
                  <li><strong>Location:</strong> United States (EU-US Data Privacy Framework compliant)</li>
                </ul>
              </div>

              <div className="mb-6">
                <h4 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  Google / Microsoft (OAuth & Email)
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Purpose:</strong> Single sign-on (SSO) and email invoice extraction (opt-in)</li>
                  <li><strong>Data Shared:</strong> Email address, profile information; email content (only if you grant permission)</li>
                  <li><strong>Location:</strong> United States (EU-US Data Privacy Framework compliant)</li>
                </ul>
              </div>

              <h3 className="text-2xl font-semibold mb-3 mt-8" style={{ color: 'var(--color-text-primary)' }}>
                5.2 We Do NOT Share Data With
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Advertisers or marketing companies</li>
                <li>Data brokers or analytics companies (except as described above)</li>
                <li>Social media platforms (unless you explicitly connect them)</li>
              </ul>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                5.3 Legal Disclosures
              </h3>
              <p className="mb-4">
                We may disclose your data if required by law, court order, or government request, or to protect our rights, property, or safety.
              </p>
            </div>
          </section>

          {/* 6. International Data Transfers */}
          <section id="international-transfers" className="mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              6. International Data Transfers
            </h2>
            <div style={{ color: 'var(--color-text-secondary)' }}>
              <p className="mb-4">
                Operate is based in Germany (EU), but some of our service providers are located in the United States and other countries outside the European Economic Area (EEA).
              </p>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                6.1 EU-US Data Privacy Framework
              </h3>
              <p className="mb-4">
                For transfers to the United States, we rely on service providers certified under the EU-US Data Privacy Framework (formerly Privacy Shield), including:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Anthropic (Claude AI)</li>
                <li>Stripe (payments)</li>
                <li>Plaid (US banking)</li>
                <li>Persona (identity verification)</li>
                <li>Sentry (error tracking)</li>
                <li>Google and Microsoft (OAuth, email)</li>
              </ul>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                6.2 Standard Contractual Clauses
              </h3>
              <p className="mb-4">
                Where EU-US DPF certification is not available, we use Standard Contractual Clauses (SCCs) approved by the European Commission to ensure your data is protected to EU standards.
              </p>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                6.3 Additional Safeguards
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>All data transfers are encrypted in transit (TLS 1.3)</li>
                <li>We conduct privacy impact assessments for all international transfers</li>
                <li>We limit data transfers to what is strictly necessary</li>
                <li>We require all providers to implement appropriate technical and organizational measures</li>
              </ul>
            </div>
          </section>

          {/* 7. Data Retention */}
          <section id="data-retention" className="mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              7. Data Retention
            </h2>
            <div style={{ color: 'var(--color-text-secondary)' }}>
              <p className="mb-4">
                We retain your data only as long as necessary to provide our Service and comply with legal obligations:
              </p>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                7.1 Active Accounts
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Account data:</strong> Retained while your account is active</li>
                <li><strong>Financial data:</strong> Retained for the current fiscal year plus 10 years (German tax law requirement)</li>
                <li><strong>Chat history:</strong> Retained for 2 years or until account deletion</li>
                <li><strong>Documents:</strong> Retained until you delete them or close your account</li>
              </ul>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                7.2 Closed Accounts
              </h3>
              <p className="mb-4">
                When you close your account:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Personal data is deleted within 30 days</li>
                <li>Financial records required by law are retained for 10 years (anonymized where possible)</li>
                <li>Backup copies are deleted within 90 days</li>
                <li>Aggregated, anonymized analytics data may be retained indefinitely</li>
              </ul>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                7.3 Legal Retention Requirements
              </h3>
              <p className="mb-4">
                Under German and EU law, certain business records must be retained for:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>10 years:</strong> Invoices, receipts, tax returns, financial statements</li>
                <li><strong>6 years:</strong> Business correspondence, contracts</li>
              </ul>
              <p className="mb-4">
                We cannot delete these records earlier, even upon request, due to legal obligations.
              </p>
            </div>
          </section>

          {/* 8. Your Rights (GDPR) */}
          <section id="your-rights" className="mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              8. Your Rights (GDPR)
            </h2>
            <div style={{ color: 'var(--color-text-secondary)' }}>
              <p className="mb-4">
                Under the General Data Protection Regulation (GDPR), you have the following rights regarding your personal data:
              </p>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                8.1 Right of Access (Article 15)
              </h3>
              <p className="mb-4">
                You can request a copy of all personal data we hold about you. We will provide this in a structured, commonly used, machine-readable format (JSON or CSV).
              </p>
              <p className="mb-4">
                <strong>How to exercise:</strong> Go to Settings → Privacy → Download My Data, or email{' '}
                <a href="mailto:privacy@operate.guru" className="text-blue-600 hover:underline">privacy@operate.guru</a>
              </p>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                8.2 Right to Rectification (Article 16)
              </h3>
              <p className="mb-4">
                You can correct or update your personal data at any time.
              </p>
              <p className="mb-4">
                <strong>How to exercise:</strong> Go to Settings → Profile or contact support
              </p>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                8.3 Right to Erasure / "Right to be Forgotten" (Article 17)
              </h3>
              <p className="mb-4">
                You can request deletion of your personal data, subject to legal retention requirements.
              </p>
              <p className="mb-4">
                <strong>How to exercise:</strong> Go to Settings → Privacy → Delete Account, or email{' '}
                <a href="mailto:privacy@operate.guru" className="text-blue-600 hover:underline">privacy@operate.guru</a>
              </p>
              <p className="mb-4">
                <strong>Important:</strong> Some data (invoices, tax records) cannot be deleted for 10 years due to German tax law. We will anonymize such data where possible.
              </p>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                8.4 Right to Data Portability (Article 20)
              </h3>
              <p className="mb-4">
                You can export your data to another service in a machine-readable format.
              </p>
              <p className="mb-4">
                <strong>How to exercise:</strong> Go to Settings → Privacy → Export Data (available formats: JSON, CSV, Excel)
              </p>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                8.5 Right to Restriction of Processing (Article 18)
              </h3>
              <p className="mb-4">
                You can ask us to temporarily stop processing your data in certain circumstances (e.g., while disputing its accuracy).
              </p>
              <p className="mb-4">
                <strong>How to exercise:</strong> Email{' '}
                <a href="mailto:privacy@operate.guru" className="text-blue-600 hover:underline">privacy@operate.guru</a>
              </p>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                8.6 Right to Object (Article 21)
              </h3>
              <p className="mb-4">
                You can object to:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Processing based on legitimate interests (we will stop unless we have compelling legitimate grounds)</li>
                <li>Direct marketing at any time (we will stop immediately)</li>
                <li>Automated decision-making, including profiling</li>
              </ul>
              <p className="mb-4">
                <strong>How to exercise:</strong> Go to Settings → Privacy → Opt-Out Settings, or email{' '}
                <a href="mailto:privacy@operate.guru" className="text-blue-600 hover:underline">privacy@operate.guru</a>
              </p>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                8.7 Right to Withdraw Consent (Article 7)
              </h3>
              <p className="mb-4">
                Where we process data based on your consent (e.g., email invoice extraction), you can withdraw consent at any time.
              </p>
              <p className="mb-4">
                <strong>How to exercise:</strong> Go to Settings → Integrations and disconnect the relevant service
              </p>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                8.8 Right to Lodge a Complaint
              </h3>
              <p className="mb-4">
                You have the right to lodge a complaint with a supervisory authority, particularly in the EU member state where you live, work, or where an alleged infringement occurred.
              </p>
              <p className="mb-4">
                <strong>German Supervisory Authority:</strong><br />
                Der Bundesbeauftragte für den Datenschutz und die Informationsfreiheit (BfDI)<br />
                Graurheindorfer Str. 153, 53117 Bonn, Germany<br />
                Website: <a href="https://www.bfdi.bund.de" className="text-blue-600 hover:underline">bfdi.bund.de</a>
              </p>

              <h3 className="text-2xl font-semibold mb-3 mt-8" style={{ color: 'var(--color-text-primary)' }}>
                8.9 Response Time
              </h3>
              <p className="mb-4">
                We will respond to all rights requests within <strong>30 days</strong> (as required by GDPR). If we need more time, we will inform you and explain why.
              </p>
            </div>
          </section>

          {/* 9. Cookies */}
          <section id="cookies" className="mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              9. Cookies and Tracking
            </h2>
            <div style={{ color: 'var(--color-text-secondary)' }}>
              <p className="mb-4">
                We use cookies and similar tracking technologies to provide and improve our Service.
              </p>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                9.1 Essential Cookies (Required)
              </h3>
              <p className="mb-4">
                These cookies are necessary for the Service to function:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Session cookies:</strong> Keep you logged in</li>
                <li><strong>Security cookies:</strong> Prevent fraud and attacks</li>
                <li><strong>Preference cookies:</strong> Remember your settings (language, theme)</li>
              </ul>
              <p className="mb-4">
                These cookies cannot be disabled without breaking core functionality.
              </p>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                9.2 Analytics Cookies (Optional)
              </h3>
              <p className="mb-4">
                We use analytics to understand how users interact with our Service:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Pages visited and features used</li>
                <li>Time spent on pages</li>
                <li>Error rates and performance metrics</li>
              </ul>
              <p className="mb-4">
                You can opt out of analytics cookies in Settings → Privacy → Cookie Preferences.
              </p>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                9.3 Third-Party Cookies
              </h3>
              <p className="mb-4">
                Our third-party service providers (Stripe, Anthropic, etc.) may set their own cookies. Please review their privacy policies for details.
              </p>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                9.4 Do Not Track (DNT)
              </h3>
              <p className="mb-4">
                We respect the Do Not Track (DNT) browser setting. If DNT is enabled, we will not use analytics cookies.
              </p>
            </div>
          </section>

          {/* 10. Children's Privacy */}
          <section id="children" className="mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              10. Children's Privacy
            </h2>
            <div style={{ color: 'var(--color-text-secondary)' }}>
              <p className="mb-4">
                Operate is not intended for individuals under 16 years of age. We do not knowingly collect personal data from children under 16.
              </p>
              <p className="mb-4">
                If you are a parent or guardian and believe your child has provided us with personal data, please contact us at{' '}
                <a href="mailto:privacy@operate.guru" className="text-blue-600 hover:underline">privacy@operate.guru</a>.
                We will delete such data promptly.
              </p>
            </div>
          </section>

          {/* 11. Security Measures */}
          <section id="security" className="mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              11. Security Measures
            </h2>
            <div style={{ color: 'var(--color-text-secondary)' }}>
              <p className="mb-4">
                We implement industry-standard security measures to protect your data:
              </p>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                11.1 Encryption
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>In transit:</strong> TLS 1.3 encryption for all data transfers</li>
                <li><strong>At rest:</strong> AES-256 encryption for stored data</li>
                <li><strong>Passwords:</strong> Hashed using bcrypt (never stored in plain text)</li>
              </ul>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                11.2 Access Controls
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Role-based access control (RBAC) for team members</li>
                <li>Multi-factor authentication (MFA) available</li>
                <li>Regular access reviews and audit logs</li>
                <li>Principle of least privilege for all system access</li>
              </ul>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                11.3 Infrastructure Security
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Hosted on secure, SOC 2 compliant servers</li>
                <li>Regular security audits and penetration testing</li>
                <li>Automated vulnerability scanning</li>
                <li>DDoS protection and web application firewall (WAF)</li>
              </ul>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                11.4 Data Backups
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Daily automated backups (encrypted)</li>
                <li>Backups stored in geographically separate locations</li>
                <li>Regular disaster recovery testing</li>
              </ul>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                11.5 Employee Training
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>All employees sign confidentiality agreements</li>
                <li>Regular security and privacy training</li>
                <li>Background checks for employees with data access</li>
              </ul>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                11.6 Breach Notification
              </h3>
              <p className="mb-4">
                In the event of a data breach that poses a risk to your rights and freedoms, we will:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Notify the relevant supervisory authority within 72 hours (GDPR requirement)</li>
                <li>Notify affected users without undue delay</li>
                <li>Provide details about the breach and steps we're taking</li>
                <li>Offer guidance on protecting yourself</li>
              </ul>
            </div>
          </section>

          {/* 12. Changes to This Policy */}
          <section id="changes" className="mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              12. Changes to This Policy
            </h2>
            <div style={{ color: 'var(--color-text-secondary)' }}>
              <p className="mb-4">
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors.
              </p>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                12.1 How We Notify You
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Minor changes:</strong> Updated "Last updated" date at the top of this page</li>
                <li><strong>Material changes:</strong> Email notification + prominent notice in the app for 30 days</li>
                <li><strong>Changes requiring consent:</strong> We will ask for your explicit consent before applying</li>
              </ul>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                12.2 Your Options
              </h3>
              <p className="mb-4">
                If you disagree with changes to this Privacy Policy, you can:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Close your account before the changes take effect</li>
                <li>Contact us to discuss concerns</li>
                <li>Lodge a complaint with a supervisory authority</li>
              </ul>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                12.3 Version History
              </h3>
              <p className="mb-4">
                We maintain a history of all Privacy Policy versions. To view previous versions, contact{' '}
                <a href="mailto:privacy@operate.guru" className="text-blue-600 hover:underline">privacy@operate.guru</a>.
              </p>
            </div>
          </section>

          {/* 13. Contact Us */}
          <section id="contact" className="mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              13. Contact Us
            </h2>
            <div style={{ color: 'var(--color-text-secondary)' }}>
              <p className="mb-4">
                If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                13.1 Data Protection Officer (DPO)
              </h3>
              <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
                <p className="mb-2"><strong>Email:</strong> <a href="mailto:privacy@operate.guru" className="text-blue-600 hover:underline">privacy@operate.guru</a></p>
                <p className="mb-2"><strong>Support:</strong> <a href="mailto:support@operate.guru" className="text-blue-600 hover:underline">support@operate.guru</a></p>
                <p className="mb-2"><strong>Website:</strong> <a href="https://operate.guru" className="text-blue-600 hover:underline">https://operate.guru</a></p>
              </div>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                13.2 Response Time
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Privacy requests:</strong> Within 30 days (GDPR requirement)</li>
                <li><strong>General inquiries:</strong> Within 48 hours</li>
                <li><strong>Urgent security matters:</strong> Within 24 hours</li>
              </ul>

              <h3 className="text-2xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary)' }}>
                13.3 Complaint Process
              </h3>
              <p className="mb-4">
                If you are not satisfied with our response:
              </p>
              <ol className="list-decimal pl-6 mb-4 space-y-2">
                <li>Contact our DPO at <a href="mailto:privacy@operate.guru" className="text-blue-600 hover:underline">privacy@operate.guru</a></li>
                <li>If still unresolved, escalate to our management team</li>
                <li>You may also lodge a complaint with the German data protection authority (BfDI) at any time</li>
              </ol>
            </div>
          </section>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-sm text-center" style={{ color: 'var(--color-text-tertiary)' }}>
              This Privacy Policy is effective as of December 7, 2025.
              <br />
              <a href="/" className="text-blue-600 hover:underline">Return to Operate</a>
              {' '}&middot;{' '}
              <a href="/pricing" className="text-blue-600 hover:underline">Pricing</a>
              {' '}&middot;{' '}
              <a href="mailto:support@operate.guru" className="text-blue-600 hover:underline">Contact Support</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
