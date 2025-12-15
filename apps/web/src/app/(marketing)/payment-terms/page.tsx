import Link from 'next/link';

export const metadata = {
  title: 'Payment Services Terms | Operate',
  description: 'Payment Initiation Services terms and conditions for Operate',
};

export default function PaymentTermsPage() {
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
            Payment Services Terms
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Introduction */}
          <section className="mb-12">
            <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)', borderLeft: '4px solid var(--color-primary)' }}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                Payment Initiation Services
              </h2>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                These Payment Services Terms supplement our main <Link href="/terms" className="underline" style={{ color: 'var(--color-primary)' }}>Terms of Service</Link> and apply specifically to payment initiation features offered through Operate.
              </p>
            </div>
          </section>

          {/* 1. Overview */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              1. What is Payment Initiation?
            </h2>
            <div className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
              <p>
                Payment initiation is a service that allows you to make payments directly from your bank account through Operate, without manually logging into your online banking portal. This service is made possible by <strong>Open Banking</strong> and <strong>PSD2 regulations</strong> (Payment Services Directive 2) in the European Union and UK.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                How it Works
              </h3>
              <ol className="list-decimal pl-6 space-y-2">
                <li>You select a payment to make (e.g., pay an invoice) in Operate</li>
                <li>Operate sends a payment request to our regulated provider (TrueLayer)</li>
                <li>You are redirected to your bank's secure authentication page</li>
                <li>You authorize the payment using Strong Customer Authentication (SCA) - typically Face ID, fingerprint, or SMS code</li>
                <li>Your bank processes the payment directly</li>
                <li>Operate receives confirmation of the payment status</li>
              </ol>

              <div className="rounded-lg p-4 mt-4" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                <p className="font-semibold">
                  Important: We never see your banking credentials or have access to your funds. We only facilitate the request - YOUR bank executes the payment after YOU authorize it.
                </p>
              </div>
            </div>
          </section>

          {/* 2. PSD2 & Open Banking */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              2. PSD2 & Open Banking Compliance
            </h2>
            <div className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
              <p>
                Our payment services comply with:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>PSD2 (Payment Services Directive 2)</strong> - EU regulation requiring Strong Customer Authentication</li>
                <li><strong>Open Banking Standards</strong> - Secure API access to banking services</li>
                <li><strong>GDPR</strong> - Data protection and privacy regulations</li>
                <li><strong>Local banking regulations</strong> in the UK, EU, and other jurisdictions</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                Our Regulated Provider
              </h3>
              <p>
                We partner with <strong>TrueLayer</strong>, a regulated Payment Initiation Service Provider (PISP) authorized by the Financial Conduct Authority (FCA) in the UK. TrueLayer holds the necessary licenses to facilitate payment initiation across European banks.
              </p>
            </div>
          </section>

          {/* 3. User Responsibilities */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              3. Your Responsibilities
            </h2>
            <div className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                Before Authorizing a Payment
              </h3>
              <p>
                You are responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Verifying the recipient name and account details are correct</li>
                <li>Checking the payment amount and currency</li>
                <li>Ensuring you have sufficient funds in your account</li>
                <li>Confirming the payment reference/description</li>
                <li>Reading all details in your bank's authorization screen</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                Account Security
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Keep your banking app and authentication methods secure</li>
                <li>Never share your banking credentials with anyone</li>
                <li>Report suspicious payment requests immediately</li>
                <li>Review your bank statements regularly</li>
              </ul>
            </div>
          </section>

          {/* 4. Processing Times */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              4. Payment Processing Times
            </h2>
            <div className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
              <p>
                Payment processing times depend on your bank and the recipient's bank:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Domestic payments:</strong> Usually processed within minutes to a few hours</li>
                <li><strong>SEPA transfers:</strong> 1-2 business days</li>
                <li><strong>International payments:</strong> 2-5 business days (depending on banks and countries)</li>
              </ul>
              <p className="mt-4">
                <strong>Note:</strong> We cannot guarantee processing times as these are determined by the banks involved, not by Operate.
              </p>
            </div>
          </section>

          {/* 5. Refunds & Disputes */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              5. Refunds and Disputes
            </h2>
            <div className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                Payment Disputes
              </h3>
              <p>
                Once you authorize a payment in your banking app, the payment is processed by your bank. Operate <strong>cannot reverse, cancel, or modify</strong> payments after authorization.
              </p>
              <p>
                If you need to dispute a payment or request a refund:
              </p>
              <ol className="list-decimal pl-6 space-y-2">
                <li><strong>Contact the payment recipient</strong> directly to request a refund</li>
                <li><strong>Contact your bank</strong> if you believe the payment was unauthorized or fraudulent</li>
                <li><strong>Contact Operate support</strong> - we can provide payment records and audit logs to support your case</li>
              </ol>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                Unauthorized Payments
              </h3>
              <p>
                If you believe a payment was initiated without your authorization:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Report it to your bank immediately (within 13 months under PSD2 regulations)</li>
                <li>Contact Operate support at support@operate.guru</li>
                <li>Your bank will investigate and may refund you if the payment was genuinely unauthorized</li>
              </ul>
            </div>
          </section>

          {/* 6. Data & Audit Logs */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              6. Data Retention & Audit Logs
            </h2>
            <div className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
              <p>
                For compliance, security, and fraud prevention, we log all payment initiation requests:
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                Information We Record
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>User ID and account details</li>
                <li>Timestamp of payment request</li>
                <li>Payment amount and currency</li>
                <li>Recipient details (name, account identifier)</li>
                <li>Payment status (initiated, authorized, completed, failed, cancelled)</li>
                <li>IP address and device information</li>
                <li>Bank response codes and error messages</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                Retention Period
              </h3>
              <p>
                Payment audit logs are retained for <strong>7 years</strong> in accordance with financial regulations. This data is:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Stored securely with encryption</li>
                <li>Accessible only to authorized personnel</li>
                <li>Used for compliance, security investigations, and dispute resolution</li>
                <li>Subject to GDPR and data protection regulations</li>
              </ul>
            </div>
          </section>

          {/* 7. Security Measures */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              7. Security Measures
            </h2>
            <div className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
              <p>
                We implement multiple security layers to protect payment initiation:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Strong Customer Authentication (SCA):</strong> All payments require bank-level authentication (Face ID, fingerprint, SMS code)</li>
                <li><strong>End-to-end encryption:</strong> All communication with banks is encrypted using TLS 1.2+</li>
                <li><strong>No credential storage:</strong> We never see or store your banking credentials</li>
                <li><strong>OAuth 2.0:</strong> Secure authorization without password sharing</li>
                <li><strong>Fraud monitoring:</strong> Unusual payment patterns trigger additional security checks</li>
                <li><strong>Audit logging:</strong> All payment requests are logged for security review</li>
              </ul>
            </div>
          </section>

          {/* 8. Limitations & Disclaimers */}
          <section className="mb-12">
            <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)', borderLeft: '4px solid var(--color-error)' }}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-error)' }}>
                8. Limitations & Disclaimers
              </h2>
              <div className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  What We Do NOT Do
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Hold, store, or have access to your funds</li>
                  <li>Act as a bank or financial institution</li>
                  <li>Guarantee successful payment processing</li>
                  <li>Control payment processing times</li>
                  <li>Authorize payments (only YOU can authorize via your bank)</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  What We Are NOT Responsible For
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Bank processing delays or failures</li>
                  <li>Insufficient funds or overdraft fees</li>
                  <li>Payment rejections by banks</li>
                  <li>Errors in recipient details you provided</li>
                  <li>Disputes between you and payment recipients</li>
                  <li>Currency conversion fees charged by banks</li>
                  <li>Bank downtime or maintenance</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 9. Contact */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              9. Questions or Support
            </h2>
            <div className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
              <p>
                If you have questions about payment services or need support:
              </p>
              <div className="rounded-lg p-6 my-4" style={{ backgroundColor: 'var(--color-surface)' }}>
                <p className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Operate Support</p>
                <p>Email: <a href="mailto:support@operate.guru" className="hover:opacity-80" style={{ color: 'var(--color-primary)' }}>support@operate.guru</a></p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center text-sm pt-8" style={{ color: 'var(--color-text-secondary)', borderTop: '1px solid var(--color-border)' }}>
          <p>Last updated: {lastUpdated}</p>
          <p className="mt-2">
            <Link href="/terms" className="hover:opacity-80" style={{ color: 'var(--color-primary)' }}>
              Main Terms of Service
            </Link>
            {' · '}
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
  );
}
