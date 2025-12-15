'use client';

import { useState, useEffect, useRef } from 'react';
import { Metadata } from 'next';
import { gsap } from 'gsap';
import { ChevronDownIcon, ShieldCheckIcon, BrainCircuitIcon, BanknoteIcon, FileTextIcon, LandmarkIcon, LockIcon, CreditCardIcon, RocketIcon } from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
  disclaimer?: boolean;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  faqs: FAQ[];
}

const faqCategories: FAQCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: ShieldCheckIcon,
    faqs: [
      {
        question: 'What is Operate?',
        answer: 'Operate is an AI-powered business automation platform that helps entrepreneurs and small businesses manage their finances, invoicing, expenses, tax filing, and more. Our AI assistant uses Claude to understand your natural language requests and automate repetitive tasks, so you can focus on growing your business.',
      },
      {
        question: 'How do I create an account?',
        answer: 'Creating an account is simple! Click "Get Started" or "Sign Up" and you can register using your Google account (OAuth) or create an account with your email and password. If you register with Google, you\'ll have instant access. Email registrations require email verification for security.',
      },
      {
        question: 'Is there a free trial?',
        answer: 'Yes! All paid plans (Starter, Pro, and Business) include a 14-day free trial with full access to all features. No credit card is required to start your trial. The Free plan is available indefinitely with limited features (1 bank connection, 50 AI messages per month).',
      },
      {
        question: 'What languages are supported?',
        answer: 'Operate currently supports English and German. Our AI assistant can understand and respond in both languages. Tax filing features are localized for Germany (ELSTER), Austria, and the UK (HMRC), with more countries coming soon.',
      },
      {
        question: 'What devices can I use Operate on?',
        answer: 'Operate is a web-based application that works on any modern browser (Chrome, Firefox, Safari, Edge). It\'s fully responsive and works great on desktop, tablet, and mobile devices. Simply visit operate.guru from any device.',
      },
    ],
  },
  {
    id: 'ai-assistant',
    title: 'AI Assistant / Chat',
    icon: BrainCircuitIcon,
    faqs: [
      {
        question: 'What can I ask the AI?',
        answer: 'You can ask the AI to perform various business tasks such as: create invoices and quotes, categorize expenses, answer financial questions, generate reports, search for documents, reconcile bank transactions, prepare tax information, and more. Try asking "Create an invoice for my client" or "Show me last month\'s expenses" to get started.',
      },
      {
        question: 'Is the AI giving me financial advice?',
        answer: 'No. The AI assistant is NOT a financial advisor, tax professional, or accountant. It provides informational assistance and automation tools based on your data, but does not provide professional financial, tax, or legal advice. Always consult qualified professionals for important financial decisions.',
        disclaimer: true,
      },
      {
        question: 'How accurate are AI suggestions?',
        answer: 'Our AI uses Claude (Anthropic) for high-quality natural language understanding. While it\'s very accurate for automation and categorization tasks, you should always review important financial information before finalizing. The AI learns from your corrections and improves over time.',
      },
      {
        question: 'Can I create invoices via chat?',
        answer: 'Yes! Simply tell the AI what you need, like "Create an invoice for Acme Corp". Instead of just creating a draft, the AI opens a guided wizard panel on the side where you can fill in details step-by-step. The AI provides helpful tips as you progress through each step (client selection, line items, dates, review). This hybrid approach gives you the convenience of chat with the precision of a structured form.',
      },
      {
        question: 'What actions can I perform via chat?',
        answer: 'You can perform dozens of actions via chat, including: creating and sending invoices, adding expenses, managing clients and vendors, requesting leave, creating quotes and contracts, generating financial reports, reconciling bank transactions, searching documents, tracking time, and much more. Complex tasks like invoice creation open guided wizard panels, while simple tasks execute directly. Actions that involve money or sensitive data will ask for confirmation.',
      },
      {
        question: 'What are guided wizard panels?',
        answer: 'Guided wizard panels are step-by-step forms that appear in a side panel when you request complex tasks like creating invoices, adding expenses, or managing clients. As you work through each step, the AI provides contextual guidance in the chat. This hybrid approach combines the natural language convenience of chat with the precision and validation of structured forms, ensuring you don\'t miss any important details.',
      },
      {
        question: 'Does the AI have access to all my data?',
        answer: 'The AI assistant has access to your business data (invoices, expenses, bank transactions, documents) within Operate to help you manage your business. It does NOT share your data with third parties. All AI processing happens securely through Anthropic\'s Claude API with enterprise-grade security. Your data is never used to train AI models.',
      },
      {
        question: 'What happens when I reach my AI message limit?',
        answer: 'On the Free plan (50 messages/month) and Starter plan (500 messages/month), you\'ll receive a notification when approaching your limit. You can upgrade to Pro (unlimited messages) or wait until your limit resets at the start of the next billing month. Message history is preserved.',
      },
    ],
  },
  {
    id: 'unique-automation',
    title: 'Unique Automation Features',
    icon: RocketIcon,
    faqs: [
      {
        question: 'What makes Operate different from sevDesk or Lexware?',
        answer: 'Operate is the only accounting platform with a conversational AI that can actually perform actions - not just answer questions. You can say "Create an invoice for Acme Corp" and the AI opens a guided wizard. We also offer integrated commuter allowance (Pendlerpauschale) calculation, automatic bill creation from vendor emails, bank transaction matching that learns from your corrections, and multi-country tax filing (Germany, Austria, UK) in one platform. Traditional competitors like sevDesk and Lexware don\'t have these AI automation capabilities.',
      },
      {
        question: 'What is the Commuter Allowance (Pendlerpauschale) feature?',
        answer: 'Operate automatically calculates your commuter allowance (Pendlerpauschale/Entfernungspauschale) for tax deductions. Enter your one-way distance to work and the number of working days, and we calculate the deductible amount according to German, Austrian, or Swiss tax rules. The current German rate is €0.30/km for the first 20km and €0.38/km thereafter. This is automatically included in your tax reports - no competitor offers this integrated automation.',
      },
      {
        question: 'How many actions can I perform via AI chat?',
        answer: 'Operate\'s AI can perform 37+ different actions including: creating invoices, quotes, and contracts; adding expenses and scanning receipts; managing clients and vendors; requesting and approving leave; tracking time and mileage; generating financial reports; reconciling bank transactions; and much more. Complex tasks open guided wizard panels for precision, while simple tasks execute directly with confirmation.',
      },
      {
        question: 'Does the AI learn from my corrections?',
        answer: 'Yes! Our AI learns from every correction you make. When you recategorize an expense or update a bank transaction match, the system learns your preferences and applies them automatically to similar future transactions. Over time, Operate becomes more accurate and requires less manual intervention.',
      },
      {
        question: 'What is Email Intelligence?',
        answer: 'When you connect your email (Gmail or Outlook), Operate\'s AI scans for vendor invoices and automatically creates draft bills. It extracts key information like vendor name, amount, due date, and even line items using Claude-powered OCR. You review and approve - the AI does the data entry work.',
      },
      {
        question: 'What proactive suggestions does Operate provide?',
        answer: 'Operate provides 6 types of proactive suggestions: tax deadline reminders, cash flow alerts, expense categorization recommendations, invoice follow-up reminders, reconciliation suggestions for unmatched transactions, and financial insights based on your spending patterns. These appear in your dashboard and chat interface.',
      },
    ],
  },
  {
    id: 'banking',
    title: 'Banking & Connections',
    icon: BanknoteIcon,
    faqs: [
      {
        question: 'How do I connect my bank account?',
        answer: 'Go to Settings > Bank Connections and click "Connect Bank Account". Select your bank from the list or search by name. You\'ll be securely redirected to your bank\'s login page to authorize the connection. We use TrueLayer (EU/UK), Tink (Europe), and Plaid (US) for secure bank connections.',
      },
      {
        question: 'Is my bank data secure?',
        answer: 'Absolutely. We use bank-level encryption (AES-256) and NEVER store your banking credentials. Bank connections are handled by certified third-party providers (TrueLayer, Tink, Plaid) that are regulated by financial authorities. Your bank login details are only entered on your bank\'s official website, not on Operate.',
      },
      {
        question: 'Which banks are supported?',
        answer: 'We support 4,000+ banks across Europe and the UK through TrueLayer and Tink, and most US banks through Plaid. This includes major banks like Deutsche Bank, Commerzbank, Sparkasse, Volksbank (Germany), Barclays, HSBC (UK), Chase, Bank of America, Wells Fargo (US), and many more. If your bank isn\'t supported, you can manually import transactions via CSV.',
      },
      {
        question: 'Can I connect multiple accounts?',
        answer: 'Yes! The number of bank connections depends on your plan: Free (1 connection), Starter (3 connections), Pro (10 connections), Business (unlimited connections). You can connect accounts from different banks and different countries.',
      },
      {
        question: 'How often do bank transactions sync?',
        answer: 'Bank transactions typically sync automatically every 24 hours. You can also manually trigger a sync at any time from the Bank Connections page. Some banks may have delays in making transaction data available, which can affect sync timing.',
      },
      {
        question: 'Can I disconnect a bank account?',
        answer: 'Yes, you can disconnect any bank account at any time from Settings > Bank Connections. When you disconnect, the authorization is revoked and Operate will no longer access that account. Historical transaction data from that account will remain in your records unless you delete it.',
      },
      {
        question: 'What if my bank connection stops working?',
        answer: 'Bank connections may occasionally need to be re-authorized due to security updates or password changes. You\'ll receive a notification if a connection needs attention. Simply go to Bank Connections and click "Re-authorize" to restore the connection.',
      },
    ],
  },
  {
    id: 'invoices-expenses',
    title: 'Invoices & Expenses',
    icon: FileTextIcon,
    faqs: [
      {
        question: 'How do I create an invoice?',
        answer: 'You can create invoices in three ways: (1) Ask the AI: "Create an invoice for [client]" which opens a guided wizard panel with step-by-step assistance, (2) Go to Invoices > Create New Invoice and fill out the form directly, or (3) Use a template from previous invoices. All methods support custom invoice templates, your logo, line items, and payment terms.',
      },
      {
        question: 'Can I send invoices directly to clients?',
        answer: 'Yes! After creating an invoice, you can send it via email directly from Operate. The email includes a PDF attachment and a payment link (if Stripe is connected). You can customize the email message and track when clients open the invoice.',
      },
      {
        question: 'Can I scan receipts?',
        answer: 'Yes! Use the mobile-optimized upload feature or drag-and-drop on desktop. Our OCR (Optical Character Recognition) technology automatically extracts key information like merchant name, date, amount, and tax. You can review and correct the extracted data before saving.',
      },
      {
        question: 'How does automatic categorization work?',
        answer: 'Our AI analyzes transaction descriptions, merchant names, and patterns to automatically categorize expenses (e.g., "Office Supplies", "Travel", "Software"). You can review and correct categories, and the AI learns from your corrections to improve accuracy over time.',
      },
      {
        question: 'Can I track mileage and time?',
        answer: 'Yes! Operate includes mileage tracking for business travel and time tracking for billable hours. You can log mileage manually or import from a spreadsheet. Time entries can be converted directly to invoices with hourly rates.',
      },
      {
        question: 'What file formats can I import?',
        answer: 'You can import transactions and expenses from CSV, Excel (XLSX), and connect directly to accounting software like DATEV (Germany). Receipts and documents can be uploaded as PDF, JPG, PNG, or HEIC (iPhone) files.',
      },
      {
        question: 'Can I export my data?',
        answer: 'Yes! You can export invoices, expenses, and reports to CSV, Excel, or PDF at any time. There\'s also an API available on the Business plan for custom integrations and automated exports.',
      },
    ],
  },
  {
    id: 'tax-filing',
    title: 'Tax Filing',
    icon: LandmarkIcon,
    faqs: [
      {
        question: 'Which countries are supported for tax filing?',
        answer: 'Currently, we support tax filing assistance for Germany (ELSTER), Austria, and the UK (HMRC). Our system helps prepare tax documents, calculate tax obligations, and can submit directly to ELSTER (Germany). More countries are coming soon.',
      },
      {
        question: 'Is this official tax advice?',
        answer: 'No. Operate provides tax filing ASSISTANCE and educational information, not professional tax advice. Our tools help organize your financial data and prepare tax documents, but we are not tax advisors. For complex tax situations or important decisions, always consult a qualified tax professional or Steuerberater.',
        disclaimer: true,
      },
      {
        question: 'How does ELSTER filing work?',
        answer: 'For Germany, Operate integrates with ELSTER (the official tax filing system). We guide you through collecting the required information, generate the necessary forms, and can submit your tax return electronically. You\'ll need your ELSTER certificate to complete the submission.',
      },
      {
        question: 'Do I still need an accountant?',
        answer: 'It depends on your situation. For simple tax scenarios (freelancers, small businesses with straightforward finances), Operate can help you prepare and file taxes yourself. For complex situations (multiple income sources, international business, complicated deductions), we recommend working with a tax professional. Operate can still help organize your data for your accountant.',
      },
      {
        question: 'Can Operate calculate VAT/sales tax?',
        answer: 'Yes! Operate automatically calculates VAT for invoices based on your tax settings and customer location. It tracks VAT collected and paid, and helps prepare VAT returns (Umsatzsteuervoranmeldung in Germany). You can file VAT returns directly through ELSTER integration.',
      },
      {
        question: 'What tax reports are available?',
        answer: 'Operate generates various tax reports including: P&L (Profit & Loss), Balance Sheet, VAT Summary, Expense Breakdown by Category, Mileage & Travel Summary, and more. Reports can be generated for any date range and exported for your accountant.',
      },
    ],
  },
  {
    id: 'security-privacy',
    title: 'Security & Privacy',
    icon: LockIcon,
    faqs: [
      {
        question: 'How is my data protected?',
        answer: 'Your data is protected with enterprise-grade security: AES-256 encryption at rest, TLS 1.3 encryption in transit, regular security audits, SOC 2 Type II certification, GDPR compliance, and strict access controls. We use secure third-party providers for bank connections (TrueLayer, Tink, Plaid) and AI processing (Anthropic Claude).',
      },
      {
        question: 'Who can see my financial data?',
        answer: 'Only you and authorized team members (on Business plan) can access your financial data. Operate employees do not have access to your data except in specific support cases where you explicitly grant permission. Our AI provider (Anthropic) processes requests but does not store or train on your data.',
      },
      {
        question: 'Can I delete my data?',
        answer: 'Yes. You can delete individual documents, transactions, or invoices at any time. If you want to delete your entire account and all associated data, go to Settings > Account > Delete Account. This action is permanent and cannot be undone. We will permanently delete your data within 30 days.',
      },
      {
        question: 'Is Operate GDPR compliant?',
        answer: 'Yes. Operate is fully compliant with GDPR (General Data Protection Regulation) and other data privacy laws. We act as a data processor for your business data. You can export your data, delete it, or request a copy at any time. Our privacy policy explains exactly how we handle data.',
      },
      {
        question: 'Where is my data stored?',
        answer: 'Data is stored in secure data centers in the EU (Frankfurt, Germany) and encrypted both at rest and in transit. For US customers, we use AWS US-East (Virginia) with the same security standards. You can request a specific data residency on the Business plan.',
      },
      {
        question: 'Do you share my data with third parties?',
        answer: 'We only share data with essential service providers who help operate the platform: Anthropic (AI processing), TrueLayer/Tink/Plaid (bank connections), Stripe (payments), and AWS (hosting). These providers are contractually obligated to protect your data. We NEVER sell your data to advertisers or third parties.',
      },
      {
        question: 'What happens if there\'s a security breach?',
        answer: 'While we implement extensive security measures, we have incident response procedures in place. In the unlikely event of a breach, we will notify affected users within 72 hours (as required by GDPR), disclose what data was affected, and take immediate corrective action.',
      },
    ],
  },
  {
    id: 'billing',
    title: 'Billing & Subscription',
    icon: CreditCardIcon,
    faqs: [
      {
        question: 'What plans are available?',
        answer: 'We offer four plans: Free (€0, limited features), Starter (€9.90/month or €95/year for freelancers), Pro (€19.90/month or €190/year for small businesses), and Business (€39.90/month or €380/year for teams). Annual billing saves about 20%. See our Pricing page for detailed feature comparison.',
      },
      {
        question: 'Can I change my plan later?',
        answer: 'Yes! You can upgrade or downgrade at any time from Settings > Billing. When upgrading, you\'ll be charged a prorated amount immediately and get instant access to new features. When downgrading, the change takes effect at the start of your next billing cycle, and you keep current features until then.',
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover), debit cards, and SEPA Direct Debit for European customers. All payments are processed securely through Stripe. We do not store your payment card details.',
      },
      {
        question: 'How do I cancel my subscription?',
        answer: 'You can cancel anytime from Settings > Billing > Cancel Subscription. When you cancel, you\'ll continue to have access to paid features until the end of your current billing period. After that, your account will automatically switch to the Free plan. No cancellation fees.',
      },
      {
        question: 'Is there a refund policy?',
        answer: 'We offer a 30-day money-back guarantee on all paid plans. If you\'re not satisfied for any reason within the first 30 days, contact support for a full refund. After 30 days, we do not offer refunds for partial months, but you can cancel anytime to stop future charges.',
      },
      {
        question: 'Do you offer discounts for annual billing?',
        answer: 'Yes! Annual billing saves you 17% compared to monthly billing (equivalent to 2 months free per year). You can switch between monthly and annual billing at any time. Students, nonprofits, and educational institutions may qualify for additional discounts - contact sales@operate.guru.',
      },
      {
        question: 'What happens if my payment fails?',
        answer: 'If a payment fails, we\'ll send you an email notification and retry the charge over the next few days. You can update your payment method in Settings > Billing. If payment isn\'t resolved within 7 days, your account will be downgraded to the Free plan until payment is successful.',
      },
      {
        question: 'Can I get an invoice for my subscription?',
        answer: 'Yes! All subscription payments automatically generate an invoice that\'s sent to your email and available in Settings > Billing > Invoices. You can download PDF invoices for accounting purposes. For businesses requiring custom billing terms or PO numbers, contact sales@operate.guru.',
      },
    ],
  },
];

