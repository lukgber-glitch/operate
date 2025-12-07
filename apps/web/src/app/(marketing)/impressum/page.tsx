import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Impressum - Operate',
  description: 'Legal information and company details as required by German law.',
};

export default function ImpressumPage() {
  return (
    <div className="min-h-screen py-16 px-4" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Impressum
          </h1>
          <p
            className="text-lg"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Information in accordance with Section 5 TMG (Telemediengesetz)
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8" style={{ color: 'var(--color-text-primary)' }}>
          {/* Company Information */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Company Information</h2>
            <div
              className="p-6 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <div className="space-y-3" style={{ color: 'var(--color-text-secondary)' }}>
                <p>
                  <strong>Operator:</strong> [Your Name / Company Name]
                </p>
                <p>
                  <strong>Address:</strong><br />
                  [Street Address]<br />
                  [Postal Code] [City]<br />
                  [Country]
                </p>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
            <div
              className="p-6 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <div className="space-y-3" style={{ color: 'var(--color-text-secondary)' }}>
                <p>
                  <strong>Email:</strong>{' '}
                  <a href="mailto:legal@operate.guru" className="underline" style={{ color: 'var(--color-primary)' }}>
                    legal@operate.guru
                  </a>
                </p>
                <p>
                  <strong>Phone:</strong> [Phone Number]
                </p>
                <p>
                  <strong>Website:</strong>{' '}
                  <a href="https://operate.guru" className="underline" style={{ color: 'var(--color-primary)' }}>
                    https://operate.guru
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* Responsible Person */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Responsible for Content</h2>
            <div
              className="p-6 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <p style={{ color: 'var(--color-text-secondary)' }}>
                <strong>Person responsible for content according to § 55 Abs. 2 RStV:</strong><br />
                [Your Name]<br />
                [Address]
              </p>
            </div>
          </section>

          {/* Business Registration */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Business Registration</h2>
            <div
              className="p-6 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <div className="space-y-3" style={{ color: 'var(--color-text-secondary)' }}>
                <p>
                  <strong>VAT ID:</strong> [VAT Identification Number according to §27a UStG]
                </p>
                <p>
                  <strong>Trade Register:</strong> [If applicable]<br />
                  <strong>Registration Number:</strong> [If applicable]<br />
                  <strong>Registration Court:</strong> [If applicable]
                </p>
              </div>
            </div>
          </section>

          {/* Professional Information */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Professional Information</h2>
            <div
              className="p-6 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <p className="mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                <strong>Professional Title:</strong> [If applicable]
              </p>
              <p className="mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                <strong>Country in which the professional title was awarded:</strong> [If applicable]
              </p>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                <strong>Applicable professional regulations:</strong> [If applicable]
              </p>
            </div>
          </section>

          {/* Disclaimer */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Disclaimer</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">Liability for Content</h3>
                <div
                  className="p-4 rounded-[var(--radius-lg)]"
                  style={{ backgroundColor: 'var(--color-surface)' }}
                >
                  <p style={{ color: 'var(--color-text-secondary)' }}>
                    As a service provider, we are responsible for our own content on these pages in
                    accordance with general legislation pursuant to Section 7 (1) TMG. However, according
                    to Sections 8 to 10 TMG, we are not obligated to monitor transmitted or stored
                    third-party information or to investigate circumstances that indicate illegal activity.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Liability for Links</h3>
                <div
                  className="p-4 rounded-[var(--radius-lg)]"
                  style={{ backgroundColor: 'var(--color-surface)' }}
                >
                  <p style={{ color: 'var(--color-text-secondary)' }}>
                    Our offer contains links to external websites of third parties, on whose contents we
                    have no influence. Therefore, we cannot assume any liability for these external contents.
                    The respective provider or operator of the pages is always responsible for the contents
                    of the linked pages.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Copyright</h3>
                <div
                  className="p-4 rounded-[var(--radius-lg)]"
                  style={{ backgroundColor: 'var(--color-surface)' }}
                >
                  <p style={{ color: 'var(--color-text-secondary)' }}>
                    The content and works created by the site operators on these pages are subject to
                    German copyright law. Duplication, processing, distribution, or any form of
                    commercialization of such material beyond the scope of the copyright law shall
                    require the prior written consent of its respective author or creator.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Data Protection */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Data Protection Officer</h2>
            <div
              className="p-6 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <p className="mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                <strong>Data Protection Officer:</strong> [Name or "See Privacy Policy"]
              </p>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                <strong>Contact:</strong>{' '}
                <a href="mailto:privacy@operate.guru" className="underline" style={{ color: 'var(--color-primary)' }}>
                  privacy@operate.guru
                </a>
              </p>
            </div>
          </section>

          {/* EU Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-bold mb-4">EU Dispute Resolution</h2>
            <div
              className="p-6 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <p className="mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                The European Commission provides a platform for online dispute resolution (OS):
              </p>
              <p className="mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                <a
                  href="https://ec.europa.eu/consumers/odr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: 'var(--color-primary)' }}
                >
                  https://ec.europa.eu/consumers/odr
                </a>
              </p>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Our email address can be found above in the impressum.
              </p>
            </div>
          </section>

          {/* Consumer Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Consumer Dispute Resolution</h2>
            <div
              className="p-6 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <p style={{ color: 'var(--color-text-secondary)' }}>
                We are not willing or obliged to participate in dispute resolution proceedings before
                a consumer arbitration board.
              </p>
            </div>
          </section>

          {/* Supervisory Authority */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Supervisory Authority</h2>
            <div
              className="p-6 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <p style={{ color: 'var(--color-text-secondary)' }}>
                <strong>Responsible Supervisory Authority:</strong><br />
                [Name of Authority if applicable]<br />
                [Address if applicable]
              </p>
            </div>
          </section>

          {/* Additional Information */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Additional Legal Information</h2>
            <div
              className="p-6 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <div className="space-y-3" style={{ color: 'var(--color-text-secondary)' }}>
                <p>
                  For more information about data protection, please see our{' '}
                  <a href="/privacy" className="underline" style={{ color: 'var(--color-primary)' }}>
                    Privacy Policy
                  </a>
                </p>
                <p>
                  For terms of use, please see our{' '}
                  <a href="/terms" className="underline" style={{ color: 'var(--color-primary)' }}>
                    Terms of Service
                  </a>
                </p>
                <p>
                  For cookie information, please see our{' '}
                  <a href="/cookies" className="underline" style={{ color: 'var(--color-primary)' }}>
                    Cookie Policy
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* Note */}
          <section>
            <div
              className="p-6 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-warning-bg)', borderLeft: '4px solid var(--color-warning)' }}
            >
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-warning)' }}>
                Note
              </h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                This impressum template contains placeholder text marked with [brackets]. Please replace
                all placeholders with your actual company information. Consult with a legal professional
                to ensure compliance with German law (TMG, GDPR, etc.).
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
