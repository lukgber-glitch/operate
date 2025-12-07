import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Processing Agreement - Operate',
  description: 'Data Processing Agreement for business customers using Operate.',
};

export default function DataProcessingAgreementPage() {
  return (
    <div className="min-h-screen py-16 px-4" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Data Processing Agreement
          </h1>
          <p
            className="text-lg mb-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            For Business Customers (Article 28 GDPR)
          </p>
          <p
            className="text-lg"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Last updated: December 7, 2025
          </p>
        </div>

        {/* Introduction */}
        <div
          className="p-6 rounded-[var(--radius-lg)] mb-8"
          style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
        >
          <h2 className="text-2xl font-bold mb-3">About This Agreement</h2>
          <p className="text-lg">
            This Data Processing Agreement (DPA) forms part of the Terms of Service between Operate
            ("Processor" or "we") and business customers ("Controller" or "you") who process personal
            data using our services. This DPA addresses our obligations under Article 28 of the EU
            General Data Protection Regulation (GDPR).
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8" style={{ color: 'var(--color-text-primary)' }}>
          {/* Table of Contents */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Table of Contents</h2>
            <div
              className="p-6 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <ol className="list-decimal pl-6 space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
                <li><a href="#definitions" className="underline" style={{ color: 'var(--color-primary)' }}>Definitions</a></li>
                <li><a href="#scope" className="underline" style={{ color: 'var(--color-primary)' }}>Scope and Application</a></li>
                <li><a href="#processing" className="underline" style={{ color: 'var(--color-primary)' }}>Nature and Purpose of Processing</a></li>
                <li><a href="#obligations" className="underline" style={{ color: 'var(--color-primary)' }}>Processor Obligations</a></li>
                <li><a href="#security" className="underline" style={{ color: 'var(--color-primary)' }}>Security Measures</a></li>
                <li><a href="#subprocessors" className="underline" style={{ color: 'var(--color-primary)' }}>Sub-processors</a></li>
                <li><a href="#rights" className="underline" style={{ color: 'var(--color-primary)' }}>Data Subject Rights</a></li>
                <li><a href="#audit" className="underline" style={{ color: 'var(--color-primary)' }}>Audit Rights</a></li>
                <li><a href="#breach" className="underline" style={{ color: 'var(--color-primary)' }}>Data Breach Notification</a></li>
                <li><a href="#deletion" className="underline" style={{ color: 'var(--color-primary)' }}>Data Return and Deletion</a></li>
              </ol>
            </div>
          </section>

          {/* Definitions */}
          <section id="definitions">
            <h2 className="text-2xl font-bold mb-4">1. Definitions</h2>
            <div
              className="p-6 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <dl className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
                <div>
                  <dt className="font-semibold">Controller:</dt>
                  <dd>The customer (you) who determines the purposes and means of processing personal data.</dd>
                </div>
                <div>
                  <dt className="font-semibold">Processor:</dt>
                  <dd>Operate, which processes personal data on behalf of the Controller.</dd>
                </div>
                <div>
                  <dt className="font-semibold">Personal Data:</dt>
                  <dd>Any information relating to an identified or identifiable natural person.</dd>
                </div>
                <div>
                  <dt className="font-semibold">Processing:</dt>
                  <dd>Any operation performed on personal data, including collection, storage, use, or deletion.</dd>
                </div>
                <div>
                  <dt className="font-semibold">Data Subject:</dt>
                  <dd>An identified or identifiable natural person whose personal data is processed.</dd>
                </div>
                <div>
                  <dt className="font-semibold">Sub-processor:</dt>
                  <dd>A third party engaged by the Processor to process personal data on behalf of the Controller.</dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Scope and Application */}
          <section id="scope">
            <h2 className="text-2xl font-bold mb-4">2. Scope and Application</h2>
            <div className="space-y-4">
              <div
                className="p-6 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <h3 className="text-xl font-semibold mb-3">2.1 Applicability</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  This DPA applies when you use Operate's services to process personal data for which you
                  are the data controller. This typically applies to business customers who use our platform
                  to manage employee data, customer information, or other personal data.
                </p>
              </div>

              <div
                className="p-6 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <h3 className="text-xl font-semibold mb-3">2.2 Relationship to Terms of Service</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  This DPA supplements and forms part of the Terms of Service. In case of conflict between
                  this DPA and the Terms of Service, this DPA shall prevail to the extent of the conflict.
                </p>
              </div>
            </div>
          </section>

          {/* Nature and Purpose of Processing */}
          <section id="processing">
            <h2 className="text-2xl font-bold mb-4">3. Nature and Purpose of Processing</h2>
            <div
              className="p-6 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <h3 className="text-xl font-semibold mb-4">3.1 Processing Details</h3>
              <div className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
                <div>
                  <strong>Subject Matter:</strong>
                  <p>Provision of business management and financial software services.</p>
                </div>
                <div>
                  <strong>Duration:</strong>
                  <p>For the term of the subscription and as required to fulfill legal obligations thereafter.</p>
                </div>
                <div>
                  <strong>Nature of Processing:</strong>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Storage and organization of financial data</li>
                    <li>Automated processing and categorization</li>
                    <li>Generation of reports and analytics</li>
                    <li>AI-assisted data analysis and suggestions</li>
                  </ul>
                </div>
                <div>
                  <strong>Purpose of Processing:</strong>
                  <p>To provide business management, accounting, and financial services as described in the Terms of Service.</p>
                </div>
                <div>
                  <strong>Types of Personal Data:</strong>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Contact information (names, email addresses, phone numbers)</li>
                    <li>Financial data (invoices, expenses, transactions)</li>
                    <li>Bank account information</li>
                    <li>Tax identification numbers</li>
                    <li>Business correspondence</li>
                  </ul>
                </div>
                <div>
                  <strong>Categories of Data Subjects:</strong>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Your customers</li>
                    <li>Your suppliers and vendors</li>
                    <li>Your employees (if applicable)</li>
                    <li>Your business contacts</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Processor Obligations */}
          <section id="obligations">
            <h2 className="text-2xl font-bold mb-4">4. Processor Obligations</h2>
            <div className="space-y-4">
              <div
                className="p-6 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <h3 className="text-xl font-semibold mb-3">4.1 Processing Instructions</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  We will process personal data only in accordance with your documented instructions,
                  unless required by applicable law. We will inform you if we believe any instruction
                  violates the GDPR or other data protection laws.
                </p>
              </div>

              <div
                className="p-6 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <h3 className="text-xl font-semibold mb-3">4.2 Confidentiality</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  We ensure that persons authorized to process personal data have committed themselves to
                  confidentiality or are under an appropriate statutory obligation of confidentiality.
                </p>
              </div>

              <div
                className="p-6 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <h3 className="text-xl font-semibold mb-3">4.3 Assistance Obligations</h3>
                <p className="mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  We will assist you, to the extent reasonably possible, in:
                </p>
                <ul className="list-disc pl-6 space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                  <li>Fulfilling your obligations to respond to data subject rights requests</li>
                  <li>Ensuring compliance with data protection impact assessments</li>
                  <li>Prior consultations with supervisory authorities</li>
                  <li>Implementing appropriate security measures</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Security Measures */}
          <section id="security">
            <h2 className="text-2xl font-bold mb-4">5. Security Measures</h2>
            <div
              className="p-6 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <h3 className="text-xl font-semibold mb-4">5.1 Technical and Organizational Measures</h3>
              <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                We implement appropriate technical and organizational measures to ensure a level of
                security appropriate to the risk, including:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Technical Measures:</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>Encryption of data in transit and at rest</li>
                    <li>Regular security testing and monitoring</li>
                    <li>Access controls and authentication</li>
                    <li>Firewall and intrusion detection</li>
                    <li>Regular backups</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Organizational Measures:</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>Staff training on data protection</li>
                    <li>Confidentiality agreements</li>
                    <li>Incident response procedures</li>
                    <li>Access limitation on need-to-know basis</li>
                    <li>Regular security audits</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Sub-processors */}
          <section id="subprocessors">
            <h2 className="text-2xl font-bold mb-4">6. Sub-processors</h2>
            <div className="space-y-4">
              <div
                className="p-6 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <h3 className="text-xl font-semibold mb-3">6.1 Authorization</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  You provide general authorization for us to engage sub-processors. We maintain a current
                  list of sub-processors on our website.
                </p>
              </div>

              <div
                className="p-6 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <h3 className="text-xl font-semibold mb-3">6.2 Current Sub-processors</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                      <tr>
                        <th className="px-4 py-2 text-left">Sub-processor</th>
                        <th className="px-4 py-2 text-left">Service</th>
                        <th className="px-4 py-2 text-left">Location</th>
                      </tr>
                    </thead>
                    <tbody style={{ color: 'var(--color-text-secondary)' }}>
                      <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                        <td className="px-4 py-2">Anthropic</td>
                        <td className="px-4 py-2">AI Processing</td>
                        <td className="px-4 py-2">USA</td>
                      </tr>
                      <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                        <td className="px-4 py-2">Stripe</td>
                        <td className="px-4 py-2">Payment Processing</td>
                        <td className="px-4 py-2">USA</td>
                      </tr>
                      <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                        <td className="px-4 py-2">AWS</td>
                        <td className="px-4 py-2">Infrastructure</td>
                        <td className="px-4 py-2">EU/USA</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">TrueLayer/Tink</td>
                        <td className="px-4 py-2">Banking Integration</td>
                        <td className="px-4 py-2">EU</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div
                className="p-6 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <h3 className="text-xl font-semibold mb-3">6.3 Changes to Sub-processors</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  We will notify you of any intended changes concerning the addition or replacement of
                  sub-processors at least 30 days in advance. You may object to such changes on reasonable
                  data protection grounds.
                </p>
              </div>
            </div>
          </section>

          {/* Data Subject Rights */}
          <section id="rights">
            <h2 className="text-2xl font-bold mb-4">7. Data Subject Rights</h2>
            <div
              className="p-6 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <h3 className="text-xl font-semibold mb-4">7.1 Assistance with Data Subject Requests</h3>
              <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                We will assist you in responding to requests from data subjects exercising their rights under
                data protection laws, including:
              </p>
              <ul className="list-disc pl-6 space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
                <li>Right of access (Article 15 GDPR)</li>
                <li>Right to rectification (Article 16 GDPR)</li>
                <li>Right to erasure (Article 17 GDPR)</li>
                <li>Right to restriction of processing (Article 18 GDPR)</li>
                <li>Right to data portability (Article 20 GDPR)</li>
                <li>Right to object (Article 21 GDPR)</li>
              </ul>
              <p className="mt-4" style={{ color: 'var(--color-text-secondary)' }}>
                If a data subject contacts us directly, we will forward the request to you without undue delay.
              </p>
            </div>
          </section>

          {/* Audit Rights */}
          <section id="audit">
            <h2 className="text-2xl font-bold mb-4">8. Audit Rights</h2>
            <div
              className="p-6 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <h3 className="text-xl font-semibold mb-3">8.1 Documentation and Audits</h3>
              <p className="mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                We will make available to you all information necessary to demonstrate compliance with
                this DPA and allow for audits, including inspections, by you or another auditor mandated by you.
              </p>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Audit requests must be made with reasonable notice and conducted during business hours in a
                manner that does not unreasonably interfere with our operations. You will bear the costs
                of such audits unless they reveal material non-compliance.
              </p>
            </div>
          </section>

          {/* Data Breach Notification */}
          <section id="breach">
            <h2 className="text-2xl font-bold mb-4">9. Data Breach Notification</h2>
            <div
              className="p-6 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <h3 className="text-xl font-semibold mb-4">9.1 Notification Obligation</h3>
              <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                We will notify you without undue delay after becoming aware of a personal data breach
                affecting your data. The notification will include:
              </p>
              <ul className="list-disc pl-6 space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
                <li>Description of the nature of the breach</li>
                <li>Categories and approximate number of data subjects affected</li>
                <li>Categories and approximate number of personal data records affected</li>
                <li>Likely consequences of the breach</li>
                <li>Measures taken or proposed to address the breach</li>
              </ul>
            </div>
          </section>

          {/* Data Return and Deletion */}
          <section id="deletion">
            <h2 className="text-2xl font-bold mb-4">10. Data Return and Deletion</h2>
            <div className="space-y-4">
              <div
                className="p-6 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <h3 className="text-xl font-semibold mb-3">10.1 End of Processing</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Upon termination of the services, we will, at your choice, delete or return all personal
                  data to you, and delete existing copies, unless EU or Member State law requires storage
                  of the personal data.
                </p>
              </div>

              <div
                className="p-6 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <h3 className="text-xl font-semibold mb-3">10.2 Data Export</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  You may export your data at any time during the term using our data export functionality.
                  After termination, you have 30 days to export your data before it is permanently deleted.
                </p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold mb-4">11. Contact Information</h2>
            <div
              className="p-6 rounded-[var(--radius-lg)]"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                For questions about this DPA or data protection matters:
              </p>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                <strong>Data Protection Officer:</strong><br />
                Email: <a href="mailto:dpo@operate.guru" className="underline" style={{ color: 'var(--color-primary)' }}>dpo@operate.guru</a><br />
                Address: [See Impressum for full address]
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
