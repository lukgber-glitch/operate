import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | Operate',
  description: 'Terms of Service for Operate - AI-powered business automation platform',
};

export default function TermsPage() {
  const lastUpdated = '14 December 2025';

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="text-sm mb-4 inline-block hover:opacity-80"
            style={{ color: 'var(--color-primary)' }}
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Terms of Service
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Table of Contents */}
        <div className="rounded-lg p-6 mb-12" style={{ backgroundColor: 'var(--color-surface)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Table of Contents
          </h2>
          <nav className="space-y-2">
            <a href="#agreement" className="block hover:opacity-80" style={{ color: 'var(--color-primary)' }}>1. Agreement to Terms</a>
            <a href="#description" className="block hover:opacity-80" style={{ color: 'var(--color-primary)' }}>2. Description of Service</a>
            <a href="#accounts" className="block hover:opacity-80" style={{ color: 'var(--color-primary)' }}>3. User Accounts</a>
            <a href="#acceptable-use" className="block hover:opacity-80" style={{ color: 'var(--color-primary)' }}>4. Acceptable Use</a>
            <a href="#ai-disclaimer" className="block hover:opacity-80" style={{ color: 'var(--color-primary)' }}>5. AI Assistant Disclaimer</a>
            <a href="#financial-disclaimer" className="block hover:opacity-80" style={{ color: 'var(--color-primary)' }}>6. Financial Information Disclaimer</a>
            <a href="#tax-disclaimer" className="block hover:opacity-80" style={{ color: 'var(--color-primary)' }}>7. Tax Filing Disclaimer</a>
            <a href="#third-party" className="block hover:opacity-80" style={{ color: 'var(--color-primary)' }}>8. Third-Party Services</a>
            <a href="#payment-services" className="block hover:opacity-80" style={{ color: 'var(--color-primary)' }}>9. Payment Initiation Services</a>
            <a href="#email-processing" className="block hover:opacity-80" style={{ color: 'var(--color-primary)' }}>10. Email Integration & Processing</a>
            <a href="#intellectual-property" className="block hover:opacity-80" style={{ color: 'var(--color-primary)' }}>11. Intellectual Property</a>
            <a href="#billing" className="block hover:opacity-80" style={{ color: 'var(--color-primary)' }}>12. Subscription & Billing</a>
            <a href="#liability" className="block hover:opacity-80" style={{ color: 'var(--color-primary)' }}>13. Limitation of Liability</a>
            <a href="#indemnification" className="block hover:opacity-80" style={{ color: 'var(--color-primary)' }}>14. Indemnification</a>
            <a href="#termination" className="block hover:opacity-80" style={{ color: 'var(--color-primary)' }}>15. Termination</a>
            <a href="#disputes" className="block hover:opacity-80" style={{ color: 'var(--color-primary)' }}>16. Dispute Resolution</a>
            <a href="#changes" className="block hover:opacity-80" style={{ color: 'var(--color-primary)' }}>17. Changes to Terms</a>
            <a href="#contact" className="block hover:opacity-80" style={{ color: 'var(--color-primary)' }}>18. Contact Information</a>
          </nav>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* 1. Agreement to Terms */}
          <section id="agreement" className="mb-12">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              1. Agreement to Terms
            </h2>
            <div className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
              <p>
                These Terms of Service ("Terms") constitute a legally binding agreement between you ("User," "you," or "your") and Operate ("Operate," "we," "us," or "our"), governing your access to and use of the Operate platform, website (https://operate.guru), and all related services (collectively, the "Service").
              </p>
              <p>
                By accessing or using the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, you must not access or use the Service.
              </p>
              <p>
                You represent that you are at least 18 years old and have the legal capacity to enter into this agreement. If you are accessing the Service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.
              </p>
            </div>
          </section>

          {/* 2. Description of Service */}
          <section id="description" className="mb-12">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              2. Description of Service
            </h2>
            <div className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
              <p>
                Operate is an AI-powered business automation platform designed for small and medium-sized enterprises (SMEs). The Service provides the following features:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>AI-powered chat assistant for business operations</li>
                <li>Bank account connection and transaction management</li>
                <li>Invoice and expense tracking and management</li>
                <li>Tax filing assistance and facilitation</li>
                <li>HR and payroll features</li>
                <li>Payment processing integration via Stripe</li>
                <li>Document management and intelligent search</li>
                <li>Financial reporting and analytics</li>
              </ul>
              <p>
                We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time, with or without notice, and without liability to you.
              </p>
            </div>
          </section>

          {/* 3. User Accounts */}
          <section id="accounts" className="mb-12">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              3. User Accounts
            </h2>
            <div className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                3.1 Registration Requirements
              </h3>
              <p>
                To use the Service, you must create an account by providing accurate, current, and complete information. You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide true, accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information to keep it accurate and complete</li>
                <li>Maintain only one account per individual or business entity</li>
                <li>Not create an account using a false identity or impersonating another person or entity</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                3.2 Account Security
              </h3>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use a strong, unique password for your account</li>
                <li>Not share your password or account access with any third party</li>
                <li>Immediately notify us of any unauthorized use of your account or any other security breach</li>
                <li>Log out of your account at the end of each session</li>
              </ul>
              <p>
                We are not liable for any loss or damage arising from your failure to comply with these security obligations.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                3.3 Account Restrictions
              </h3>
              <p>
                Each person or business entity may maintain only one account. Creating multiple accounts or sharing accounts is prohibited and may result in immediate termination of all associated accounts.
              </p>
            </div>
          </section>

          {/* 4. Acceptable Use */}
          <section id="acceptable-use" className="mb-12">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              4. Acceptable Use
            </h2>
            <div className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                4.1 Permitted Uses
              </h3>
              <p>
                You may use the Service only for lawful business purposes in accordance with these Terms.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                4.2 Prohibited Activities
              </h3>
              <p>
                You agree not to engage in any of the following prohibited activities:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violating any applicable laws, regulations, or third-party rights</li>
                <li>Using the Service to transmit any harmful, offensive, or illegal content</li>
                <li>Attempting to gain unauthorized access to the Service or related systems</li>
                <li>Interfering with or disrupting the Service or servers or networks connected to the Service</li>
                <li>Using automated systems (bots, scrapers) to access the Service without our permission</li>
                <li>Reverse engineering, decompiling, or disassembling any aspect of the Service</li>
                <li>Collecting or harvesting any information from the Service or other users</li>
                <li>Transmitting spam, chain letters, or unsolicited communications</li>
                <li>Uploading viruses, malware, or any malicious code</li>
                <li>Impersonating any person or entity or misrepresenting your affiliation</li>
                <li>Using the Service for any illegal or fraudulent purpose</li>
                <li>Circumventing or manipulating the fee structure, billing process, or fees owed</li>
                <li>Reselling or redistributing the Service without our written permission</li>
              </ul>
            </div>
          </section>

          {/* 5. AI Assistant Disclaimer */}
          <section id="ai-disclaimer" className="mb-12">
            <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)', borderLeft: '4px solid var(--color-error)' }}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-error)' }}>
                ⚠️ 5. AI Assistant Disclaimer
              </h2>
              <div className="space-y-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                <p className="text-lg">
                  <strong>CRITICAL NOTICE: THE AI ASSISTANT IS NOT A PROFESSIONAL ADVISOR</strong>
                </p>
                <p>
                  The AI-powered chat assistant provided through the Service is an automated tool designed to assist with business operations. <strong>The AI assistant is NOT:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>A licensed financial advisor or financial planner</li>
                  <li>A certified public accountant (CPA) or tax professional</li>
                  <li>A lawyer or legal advisor</li>
                  <li>A certified human resources professional</li>
                  <li>A licensed investment advisor</li>
                  <li>A substitute for professional advice in any field</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  5.1 Informational Purposes Only
                </h3>
                <p>
                  All suggestions, recommendations, and information provided by the AI assistant are for <strong>informational purposes only</strong>. The AI assistant:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provides general information and suggestions based on patterns and data</li>
                  <li>May make errors, omissions, or provide incomplete information</li>
                  <li>Does not have knowledge of all laws, regulations, or your specific circumstances</li>
                  <li>Cannot guarantee accuracy, completeness, or suitability of its responses</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  5.2 User Responsibility
                </h3>
                <p>
                  You acknowledge and agree that:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>You are solely responsible</strong> for all decisions made based on AI assistant suggestions</li>
                  <li>You must verify all information provided by the AI assistant independently</li>
                  <li>You should consult with qualified professionals before making important business, financial, tax, legal, or HR decisions</li>
                  <li>We are not liable for any losses, damages, or consequences resulting from following AI assistant suggestions</li>
                  <li>The AI assistant's responses do not constitute professional advice or create any professional relationship</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  5.3 No Guarantee of Accuracy
                </h3>
                <p>
                  We make no representations or warranties regarding the accuracy, reliability, completeness, or timeliness of any information provided by the AI assistant. The AI may:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Produce incorrect, outdated, or misleading information</li>
                  <li>Misinterpret your questions or context</li>
                  <li>Provide responses that are not applicable to your specific situation</li>
                  <li>Fail to consider relevant factors or recent changes in laws or regulations</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 6. Financial Information Disclaimer */}
          <section id="financial-disclaimer" className="mb-12">
            <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)', borderLeft: '4px solid var(--color-error)' }}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-error)' }}>
                ⚠️ 6. Financial Information Disclaimer
              </h2>
              <div className="space-y-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  6.1 Not Financial, Investment, or Accounting Advice
                </h3>
                <p>
                  <strong>The Service does NOT provide financial, investment, accounting, or tax advice.</strong> Any financial information, reports, analyses, or suggestions provided through the Service are for informational and organizational purposes only.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  6.2 Consult Licensed Professionals
                </h3>
                <p>
                  Before making any financial, investment, accounting, or tax decisions, you should:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Consult with a licensed financial advisor or financial planner</li>
                  <li>Seek advice from a certified public accountant (CPA)</li>
                  <li>Engage a qualified tax professional or tax attorney</li>
                  <li>Obtain professional advice tailored to your specific circumstances</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  6.3 No Liability for Financial Decisions
                </h3>
                <p>
                  You acknowledge and agree that:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>We are not responsible for any financial decisions you make based on information from the Service</li>
                  <li>We are not liable for any financial losses, penalties, interest, or damages you may incur</li>
                  <li>All investment and financial decisions carry inherent risks</li>
                  <li>Past performance or historical data does not guarantee future results</li>
                  <li>You are solely responsible for evaluating the accuracy and suitability of all financial information</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  6.4 No Professional Relationship
                </h3>
                <p>
                  Use of the Service does not create any professional relationship, including but not limited to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Financial advisor-client relationship</li>
                  <li>Accountant-client relationship</li>
                  <li>Attorney-client relationship</li>
                  <li>Any fiduciary duty owed to you</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 7. Tax Filing Disclaimer */}
          <section id="tax-disclaimer" className="mb-12">
            <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)', borderLeft: '4px solid var(--color-error)' }}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-error)' }}>
                ⚠️ 7. Tax Filing Disclaimer
              </h2>
              <div className="space-y-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  7.1 We Facilitate, We Do Not Advise
                </h3>
                <p>
                  The Service provides tools to facilitate tax filing and preparation (including integration with systems such as ELSTER, HMRC, and others). <strong>We do NOT provide tax advice, tax planning, or tax consulting services.</strong>
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  7.2 User Responsibility for Tax Accuracy
                </h3>
                <p>
                  You acknowledge and agree that:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>You are solely responsible</strong> for the accuracy and completeness of all tax filings</li>
                  <li>You are responsible for reviewing all tax documents before submission</li>
                  <li>You are responsible for ensuring compliance with all applicable tax laws and regulations</li>
                  <li>You are responsible for maintaining adequate records and documentation</li>
                  <li>The Service may not identify all applicable deductions, credits, or tax obligations</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  7.3 Not Accountants or Tax Preparers
                </h3>
                <p>
                  We are not accountants, enrolled agents, certified public accountants (CPAs), or licensed tax preparers. The Service:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Does not provide personalized tax advice</li>
                  <li>Cannot guarantee that tax calculations are accurate or complete</li>
                  <li>Cannot guarantee compliance with current tax laws and regulations</li>
                  <li>May not be suitable for complex tax situations</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  7.4 Consult Tax Professionals
                </h3>
                <p>
                  <strong>Before filing any tax returns, you should consult with a qualified tax professional, CPA, or tax attorney</strong>, especially if you have:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Complex business structures or transactions</li>
                  <li>International income or operations</li>
                  <li>Uncertainty about tax obligations or deductions</li>
                  <li>Significant tax liabilities or planning opportunities</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  7.5 No Liability for Tax Consequences
                </h3>
                <p>
                  We are not liable for any tax-related consequences, including but not limited to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Tax penalties, interest, or additional taxes assessed</li>
                  <li>Audits or investigations by tax authorities</li>
                  <li>Errors or omissions in tax filings facilitated through the Service</li>
                  <li>Late filing penalties or missed deadlines</li>
                  <li>Lost tax benefits or overpayment of taxes</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 8. Third-Party Services */}
          <section id="third-party" className="mb-12">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              8. Third-Party Services
            </h2>
            <div className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                8.1 Third-Party Integrations
              </h3>
              <p>
                The Service integrates with various third-party services, including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Banking Services:</strong> TrueLayer, Tink, Plaid (for bank account connections and transaction data)</li>
                <li><strong>Payment Processing:</strong> Stripe (for payment processing and billing)</li>
                <li><strong>Email Services:</strong> Google OAuth and email integrations</li>
                <li><strong>AI Services:</strong> Anthropic Claude (for AI-powered features)</li>
                <li><strong>Tax Filing Systems:</strong> ELSTER, HMRC, and other government tax portals</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                8.2 Third-Party Terms Apply
              </h3>
              <p>
                Your use of third-party services through Operate is subject to the terms and conditions and privacy policies of those third-party providers. You are responsible for reviewing and agreeing to such terms.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                8.3 No Endorsement or Liability
              </h3>
              <p>
                We do not endorse, warrant, or assume any responsibility for any third-party services. We are not liable for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>The availability, accuracy, or functionality of third-party services</li>
                <li>Any errors, omissions, or delays in third-party data</li>
                <li>Any actions or omissions of third-party service providers</li>
                <li>Any disputes between you and third-party service providers</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                8.4 Banking and Financial Data
              </h3>
              <p>
                When you connect your bank accounts through the Service, you authorize us to access your financial data through our third-party banking service providers (TrueLayer, Tink, Plaid). You acknowledge that:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>We rely on third-party services to retrieve banking data</li>
                <li>Banking data may be delayed, incomplete, or inaccurate</li>
                <li>You are responsible for verifying the accuracy of all financial data</li>
                <li>We are not responsible for errors in data provided by third-party banking services</li>
              </ul>

              <h4 className="text-lg font-semibold mt-4 mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Read-Only Access
              </h4>
              <p>
                By default, bank connections provide <strong>read-only access</strong> to view balances and transactions. We cannot modify your accounts, initiate transfers, or access your funds without explicit authorization for payment initiation (see Section 9).
              </p>

              <h4 className="text-lg font-semibold mt-4 mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Payment Initiation Authorization
              </h4>
              <p>
                If you choose to use payment features, each payment requires separate authorization through Strong Customer Authentication (SCA) in your bank's app or website. We act solely as a technical intermediary and never have access to your funds.
              </p>
            </div>
          </section>

          {/* 9. Payment Initiation Services */}
          <section id="payment-services" className="mb-12">
            <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)', borderLeft: '4px solid var(--color-warning)' }}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-warning)' }}>
                ⚠️ 9. Payment Initiation Services
              </h2>
              <div className="space-y-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  9.1 Payment Service Provider Role
                </h3>
                <p>
                  When you use our payment initiation features, we act as a <strong>technical service provider</strong> that facilitates payment requests on your behalf. We do NOT:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Hold, store, or have access to your funds at any time</li>
                  <li>Act as a bank or financial institution</li>
                  <li>Guarantee successful payment processing</li>
                  <li>Control payment processing times or bank-side errors</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  9.2 Payment Authorization Process
                </h3>
                <p>
                  All payment initiations require your <strong>explicit authorization</strong>:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Each payment request is sent through regulated Open Banking providers (TrueLayer)</li>
                  <li>You must authorize each payment in your banking application using Strong Customer Authentication (SCA)</li>
                  <li>Payment confirmation in your banking app constitutes your final authorization</li>
                  <li>You can cancel or decline any payment request in your banking app</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  9.3 Audit Logging & Data Retention
                </h3>
                <p>
                  For security, compliance, and fraud prevention purposes, all payment initiation requests are logged. We record:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>User ID and account details</li>
                  <li>Timestamp of payment request</li>
                  <li>Payment amount and currency</li>
                  <li>Recipient details (name, account identifier)</li>
                  <li>Payment status (initiated, authorized, completed, failed, cancelled)</li>
                  <li>IP address and device information</li>
                </ul>
                <p className="mt-4">
                  Audit logs are retained for <strong>7 years</strong> in accordance with financial regulations and are accessible only to authorized personnel for compliance, security investigations, and dispute resolution.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  9.4 User Responsibilities
                </h3>
                <p>
                  When using payment initiation services, you are responsible for:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Verifying recipient details before authorizing payments</li>
                  <li>Ensuring sufficient funds are available in your account</li>
                  <li>Reviewing payment confirmations from your bank</li>
                  <li>Reporting unauthorized payment requests immediately</li>
                  <li>Maintaining the security of your banking app and authentication methods</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  9.5 No Liability for Bank Processing
                </h3>
                <p>
                  We are <strong>NOT responsible</strong> for:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Bank processing delays or failures</li>
                  <li>Insufficient funds or overdraft fees</li>
                  <li>Payment rejections by your bank or the recipient's bank</li>
                  <li>Errors in recipient account details you provided</li>
                  <li>Disputes between you and payment recipients</li>
                  <li>Fraud or unauthorized access to your banking app (beyond our platform)</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  9.6 Refunds and Disputes
                </h3>
                <p>
                  Payment refunds and disputes are handled by your bank and the recipient, not by Operate. If you need to request a refund or dispute a payment:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Contact your bank directly to initiate a dispute or chargeback (if applicable)</li>
                  <li>Contact the payment recipient to request a refund</li>
                  <li>We can provide payment records and audit logs to support your dispute</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  9.7 Regulatory Compliance
                </h3>
                <p>
                  Our payment initiation services are provided through regulated third-party providers (TrueLayer) in compliance with PSD2 (Payment Services Directive 2) and Open Banking regulations. We do not require a banking license as we do not hold customer funds or provide payment accounts.
                </p>
              </div>
            </div>
          </section>

          {/* 10. Email Integration & Processing */}
          <section id="email-processing" className="mb-12">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              10. Email Integration & Processing
            </h2>
            <div className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                10.1 Email Processing Consent
              </h3>
              <p>
                When you connect your email account to the Service, you consent to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Automated scanning of emails for invoice and document extraction</li>
                <li>Storage of extracted data (invoice details, amounts, vendor information, attachments)</li>
                <li>Processing of email metadata (sender, subject, date, attachments)</li>
                <li>AI-powered analysis of business-related emails to extract structured data</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                10.2 What We Store
              </h3>
              <p>
                We <strong>do NOT store full email content</strong>. We only store:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Extracted business data (invoice numbers, amounts, due dates, vendor details)</li>
                <li>Document attachments (PDFs, images) for invoices and receipts</li>
                <li>Email metadata (sender, subject, date) for reference</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                10.3 Legal Basis (GDPR)
              </h3>
              <p>
                This processing is conducted under <strong>GDPR Article 6(1)(b)</strong> - contract performance. Email processing is necessary to provide automated document extraction features that you have requested by connecting your email account.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                10.4 Your Control
              </h3>
              <p>
                You retain full control over email integration:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You can disconnect email integration at any time, which stops all processing immediately</li>
                <li>You can configure which folders or labels are scanned</li>
                <li>You can delete extracted data at any time</li>
                <li>You can request a full export of all extracted data</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                10.5 Security Measures
              </h3>
              <p>
                Email access is secured through:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>OAuth 2.0 authentication (we never store your email password)</li>
                <li>Encrypted connections (TLS/SSL)</li>
                <li>Least-privilege access (read-only permissions)</li>
                <li>Regular security audits and monitoring</li>
              </ul>
            </div>
          </section>

          {/* 11. Intellectual Property */}
          <section id="intellectual-property" className="mb-12">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              11. Intellectual Property
            </h2>
            <div className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                11.1 Operate's Intellectual Property
              </h3>
              <p>
                The Service and its entire contents, features, and functionality (including but not limited to all information, software, code, text, displays, graphics, photographs, video, audio, design, presentation, selection, and arrangement) are owned by Operate, its licensors, or other providers of such material and are protected by copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
              </p>
              <p>
                You are granted a limited, non-exclusive, non-transferable, non-sublicensable license to access and use the Service for your internal business purposes in accordance with these Terms. This license does not include any right to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Resell or make commercial use of the Service or its contents</li>
                <li>Collect or use any product listings, descriptions, or prices</li>
                <li>Make derivative uses of the Service or its contents</li>
                <li>Download or copy account information for the benefit of another merchant</li>
                <li>Use data mining, robots, or similar data gathering or extraction methods</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                11.2 User Content
              </h3>
              <p>
                You retain ownership of all content, data, and information you upload, submit, or store through the Service ("User Content"). By submitting User Content to the Service, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, process, adapt, publish, and display such User Content solely for the purpose of providing and improving the Service.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                11.3 Feedback
              </h3>
              <p>
                If you provide us with any feedback, suggestions, or ideas about the Service ("Feedback"), you grant us an unrestricted, perpetual, irrevocable, non-exclusive, fully-paid, royalty-free right to use, reproduce, modify, create derivative works from, and otherwise exploit the Feedback for any purpose without compensation or attribution to you.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                11.4 Trademarks
              </h3>
              <p>
                The Operate name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of Operate or its affiliates or licensors. You may not use such marks without our prior written permission. All other names, logos, product and service names, designs, and slogans on the Service are the trademarks of their respective owners.
              </p>
            </div>
          </section>

          {/* 12. Subscription & Billing */}
          <section id="billing" className="mb-12">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              12. Subscription & Billing
            </h2>
            <div className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                12.1 Subscription Plans
              </h3>
              <p>
                Operate offers various subscription plans with different features and pricing. By subscribing to a paid plan, you agree to pay the applicable subscription fees.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                12.2 Payment Terms
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Subscription fees are billed in advance on a recurring basis (monthly or annually, depending on your plan)</li>
                <li>All fees are exclusive of applicable taxes unless otherwise stated</li>
                <li>You authorize us to charge your payment method for all fees incurred</li>
                <li>You are responsible for providing accurate and current payment information</li>
                <li>We use Stripe as our payment processor; you agree to Stripe's terms and conditions</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                12.3 Automatic Renewal
              </h3>
              <p>
                Your subscription will automatically renew at the end of each billing period unless you cancel before the renewal date. You will be charged the then-current subscription fee for the renewal period.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                12.4 Cancellation
              </h3>
              <p>
                You may cancel your subscription at any time through your account settings. Cancellation will take effect at the end of the current billing period. You will continue to have access to the Service until the end of the paid period.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                12.5 Refunds
              </h3>
              <p>
                Subscription fees are non-refundable except as required by law or as expressly stated in these Terms. We do not provide refunds or credits for partial billing periods or unused features.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                12.6 Fee Changes
              </h3>
              <p>
                We reserve the right to change our subscription fees at any time. We will provide you with reasonable advance notice of any fee changes. If you do not agree to the fee changes, you may cancel your subscription before the changes take effect.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                12.7 Failed Payments
              </h3>
              <p>
                If a payment fails or is declined, we may:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Retry charging your payment method</li>
                <li>Suspend or downgrade your account until payment is received</li>
                <li>Terminate your subscription if payment is not received within a reasonable time</li>
              </ul>
            </div>
          </section>

          {/* 13. Limitation of Liability */}
          <section id="liability" className="mb-12">
            <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)', borderLeft: '4px solid var(--color-warning)' }}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-warning)' }}>
                ⚠️ 13. Limitation of Liability
              </h2>
              <div className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  13.1 Disclaimer of Warranties
                </h3>
                <p className="font-semibold">
                  THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
                </p>
                <p>
                  We do not warrant that:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>The Service will be uninterrupted, timely, secure, or error-free</li>
                  <li>The results obtained from using the Service will be accurate or reliable</li>
                  <li>The quality of the Service will meet your expectations</li>
                  <li>Any errors in the Service will be corrected</li>
                  <li>The Service is free from viruses or harmful components</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  13.2 Limitation of Liability
                </h3>
                <p className="font-semibold">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL OPERATE, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Loss of profits, revenue, data, or business opportunities</li>
                  <li>Business interruption or loss of use</li>
                  <li>Financial losses or damages</li>
                  <li>Tax penalties, interest, or additional taxes</li>
                  <li>Accounting errors or omissions</li>
                  <li>Incorrect financial reporting or analysis</li>
                  <li>Errors in AI-generated suggestions or advice</li>
                  <li>Failure to identify tax deductions or obligations</li>
                  <li>Data loss or corruption</li>
                  <li>Third-party service failures or errors</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  13.3 Maximum Liability Cap
                </h3>
                <p className="font-semibold">
                  IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL DAMAGES, LOSSES, AND CAUSES OF ACTION (WHETHER IN CONTRACT, TORT INCLUDING NEGLIGENCE, OR OTHERWISE) EXCEED THE AMOUNT YOU HAVE PAID TO US IN SUBSCRIPTION FEES DURING THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO LIABILITY, OR ONE HUNDRED EUROS (€100), WHICHEVER IS GREATER.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  13.4 No Liability for AI Errors
                </h3>
                <p className="font-semibold">
                  WE ARE NOT LIABLE FOR ANY ERRORS, INACCURACIES, OMISSIONS, OR CONSEQUENCES ARISING FROM THE USE OF OR RELIANCE ON AI-GENERATED CONTENT, SUGGESTIONS, OR RECOMMENDATIONS PROVIDED THROUGH THE SERVICE.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  13.5 No Liability for Financial Decisions
                </h3>
                <p className="font-semibold">
                  WE ARE NOT LIABLE FOR ANY FINANCIAL, TAX, ACCOUNTING, OR BUSINESS DECISIONS YOU MAKE BASED ON INFORMATION PROVIDED THROUGH THE SERVICE, INCLUDING BUT NOT LIMITED TO INVESTMENT LOSSES, TAX PENALTIES, MISSED DEDUCTIONS, OR BUSINESS LOSSES.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  13.6 Force Majeure
                </h3>
                <p>
                  We are not liable for any failure or delay in performance due to circumstances beyond our reasonable control, including but not limited to acts of God, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, pandemics, strikes, or shortages of transportation facilities, fuel, energy, labor, or materials.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  13.7 Jurisdictional Limitations
                </h3>
                <p>
                  Some jurisdictions do not allow the exclusion or limitation of certain warranties or liabilities. In such jurisdictions, our liability will be limited to the maximum extent permitted by law.
                </p>
              </div>
            </div>
          </section>

          {/* 14. Indemnification */}
          <section id="indemnification" className="mb-12">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              14. Indemnification
            </h2>
            <div className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
              <p>
                You agree to indemnify, defend, and hold harmless Operate, its officers, directors, employees, agents, affiliates, and partners from and against any and all claims, liabilities, damages, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising from or relating to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your use or misuse of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any rights of another party, including any third-party service providers</li>
                <li>Your User Content or any content you submit through the Service</li>
                <li>Any business, financial, tax, or accounting decisions you make</li>
                <li>Any tax filings or submissions you make using the Service</li>
                <li>Any financial transactions or payments processed through the Service</li>
                <li>Your negligence or willful misconduct</li>
                <li>Your violation of any applicable laws or regulations</li>
              </ul>
              <p>
                We reserve the right to assume the exclusive defense and control of any matter subject to indemnification by you, in which case you agree to cooperate with our defense of such claim.
              </p>
            </div>
          </section>

          {/* 15. Termination */}
          <section id="termination" className="mb-12">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              15. Termination
            </h2>
            <div className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                15.1 Termination by You
              </h3>
              <p>
                You may terminate your account at any time by canceling your subscription and deleting your account through your account settings or by contacting us. Upon cancellation, your subscription will remain active until the end of the current billing period.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                15.2 Termination by Us
              </h3>
              <p>
                We reserve the right to suspend or terminate your account and access to the Service at any time, with or without notice, for any reason, including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violation of these Terms</li>
                <li>Non-payment of fees</li>
                <li>Fraudulent, abusive, or illegal activity</li>
                <li>Repeated complaints from other users</li>
                <li>Interference with the proper functioning of the Service</li>
                <li>At our sole discretion, for any reason or no reason</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                15.3 Effect of Termination
              </h3>
              <p>
                Upon termination of your account:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your right to use the Service will immediately cease</li>
                <li>We may delete your account and all associated User Content</li>
                <li>You will not be entitled to any refund of fees already paid</li>
                <li>You remain responsible for all fees incurred prior to termination</li>
                <li>Sections of these Terms that by their nature should survive termination will survive, including but not limited to disclaimers, limitations of liability, and indemnification</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                15.4 Data Export
              </h3>
              <p>
                Prior to termination, you are responsible for exporting any User Content you wish to retain. After termination, we have no obligation to maintain or provide access to your User Content.
              </p>
            </div>
          </section>

          {/* 16. Dispute Resolution */}
          <section id="disputes" className="mb-12">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              16. Dispute Resolution
            </h2>
            <div className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                16.1 Governing Law
              </h3>
              <p>
                These Terms and any disputes arising out of or related to these Terms or the Service shall be governed by and construed in accordance with the laws of the Federal Republic of Germany, without regard to its conflict of law principles.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                16.2 Jurisdiction and Venue
              </h3>
              <p>
                Any legal action or proceeding arising out of or relating to these Terms or the Service shall be brought exclusively in the courts located in Germany. You consent to the personal jurisdiction of such courts and waive any objection to venue in such courts.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                16.3 Informal Resolution
              </h3>
              <p>
                Before filing any formal legal action, you agree to first contact us and attempt to resolve the dispute informally. We will attempt to resolve the dispute through good-faith negotiations.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                16.4 Arbitration
              </h3>
              <p>
                If informal resolution is unsuccessful, any dispute, controversy, or claim arising out of or relating to these Terms or the Service (including the existence, validity, or termination thereof) shall be resolved through binding arbitration in accordance with the arbitration rules of the German Arbitration Institute (DIS), before a single arbitrator appointed in accordance with such rules. The place of arbitration shall be Germany. The language of the arbitration shall be English or German, as mutually agreed.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                16.5 Class Action Waiver
              </h3>
              <p>
                You agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action. You waive your right to participate in a class action lawsuit or class-wide arbitration.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                16.6 Exceptions
              </h3>
              <p>
                Notwithstanding the arbitration provision, either party may seek injunctive or other equitable relief in any court of competent jurisdiction to prevent the actual or threatened infringement, misappropriation, or violation of intellectual property rights.
              </p>
            </div>
          </section>

          {/* 17. Changes to Terms */}
          <section id="changes" className="mb-12">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              17. Changes to Terms
            </h2>
            <div className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                17.1 Right to Modify
              </h3>
              <p>
                We reserve the right to modify or update these Terms at any time at our sole discretion. When we make material changes to these Terms, we will:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Update the "Last Updated" date at the top of these Terms</li>
                <li>Notify you by email at the address associated with your account</li>
                <li>Display a notice on the Service</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                17.2 Acceptance of Changes
              </h3>
              <p>
                Your continued use of the Service after the effective date of any changes to these Terms constitutes your acceptance of the modified Terms. If you do not agree to the modified Terms, you must discontinue use of the Service and cancel your account.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                17.3 Review Responsibility
              </h3>
              <p>
                It is your responsibility to review these Terms periodically for changes. We recommend checking this page regularly to stay informed of any updates.
              </p>
            </div>
          </section>

          {/* 18. Contact */}
          <section id="contact" className="mb-12">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              18. Contact Information
            </h2>
            <div className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
              <p>
                If you have any questions, concerns, or complaints about these Terms or the Service, please contact us at:
              </p>
              <div className="rounded-lg p-6 my-4" style={{ backgroundColor: 'var(--color-surface)' }}>
                <p className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Operate</p>
                <p>Email: <a href="mailto:support@operate.guru" className="hover:opacity-80" style={{ color: 'var(--color-primary)' }}>support@operate.guru</a></p>
                <p>Website: <a href="https://operate.guru" className="hover:opacity-80" style={{ color: 'var(--color-primary)' }}>https://operate.guru</a></p>
              </div>
              <p>
                We will make reasonable efforts to respond to your inquiry within a reasonable timeframe.
              </p>
            </div>
          </section>

          {/* Miscellaneous */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              17. Miscellaneous
            </h2>
            <div className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                17.1 Entire Agreement
              </h3>
              <p>
                These Terms, together with our Privacy Policy and any other legal notices or policies published by us on the Service, constitute the entire agreement between you and Operate regarding the Service and supersede all prior or contemporaneous communications and proposals.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                17.2 Severability
              </h3>
              <p>
                If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining provisions will continue in full force and effect. The invalid, illegal, or unenforceable provision will be replaced with a valid, legal, and enforceable provision that most closely reflects the original intent.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                17.3 Waiver
              </h3>
              <p>
                Our failure to enforce any right or provision of these Terms will not be deemed a waiver of such right or provision. Any waiver of any provision of these Terms will be effective only if in writing and signed by us.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                17.4 Assignment
              </h3>
              <p>
                You may not assign or transfer these Terms or your rights and obligations under these Terms without our prior written consent. We may assign or transfer these Terms or our rights and obligations under these Terms without your consent. Any attempted assignment in violation of this section is void.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                17.5 No Third-Party Beneficiaries
              </h3>
              <p>
                These Terms do not create any third-party beneficiary rights. No third party may enforce any provision of these Terms.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                17.6 Headings
              </h3>
              <p>
                The headings in these Terms are for convenience only and have no legal or contractual effect.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                17.7 Language
              </h3>
              <p>
                These Terms are written in English. Any translations are provided for convenience only. In the event of any conflict between the English version and a translated version, the English version shall prevail.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                17.8 Electronic Communications
              </h3>
              <p>
                By using the Service, you consent to receive electronic communications from us. These communications may include notices about your account and information concerning or related to the Service. You agree that any notices, agreements, disclosures, or other communications that we send to you electronically will satisfy any legal communication requirements, including that such communications be in writing.
              </p>
            </div>
          </section>

          {/* Acceptance Statement */}
          <section className="rounded-lg p-6 mb-12" style={{ backgroundColor: 'var(--color-surface)' }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Acknowledgment
            </h2>
            <p className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              BY USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE, UNDERSTAND THEM, AND AGREE TO BE BOUND BY THEM. IF YOU DO NOT AGREE TO THESE TERMS, YOU MUST NOT ACCESS OR USE THE SERVICE.
            </p>
            <p className="font-medium mt-4" style={{ color: 'var(--color-text-secondary)' }}>
              YOU SPECIFICALLY ACKNOWLEDGE AND AGREE THAT:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2" style={{ color: 'var(--color-text-secondary)' }}>
              <li>THE AI ASSISTANT DOES NOT PROVIDE PROFESSIONAL ADVICE</li>
              <li>YOU ARE SOLELY RESPONSIBLE FOR ALL BUSINESS, FINANCIAL, AND TAX DECISIONS</li>
              <li>YOU SHOULD CONSULT QUALIFIED PROFESSIONALS FOR IMPORTANT MATTERS</li>
              <li>WE HAVE LIMITED LIABILITY AS DESCRIBED IN THESE TERMS</li>
            </ul>
          </section>

          {/* Footer */}
          <div className="text-center text-sm pt-8" style={{ color: 'var(--color-text-secondary)', borderTop: '1px solid var(--color-border)' }}>
            <p>Last updated: {lastUpdated}</p>
            <p className="mt-2">
              <Link href="/privacy" className="hover:opacity-80" style={{ color: 'var(--color-primary)' }}>
                Privacy Policy
              </Link>
              {' · '}
              <Link href="/" className="hover:opacity-80" style={{ color: 'var(--color-primary)' }}>
                Back to Home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
