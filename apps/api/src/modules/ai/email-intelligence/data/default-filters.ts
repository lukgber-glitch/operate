// Default personal email domains to block (for B2B businesses)
export const DEFAULT_PERSONAL_DOMAINS = [
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.de',
  'yahoo.fr',
  'aol.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'protonmail.com',
  'proton.me',
  'gmx.de',
  'gmx.net',
  'gmx.at',
  'gmx.com',
  'web.de',
  't-online.de',
  'mail.com',
  'email.com',
  'zoho.com',
  'yandex.com',
  'yandex.ru',
  'mail.ru',
  'fastmail.com',
  'tutanota.com',
  'posteo.de',
  'mailbox.org',
];

// Service providers to auto-skip (never create as customers)
export const DEFAULT_SERVICE_PROVIDER_DOMAINS = [
  // Payment Providers
  'stripe.com',
  'paypal.com',
  'square.com',
  'mollie.com',
  'klarna.com',
  'adyen.com',
  'braintreepayments.com',

  // Cloud Providers
  'amazon.com',
  'aws.amazon.com',
  'amazonaws.com',
  'google.com',
  'cloud.google.com',
  'microsoft.com',
  'azure.com',
  'office365.com',
  'office.com',
  'digitalocean.com',
  'heroku.com',
  'cloudflare.com',
  'vercel.com',
  'netlify.com',
  'render.com',

  // Dev Tools
  'github.com',
  'gitlab.com',
  'bitbucket.org',
  'atlassian.com',
  'jira.com',
  'trello.com',
  'slack.com',
  'zoom.us',
  'notion.so',
  'linear.app',
  'asana.com',
  'monday.com',

  // Marketing/Analytics
  'mailchimp.com',
  'sendgrid.net',
  'sendgrid.com',
  'hubspot.com',
  'salesforce.com',
  'marketo.com',
  'mailgun.com',
  'postmarkapp.com',
  'sendinblue.com',
  'constantcontact.com',
  'klaviyo.com',

  // Banking/Finance Integration
  'plaid.com',
  'truelayer.com',
  'tink.com',
  'yodlee.com',

  // Social
  'linkedin.com',
  'twitter.com',
  'facebook.com',
  'meta.com',
  'instagram.com',
  'tiktok.com',

  // Utilities
  'dropbox.com',
  'box.com',
  'onedrive.com',
  'docusign.com',
  'hellosign.com',
  'pandadoc.com',
  'calendly.com',
  'doodle.com',

  // Support/CRM
  'zendesk.com',
  'freshdesk.com',
  'intercom.com',
  'helpscout.com',
  'crisp.chat',
];

// Email patterns that should be auto-skipped
export const DEFAULT_BLOCKED_EMAIL_PATTERNS = [
  'noreply@*',
  'no-reply@*',
  'do-not-reply@*',
  'donotreply@*',
  'notification@*',
  'notifications@*',
  'notify@*',
  'alert@*',
  'alerts@*',
  'mailer-daemon@*',
  'postmaster@*',
  'bounce@*',
  'bounces@*',
  'unsubscribe@*',
  'newsletter@*',
  'news@*',
  'marketing@*',
  'promo@*',
  'promotions@*',
  'offers@*',
  'auto@*',
  'automated@*',
  'automatic@*',
  'system@*',
  'robot@*',
  'bot@*',
  'daemon@*',
  'webmaster@*',
  'hostmaster@*',
  'abuse@*',
  'security@*',
  'billing@*', // Usually automated billing notifications
  'invoice@*', // Usually automated invoice systems
  'receipt@*', // Usually automated receipts
  'order@*', // Usually automated order confirmations
  'shipping@*', // Usually automated shipping notifications
  'tracking@*', // Usually automated tracking updates
];

// Headers that indicate auto-generated emails
export const AUTO_REPLY_HEADERS = [
  'X-Auto-Reply-From',
  'X-Autorespond',
  'X-Autoreply',
  'Auto-Submitted',
  'X-Auto-Response-Suppress',
];

// Header values that indicate bulk/marketing mail
export const BULK_MAIL_INDICATORS = {
  Precedence: ['bulk', 'junk', 'list'],
  'X-Mailer': [
    'mailchimp',
    'sendgrid',
    'mailgun',
    'postmark',
    'sendinblue',
    'klaviyo',
    'hubspot',
  ],
  'X-Campaign': ['*'], // Any value indicates campaign
  'X-MC-User': ['*'], // Mailchimp indicator
  'List-Unsubscribe': ['*'], // Newsletter indicator
};
