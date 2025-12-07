import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy - Operate',
  description: 'Learn about how Operate uses cookies and similar technologies.',
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen py-16 px-4" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Cookie Policy
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
              This Cookie Policy explains how Operate ("we", "us", or "our") uses cookies and similar
              technologies on our website and services. By using our services, you consent to the use
              of cookies as described in this policy.
            </p>
          </section>

          {/* What Are Cookies */}
          <section>
            <h2 className="text-2xl font-bold mb-4">2. What Are Cookies?</h2>
            <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Cookies are small text files that are placed on your computer or mobile device when you
              visit a website. They are widely used to make websites work more efficiently and provide
              information to the site owners.
            </p>
            <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Cookies can be "persistent" or "session" cookies:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
              <li>
                <strong>Session cookies:</strong> Temporary cookies that expire when you close your browser
              </li>
              <li>
                <strong>Persistent cookies:</strong> Cookies that remain on your device for a set period
                or until you delete them
              </li>
            </ul>
          </section>

          {/* Types of Cookies We Use */}
          <section>
            <h2 className="text-2xl font-bold mb-4">3. Types of Cookies We Use</h2>

            <div className="space-y-4">
              <div
                className="p-6 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <h3 className="text-xl font-semibold mb-2">3.1 Essential Cookies</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  These cookies are necessary for the website to function properly. They enable core
                  functionality such as security, authentication, and session management. The website
                  cannot function properly without these cookies.
                </p>
              </div>

              <div
                className="p-6 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <h3 className="text-xl font-semibold mb-2">3.2 Analytics Cookies</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  These cookies help us understand how visitors interact with our website by collecting
                  and reporting information anonymously. This helps us improve our services and user experience.
                </p>
              </div>

              <div
                className="p-6 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <h3 className="text-xl font-semibold mb-2">3.3 Preference Cookies</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  These cookies allow the website to remember choices you make (such as your language
                  preference or region) and provide enhanced, more personalized features.
                </p>
              </div>
            </div>
          </section>

          {/* Third-Party Cookies */}
          <section>
            <h2 className="text-2xl font-bold mb-4">4. Third-Party Cookies</h2>
            <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              We use services from third-party providers that may set their own cookies. These include:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
              <li>
                <strong>Stripe:</strong> For payment processing and fraud prevention
              </li>
              <li>
                <strong>Google Analytics:</strong> For website analytics and usage statistics
              </li>
              <li>
                <strong>Authentication Providers:</strong> For secure login and identity verification
              </li>
            </ul>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              These third parties have their own privacy policies and cookie policies. We recommend
              reviewing them to understand how they use cookies.
            </p>
          </section>

          {/* Cookie Table */}
          <section>
            <h2 className="text-2xl font-bold mb-4">5. Cookie Details</h2>
            <div className="overflow-x-auto">
              <table
                className="w-full rounded-[var(--radius-lg)] overflow-hidden"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <thead style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                  <tr>
                    <th className="px-6 py-3 text-left">Cookie Name</th>
                    <th className="px-6 py-3 text-left">Purpose</th>
                    <th className="px-6 py-3 text-left">Type</th>
                    <th className="px-6 py-3 text-left">Duration</th>
                  </tr>
                </thead>
                <tbody style={{ color: 'var(--color-text-secondary)' }}>
                  <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-6 py-4">session_token</td>
                    <td className="px-6 py-4">Maintains user session</td>
                    <td className="px-6 py-4">Essential</td>
                    <td className="px-6 py-4">Session</td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-6 py-4">csrf_token</td>
                    <td className="px-6 py-4">Security protection</td>
                    <td className="px-6 py-4">Essential</td>
                    <td className="px-6 py-4">Session</td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-6 py-4">user_preferences</td>
                    <td className="px-6 py-4">Stores UI preferences</td>
                    <td className="px-6 py-4">Preference</td>
                    <td className="px-6 py-4">1 year</td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-6 py-4">_ga</td>
                    <td className="px-6 py-4">Google Analytics tracking</td>
                    <td className="px-6 py-4">Analytics</td>
                    <td className="px-6 py-4">2 years</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">stripe_*</td>
                    <td className="px-6 py-4">Payment processing</td>
                    <td className="px-6 py-4">Essential</td>
                    <td className="px-6 py-4">Varies</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* How to Manage Cookies */}
          <section>
            <h2 className="text-2xl font-bold mb-4">6. How to Manage Cookies</h2>
            <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Most web browsers allow you to control cookies through their settings. You can:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
              <li>View what cookies are stored and delete them individually</li>
              <li>Block third-party cookies</li>
              <li>Block cookies from specific websites</li>
              <li>Block all cookies from being set</li>
              <li>Delete all cookies when you close your browser</li>
            </ul>
            <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Please note that deleting or blocking cookies may impact your user experience and some
              features may no longer function correctly.
            </p>

            <div
              className="p-6 rounded-[var(--radius-lg)] mt-6"
              style={{ backgroundColor: 'var(--color-warning-bg)', borderLeft: '4px solid var(--color-warning)' }}
            >
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-warning)' }}>
                Important Note
              </h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                If you disable essential cookies, you may not be able to use certain features of our
                service, including logging in to your account.
              </p>
            </div>
          </section>

          {/* Browser Settings */}
          <section>
            <h2 className="text-2xl font-bold mb-4">7. Browser-Specific Cookie Settings</h2>
            <div className="space-y-3" style={{ color: 'var(--color-text-secondary)' }}>
              <p>
                <strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data
              </p>
              <p>
                <strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data
              </p>
              <p>
                <strong>Safari:</strong> Preferences → Privacy → Manage Website Data
              </p>
              <p>
                <strong>Edge:</strong> Settings → Cookies and site permissions → Manage and delete cookies
              </p>
            </div>
          </section>

          {/* Updates */}
          <section>
            <h2 className="text-2xl font-bold mb-4">8. Updates to This Policy</h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              We may update this Cookie Policy from time to time to reflect changes in our practices
              or for legal, regulatory, or operational reasons. We will notify you of any material
              changes by posting the updated policy on this page with a new "Last updated" date.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold mb-4">9. Contact Us</h2>
            <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              If you have questions about our use of cookies, please contact us at:
            </p>
            <div
              className="p-6 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Email: <a href="mailto:privacy@operate.guru" className="underline" style={{ color: 'var(--color-primary)' }}>privacy@operate.guru</a>
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
