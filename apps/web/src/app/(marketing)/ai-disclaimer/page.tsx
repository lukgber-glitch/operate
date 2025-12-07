import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Disclaimer - Operate',
  description: 'Important disclaimers about AI-generated content and advice in Operate.',
};

export default function AIDisclaimerPage() {
  return (
    <div className="min-h-screen py-16 px-4" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div
            className="p-6 rounded-[var(--radius-lg)] mb-6"
            style={{ backgroundColor: 'var(--color-error-bg)', borderLeft: '6px solid var(--color-error)' }}
          >
            <h1
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ color: 'var(--color-error)' }}
            >
              ⚠️ AI Disclaimer
            </h1>
            <p
              className="text-xl font-semibold"
              style={{ color: 'var(--color-error)' }}
            >
              CRITICAL: Please read this disclaimer carefully before using AI features
            </p>
          </div>
          <p
            className="text-lg"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Last updated: December 7, 2025
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8" style={{ color: 'var(--color-text-primary)' }}>
          {/* Main Disclaimer */}
          <section>
            <div
              className="p-8 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-warning-bg)', borderLeft: '6px solid var(--color-warning)' }}
            >
              <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-warning)' }}>
                IMPORTANT NOTICE
              </h2>
              <p className="text-lg mb-4" style={{ color: 'var(--color-text-primary)' }}>
                The AI assistant in Operate is a tool designed to help organize and manage your business
                information. It is <strong>NOT</strong> a substitute for professional advice from licensed
                professionals. All suggestions, recommendations, and outputs are <strong>INFORMATIONAL ONLY</strong>.
              </p>
            </div>
          </section>

          {/* Not Professional Services */}
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Not Professional Services</h2>

            <div className="space-y-4">
              <div
                className="p-6 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-error-bg)', borderLeft: '4px solid var(--color-error)' }}
              >
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-error)' }}>
                  ❌ NOT Financial Advice
                </h3>
                <ul className="list-disc pl-6 space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
                  <li>The AI is not a licensed financial advisor or planner</li>
                  <li>It cannot provide investment advice or recommendations</li>
                  <li>It cannot advise on financial strategies or portfolio management</li>
                  <li>Consult a licensed financial advisor for financial decisions</li>
                </ul>
              </div>

              <div
                className="p-6 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-error-bg)', borderLeft: '4px solid var(--color-error)' }}
              >
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-error)' }}>
                  ❌ NOT Tax Advice
                </h3>
                <ul className="list-disc pl-6 space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
                  <li>The AI is not a tax professional, CPA, or tax attorney</li>
                  <li>It cannot provide tax advice or tax planning strategies</li>
                  <li>Tax laws are complex and vary by jurisdiction</li>
                  <li>Always consult a licensed tax professional for tax matters</li>
                  <li>You are solely responsible for the accuracy of your tax filings</li>
                </ul>
              </div>

              <div
                className="p-6 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-error-bg)', borderLeft: '4px solid var(--color-error)' }}
              >
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-error)' }}>
                  ❌ NOT Legal Advice
                </h3>
                <ul className="list-disc pl-6 space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
                  <li>The AI is not a licensed attorney or legal professional</li>
                  <li>It cannot provide legal advice or interpret laws</li>
                  <li>It cannot advise on contracts, compliance, or legal disputes</li>
                  <li>Consult a licensed attorney for legal matters</li>
                </ul>
              </div>

              <div
                className="p-6 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-error-bg)', borderLeft: '4px solid var(--color-error)' }}
              >
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-error)' }}>
                  ❌ NOT Accounting Advice
                </h3>
                <ul className="list-disc pl-6 space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
                  <li>The AI is not a certified public accountant (CPA)</li>
                  <li>It cannot provide professional accounting services</li>
                  <li>It cannot audit your books or certify financial statements</li>
                  <li>Consult a licensed accountant for accounting needs</li>
                </ul>
              </div>
            </div>
          </section>

          {/* What AI Can Do */}
          <section>
            <h2 className="text-2xl font-bold mb-4">2. What the AI Assistant Can Do</h2>
            <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Our AI assistant is designed to help with:
            </p>
            <div
              className="p-6 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <ul className="list-disc pl-6 space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
                <li>
                  <strong>Information Organization:</strong> Categorizing transactions, invoices, and expenses
                </li>
                <li>
                  <strong>Data Entry Assistance:</strong> Helping you input and organize your financial data
                </li>
                <li>
                  <strong>Report Generation:</strong> Creating summaries and reports from your data
                </li>
                <li>
                  <strong>Task Suggestions:</strong> Recommending next steps based on your data patterns
                </li>
                <li>
                  <strong>Document Parsing:</strong> Extracting information from invoices and receipts
                </li>
                <li>
                  <strong>General Information:</strong> Providing general educational information (not advice)
                </li>
              </ul>
            </div>
          </section>

          {/* AI Limitations */}
          <section>
            <h2 className="text-2xl font-bold mb-4">3. AI Limitations and Errors</h2>
            <div
              className="p-6 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-warning-bg)', borderLeft: '4px solid var(--color-warning)' }}
            >
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-warning)' }}>
                The AI Can Make Mistakes
              </h3>
              <ul className="list-disc pl-6 space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
                <li>AI systems can produce incorrect, incomplete, or nonsensical outputs</li>
                <li>The AI may misinterpret your questions or data</li>
                <li>Transaction classifications may be inaccurate</li>
                <li>Calculations or summaries may contain errors</li>
                <li>The AI may not be aware of recent law or regulation changes</li>
                <li>Context may be lost in complex conversations</li>
              </ul>
            </div>

            <div
              className="p-6 rounded-[var(--radius-lg)] mt-4"
              style={{ backgroundColor: 'var(--color-error-bg)', borderLeft: '4px solid var(--color-error)' }}
            >
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-error)' }}>
                YOU MUST VERIFY ALL AI OUTPUTS
              </h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                <strong>Always review and verify</strong> AI-generated content before using it for any
                business purpose, especially for tax filings, financial reports, or legal documents.
                Do not blindly trust or rely on AI outputs.
              </p>
            </div>
          </section>

          {/* User Responsibility */}
          <section>
            <h2 className="text-2xl font-bold mb-4">4. Your Responsibility</h2>
            <div
              className="p-6 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <h3 className="text-xl font-semibold mb-3">You Are Responsible For:</h3>
              <ul className="list-disc pl-6 space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
                <li>
                  <strong>Data Accuracy:</strong> Ensuring all data you input is accurate and complete
                </li>
                <li>
                  <strong>Verification:</strong> Reviewing and verifying all AI suggestions and outputs
                </li>
                <li>
                  <strong>Professional Consultation:</strong> Seeking advice from licensed professionals
                  when needed
                </li>
                <li>
                  <strong>Compliance:</strong> Ensuring compliance with all applicable laws and regulations
                </li>
                <li>
                  <strong>Tax Filing:</strong> The accuracy and completeness of your tax returns
                </li>
                <li>
                  <strong>Financial Decisions:</strong> All business and financial decisions you make
                </li>
                <li>
                  <strong>Legal Obligations:</strong> Meeting all legal and regulatory requirements
                </li>
              </ul>
            </div>
          </section>

          {/* No Liability */}
          <section>
            <h2 className="text-2xl font-bold mb-4">5. Limitation of Liability</h2>
            <div
              className="p-8 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-error-bg)', borderLeft: '6px solid var(--color-error)' }}
            >
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-error)' }}>
                WE DISCLAIM ALL LIABILITY
              </h3>
              <p className="text-lg mb-4" style={{ color: 'var(--color-text-primary)' }}>
                <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2 text-lg" style={{ color: 'var(--color-text-primary)' }}>
                <li>We are NOT liable for any errors or omissions in AI outputs</li>
                <li>We are NOT liable for financial losses resulting from AI suggestions</li>
                <li>We are NOT liable for tax penalties or legal issues arising from AI use</li>
                <li>We are NOT liable for decisions you make based on AI outputs</li>
                <li>We provide the AI "AS IS" without warranties of any kind</li>
              </ul>
              <p className="text-lg mt-4" style={{ color: 'var(--color-text-primary)' }}>
                You assume <strong>ALL RISK</strong> associated with using AI features.
              </p>
            </div>
          </section>

          {/* Professional Advice */}
          <section>
            <h2 className="text-2xl font-bold mb-4">6. When to Seek Professional Advice</h2>
            <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              You should <strong>ALWAYS</strong> consult with licensed professionals for:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div
                className="p-4 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <h4 className="font-semibold mb-2">Financial Matters</h4>
                <ul className="list-disc pl-6 space-y-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  <li>Investment decisions</li>
                  <li>Retirement planning</li>
                  <li>Business valuation</li>
                  <li>Financial strategies</li>
                </ul>
              </div>

              <div
                className="p-4 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <h4 className="font-semibold mb-2">Tax Matters</h4>
                <ul className="list-disc pl-6 space-y-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  <li>Tax planning</li>
                  <li>Tax return preparation</li>
                  <li>Tax disputes</li>
                  <li>Deduction eligibility</li>
                </ul>
              </div>

              <div
                className="p-4 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <h4 className="font-semibold mb-2">Legal Matters</h4>
                <ul className="list-disc pl-6 space-y-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  <li>Contract review</li>
                  <li>Business formation</li>
                  <li>Compliance issues</li>
                  <li>Legal disputes</li>
                </ul>
              </div>

              <div
                className="p-4 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <h4 className="font-semibold mb-2">Accounting Matters</h4>
                <ul className="list-disc pl-6 space-y-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  <li>Financial audits</li>
                  <li>Bookkeeping setup</li>
                  <li>Financial statements</li>
                  <li>Accounting methods</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Acknowledgment */}
          <section>
            <div
              className="p-8 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
            >
              <h2 className="text-2xl font-bold mb-4">7. Your Acknowledgment</h2>
              <p className="text-lg">
                By using the AI features in Operate, you acknowledge that:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4 text-lg">
                <li>You have read and understood this disclaimer</li>
                <li>The AI does not provide professional advice</li>
                <li>You will verify all AI outputs before use</li>
                <li>You will consult licensed professionals when appropriate</li>
                <li>You assume all responsibility and risk for your use of AI features</li>
                <li>We are not liable for any consequences of AI use</li>
              </ul>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold mb-4">8. Questions or Concerns</h2>
            <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              If you have questions about AI features or this disclaimer:
            </p>
            <div
              className="p-6 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Email: <a href="mailto:support@operate.guru" className="underline" style={{ color: 'var(--color-primary)' }}>support@operate.guru</a>
              </p>
            </div>
          </section>
        </div>

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-lg)] font-semibold transition-all hover:scale-105"
            style={{
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
            }}
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
