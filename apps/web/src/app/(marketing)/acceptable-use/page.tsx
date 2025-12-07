import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Acceptable Use Policy - Operate',
  description: 'Guidelines for acceptable use of the Operate platform.',
};

export default function AcceptableUsePolicyPage() {
  return (
    <div className="min-h-screen py-16 px-4" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Acceptable Use Policy
          </h1>
          <p
            className="text-lg"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Last updated: December 7, 2025
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8" style={{ color: 'var(--color-text-primary)' }}>
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              This Acceptable Use Policy ("Policy") governs your use of Operate's services. By accessing
              or using our services, you agree to comply with this Policy. Violation of this Policy may
              result in suspension or termination of your account.
            </p>
          </section>

          {/* Permitted Uses */}
          <section>
            <h2 className="text-2xl font-bold mb-4">2. Permitted Uses</h2>
            <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              You may use Operate for lawful business purposes, including:
            </p>
            <div className="space-y-3">
              <div
                className="p-4 rounded-[var(--radius-lg)] flex items-start gap-3"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <span className="text-2xl">✓</span>
                <div>
                  <strong>Financial Management:</strong>
                  <p style={{ color: 'var(--color-text-secondary)' }}>
                    Managing invoices, expenses, and financial records for legitimate business activities
                  </p>
                </div>
              </div>

              <div
                className="p-4 rounded-[var(--radius-lg)] flex items-start gap-3"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <span className="text-2xl">✓</span>
                <div>
                  <strong>Banking Integration:</strong>
                  <p style={{ color: 'var(--color-text-secondary)' }}>
                    Connecting legitimate bank accounts for transaction tracking and reconciliation
                  </p>
                </div>
              </div>

              <div
                className="p-4 rounded-[var(--radius-lg)] flex items-start gap-3"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <span className="text-2xl">✓</span>
                <div>
                  <strong>Tax Compliance:</strong>
                  <p style={{ color: 'var(--color-text-secondary)' }}>
                    Using our tools to assist with legitimate tax preparation and filing
                  </p>
                </div>
              </div>

              <div
                className="p-4 rounded-[var(--radius-lg)] flex items-start gap-3"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <span className="text-2xl">✓</span>
                <div>
                  <strong>Business Reporting:</strong>
                  <p style={{ color: 'var(--color-text-secondary)' }}>
                    Generating reports and analytics for legitimate business decision-making
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Prohibited Activities */}
          <section>
            <h2 className="text-2xl font-bold mb-4">3. Prohibited Activities</h2>
            <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              You must not use Operate for any illegal or unauthorized purpose. Prohibited activities include:
            </p>

            <div className="space-y-4">
              <div
                className="p-6 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-error-bg)', borderLeft: '4px solid var(--color-error)' }}
              >
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-error)' }}>
                  3.1 Fraud and Money Laundering
                </h3>
                <ul className="list-disc pl-6 space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
                  <li>Creating false or fraudulent invoices</li>
                  <li>Attempting to launder money or hide the source of funds</li>
                  <li>Processing transactions for illegal goods or services</li>
                  <li>Tax evasion or filing false tax returns</li>
                  <li>Identity theft or impersonation</li>
                </ul>
              </div>

              <div
                className="p-6 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-error-bg)', borderLeft: '4px solid var(--color-error)' }}
              >
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-error)' }}>
                  3.2 Illegal Business Activities
                </h3>
                <ul className="list-disc pl-6 space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
                  <li>Managing finances for illegal businesses or activities</li>
                  <li>Processing payments for prohibited goods or services</li>
                  <li>Facilitating pyramid schemes or multi-level marketing scams</li>
                  <li>Supporting terrorism or sanctioned entities</li>
                </ul>
              </div>

              <div
                className="p-6 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-error-bg)', borderLeft: '4px solid var(--color-error)' }}
              >
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-error)' }}>
                  3.3 System Abuse
                </h3>
                <ul className="list-disc pl-6 space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
                  <li>Attempting to hack, breach, or circumvent security measures</li>
                  <li>Uploading viruses, malware, or malicious code</li>
                  <li>Scraping data without authorization</li>
                  <li>Overloading or disrupting our systems (DDoS attacks)</li>
                  <li>Reverse engineering our software</li>
                </ul>
              </div>

              <div
                className="p-6 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-error-bg)', borderLeft: '4px solid var(--color-error)' }}
              >
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-error)' }}>
                  3.4 Misrepresentation
                </h3>
                <ul className="list-disc pl-6 space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
                  <li>Providing false information during registration</li>
                  <li>Impersonating another person or entity</li>
                  <li>Creating fake or misleading financial records</li>
                  <li>Misrepresenting your relationship with us</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Account Sharing */}
          <section>
            <h2 className="text-2xl font-bold mb-4">4. Account Sharing and Access</h2>
            <div
              className="p-6 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <h3 className="text-xl font-semibold mb-3">Account Security Rules</h3>
              <ul className="list-disc pl-6 space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
                <li>You are responsible for maintaining the security of your account credentials</li>
                <li>You must not share your login credentials with unauthorized individuals</li>
                <li>Use team member features for multiple users (not credential sharing)</li>
                <li>Notify us immediately if you suspect unauthorized access</li>
                <li>You are responsible for all activities under your account</li>
              </ul>
            </div>
          </section>

          {/* Data Accuracy */}
          <section>
            <h2 className="text-2xl font-bold mb-4">5. Data Accuracy Requirements</h2>
            <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              You agree to:
            </p>
            <div
              className="p-6 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <ul className="list-disc pl-6 space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
                <li>Provide accurate and truthful information when using our services</li>
                <li>Maintain accurate financial records within the platform</li>
                <li>Not intentionally input false or misleading data</li>
                <li>Update information promptly when it changes</li>
                <li>Verify AI-generated content for accuracy before use</li>
              </ul>
            </div>

            <div
              className="p-6 rounded-[var(--radius-lg)] mt-4"
              style={{ backgroundColor: 'var(--color-warning-bg)', borderLeft: '4px solid var(--color-warning)' }}
            >
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-warning)' }}>
                Important
              </h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                While our AI can assist with financial tasks, you remain solely responsible for the
                accuracy of all data and compliance with applicable laws and regulations.
              </p>
            </div>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold mb-4">6. Intellectual Property</h2>
            <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              You must not:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
              <li>Copy, modify, or distribute our software or documentation</li>
              <li>Use our trademarks or branding without permission</li>
              <li>Remove or alter copyright notices or proprietary markings</li>
              <li>Create derivative works based on our services</li>
            </ul>
          </section>

          {/* Consequences */}
          <section>
            <h2 className="text-2xl font-bold mb-4">7. Consequences of Violations</h2>
            <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Violation of this Policy may result in:
            </p>
            <div className="space-y-3">
              <div
                className="p-4 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <strong>Warning:</strong>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  First-time minor violations may result in a warning and opportunity to correct
                </p>
              </div>

              <div
                className="p-4 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <strong>Suspension:</strong>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Temporary suspension of your account and services
                </p>
              </div>

              <div
                className="p-4 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <strong>Termination:</strong>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Permanent termination of your account without refund
                </p>
              </div>

              <div
                className="p-4 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <strong>Legal Action:</strong>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  We may report illegal activities to law enforcement and pursue legal remedies
                </p>
              </div>
            </div>
          </section>

          {/* Reporting */}
          <section>
            <h2 className="text-2xl font-bold mb-4">8. Reporting Violations</h2>
            <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              If you become aware of any violation of this Policy, please report it immediately:
            </p>
            <div
              className="p-6 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <p className="mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Email: <a href="mailto:abuse@operate.guru" className="underline" style={{ color: 'var(--color-primary)' }}>abuse@operate.guru</a>
              </p>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Please include relevant details such as user account, date/time, and nature of the violation.
              </p>
            </div>
          </section>

          {/* Updates */}
          <section>
            <h2 className="text-2xl font-bold mb-4">9. Changes to This Policy</h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              We reserve the right to modify this Policy at any time. Changes will be effective immediately
              upon posting. Your continued use of our services after changes constitutes acceptance of the
              updated Policy.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold mb-4">10. Contact Us</h2>
            <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Questions about this Policy? Contact us at:
            </p>
            <div
              className="p-6 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Email: <a href="mailto:legal@operate.guru" className="underline" style={{ color: 'var(--color-primary)' }}>legal@operate.guru</a>
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