function FAQItem({ faq, index }: { faq: FAQ; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="border-b pb-6"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left py-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded-lg px-2"
        aria-expanded={isOpen}
      >
        <h3 className="text-lg font-semibold pr-8" style={{ color: 'var(--color-text-primary)' }}>
          {faq.question}
        </h3>
        <ChevronDownIcon
          className="w-5 h-5 flex-shrink-0 transition-transform duration-200"
          style={{
            color: 'var(--color-primary)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isOpen ? '1000px' : '0',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="pt-2 pb-4 px-2">
          <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {faq.answer}
          </p>
          {faq.disclaimer && (
            <div
              className="mt-4 p-4 rounded-lg border-l-4"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderColor: '#ef4444',
              }}
            >
              <p className="text-sm font-semibold" style={{ color: '#ef4444' }}>
                Important Legal Disclaimer
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                This is not professional advice. Always consult qualified professionals for financial, tax, or legal matters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FAQCategory({ category, index }: { category: FAQCategory; index: number }) {
  const [isExpanded, setIsExpanded] = useState(index === 0); // First category open by default
  const Icon = category.icon;

  return (
    <div
      className="mb-8 rounded-[var(--radius-2xl)] overflow-hidden"
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between text-left hover:bg-opacity-80 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-4">
          <div
            className="p-3 rounded-[var(--radius-lg)]"
            style={{ backgroundColor: 'var(--color-primary)', opacity: 0.1 }}
          >
            <Icon
              className="w-6 h-6"
              style={{ color: 'var(--color-primary)' }}
            />
          </div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {category.title}
          </h2>
          <span
            className="text-sm px-3 py-1 rounded-full"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              opacity: 0.8,
            }}
          >
            {category.faqs.length} questions
          </span>
        </div>
        <ChevronDownIcon
          className="w-6 h-6 flex-shrink-0 transition-transform duration-200"
          style={{
            color: 'var(--color-primary)',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isExpanded ? '10000px' : '0',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div className="px-6 pb-6 space-y-2">
          {category.faqs.map((faq, faqIndex) => (
            <FAQItem key={faqIndex} faq={faq} index={faqIndex} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FAQPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);

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

    // Categories animation
    if (categoriesRef.current) {
      const categories = categoriesRef.current.children;
      gsap.fromTo(
        categories,
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
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
          Frequently Asked Questions
        </h1>
        <p
          className="text-xl md:text-2xl mb-8"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Everything you need to know about Operate.
          <br />
          Can't find what you're looking for? Contact our support team.
        </p>
      </div>

      {/* Quick Navigation */}
      <div className="max-w-5xl mx-auto mb-12">
        <div className="flex flex-wrap gap-3 justify-center">
          {faqCategories.map((category) => {
            const Icon = category.icon;
            return (
              <a
                key={category.id}
                href={`#${category.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-lg)] transition-all hover:scale-105"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <Icon className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                <span className="text-sm font-medium">{category.title}</span>
              </a>
            );
          })}
        </div>
      </div>

      {/* FAQ Categories */}
      <div ref={categoriesRef} className="max-w-5xl mx-auto">
        {faqCategories.map((category, index) => (
          <div key={category.id} id={category.id}>
            <FAQCategory category={category} index={index} />
          </div>
        ))}
      </div>

      {/* Global Disclaimers */}
      <div className="max-w-4xl mx-auto mt-16 mb-12">
        <div
          className="p-8 rounded-[var(--radius-2xl)] border-l-4"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-primary)',
          }}
        >
          <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Important Legal Disclaimers
          </h3>

          <div className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
            <div>
              <p className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                Not Financial Advice
              </p>
              <p className="text-sm leading-relaxed">
                Operate and its AI assistant do NOT provide financial, investment, tax, or legal advice.
                All information is for educational and informational purposes only. Always consult qualified
                professionals (financial advisors, tax professionals, accountants, lawyers) for important decisions.
              </p>
            </div>

            <div>
              <p className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                Tax Filing Assistance
              </p>
              <p className="text-sm leading-relaxed">
                Our tax filing features provide assistance and tools to organize your financial data and
                prepare tax documents. This is NOT professional tax advice. Tax laws are complex and change
                frequently. For complex situations or if you're unsure, consult a certified tax professional
                or Steuerberater.
              </p>
            </div>

            <div>
              <p className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                Bank Connections & Third-Party Services
              </p>
              <p className="text-sm leading-relaxed">
                Bank connections are provided through certified third-party providers (TrueLayer, Tink, Plaid).
                While we implement strong security measures, we cannot guarantee uninterrupted service or
                be responsible for actions of third-party providers. AI processing uses Anthropic Claude with
                enterprise security, but you are responsible for reviewing all AI-generated content.
              </p>
            </div>

            <div>
              <p className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                User Responsibility
              </p>
              <p className="text-sm leading-relaxed">
                You are responsible for the accuracy of data you input, reviewing AI suggestions before
                taking action, complying with applicable laws and regulations, and maintaining the security
                of your account. Operate is a tool to assist you, not a replacement for professional judgment.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Support CTA */}
      <div className="max-w-4xl mx-auto text-center mt-16 mb-12">
        <div
          className="p-12 rounded-[var(--radius-2xl)]"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Still have questions?
          </h2>
          <p
            className="text-lg md:text-xl mb-8"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Our support team is here to help. We typically respond within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@operate.guru"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-[var(--radius-lg)] text-lg font-semibold text-white transition-all hover:scale-105"
              style={{
                backgroundColor: 'var(--color-primary)',
              }}
            >
              Contact Support
            </a>
            <a
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-[var(--radius-lg)] text-lg font-semibold transition-all hover:scale-105"
              style={{
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-primary)',
                border: '2px solid var(--color-primary)',
              }}
            >
              View Pricing
            </a>
          </div>
        </div>
      </div>

      {/* Additional Resources */}
      <div className="max-w-4xl mx-auto mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a
            href="/docs"
            className="p-6 rounded-[var(--radius-lg)] transition-all hover:scale-105"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Documentation
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Detailed guides and tutorials
            </p>
          </a>

          <a
            href="/blog"
            className="p-6 rounded-[var(--radius-lg)] transition-all hover:scale-105"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Blog
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Tips, updates, and best practices
            </p>
          </a>

          <a
            href="/changelog"
            className="p-6 rounded-[var(--radius-lg)] transition-all hover:scale-105"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Changelog
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Latest features and improvements
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
