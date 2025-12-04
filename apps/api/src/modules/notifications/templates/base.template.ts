/**
 * Base HTML Email Template
 * Provides responsive email design with company branding
 */

export interface BaseTemplateVariables {
  companyName?: string;
  companyLogo?: string;
  companyAddress?: string;
  year?: number;
  unsubscribeLink?: string;
}

export const baseTemplate = (
  content: string,
  variables: BaseTemplateVariables = {},
): string => {
  const {
    companyName = 'Operate',
    companyLogo = '',
    companyAddress = '',
    year = new Date().getFullYear(),
    unsubscribeLink = '#',
  } = variables;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${companyName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f4f4f4;
      padding: 20px;
    }

    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .email-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 30px 40px;
      text-align: center;
    }

    .email-header img {
      max-width: 180px;
      height: auto;
    }

    .email-header h1 {
      color: #ffffff;
      font-size: 24px;
      margin-top: 10px;
      font-weight: 600;
    }

    .email-body {
      padding: 40px;
    }

    .email-body h2 {
      color: #1a202c;
      font-size: 20px;
      margin-bottom: 16px;
      font-weight: 600;
    }

    .email-body p {
      color: #4a5568;
      margin-bottom: 16px;
      font-size: 16px;
    }

    .cta-button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
      transition: all 0.3s ease;
    }

    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .info-box {
      background-color: #f7fafc;
      border-left: 4px solid #667eea;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }

    .warning-box {
      background-color: #fffaf0;
      border-left: 4px solid #f6ad55;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }

    .success-box {
      background-color: #f0fff4;
      border-left: 4px solid #48bb78;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }

    .email-footer {
      background-color: #f7fafc;
      padding: 30px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }

    .email-footer p {
      color: #718096;
      font-size: 14px;
      margin-bottom: 8px;
    }

    .email-footer a {
      color: #667eea;
      text-decoration: none;
    }

    .email-footer a:hover {
      text-decoration: underline;
    }

    .social-links {
      margin: 20px 0;
    }

    .social-links a {
      display: inline-block;
      margin: 0 8px;
      color: #718096;
      text-decoration: none;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }

    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }

    th {
      background-color: #f7fafc;
      font-weight: 600;
      color: #2d3748;
    }

    @media only screen and (max-width: 600px) {
      .email-container {
        border-radius: 0;
      }

      .email-header,
      .email-body,
      .email-footer {
        padding: 20px;
      }

      .email-body h2 {
        font-size: 18px;
      }

      .email-body p {
        font-size: 14px;
      }

      .cta-button {
        display: block;
        width: 100%;
      }

      table {
        font-size: 14px;
      }

      th, td {
        padding: 8px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      ${companyLogo ? `<img src="${companyLogo}" alt="${companyName}">` : `<h1>${companyName}</h1>`}
    </div>

    <div class="email-body">
      ${content}
    </div>

    <div class="email-footer">
      <p>&copy; ${year} ${companyName}. All rights reserved.</p>
      ${companyAddress ? `<p>${companyAddress}</p>` : ''}
      <p>
        <a href="${unsubscribeLink}">Unsubscribe</a> from these emails
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
};
