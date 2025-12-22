#!/usr/bin/env node
/**
 * Build static API documentation
 *
 * This script creates a static HTML documentation site from the OpenAPI spec
 * using Redoc for beautiful, responsive documentation.
 *
 * Usage: node scripts/build-api-docs.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'api');
const OPENAPI_PATH = path.join(OUTPUT_DIR, 'openapi.json');

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Check if openapi.json exists, if not create a basic one
if (!fs.existsSync(OPENAPI_PATH)) {
  console.log('Creating default OpenAPI spec...');

  const defaultSpec = {
    openapi: '3.0.0',
    info: {
      title: 'Operate API',
      version: '1.0.0',
      description: `
# Operate API Documentation

Operate is an AI-powered business automation platform.

## Authentication

All API endpoints require Bearer token authentication:

\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Base URL

\`https://operate.guru/api/v1\`

## Rate Limits

| Plan | Limit |
|------|-------|
| Development | 1,000/day |
| Production | 5,000/day |
| Burst | 100/min |

## Support

Email: dev@operate.guru
      `,
      contact: {
        name: 'Operate Support',
        email: 'support@operate.guru',
        url: 'https://operate.guru'
      }
    },
    servers: [
      { url: 'https://operate.guru/api/v1', description: 'Production' },
      { url: 'http://localhost:3001/api/v1', description: 'Development' }
    ],
    paths: {
      '/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Login',
          description: 'Authenticate user and receive JWT token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'user@example.com' },
                    password: { type: 'string', format: 'password', example: '********' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Successful authentication',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      accessToken: { type: 'string' },
                      refreshToken: { type: 'string' },
                      expiresIn: { type: 'number' }
                    }
                  }
                }
              }
            },
            '401': { description: 'Invalid credentials' }
          }
        }
      },
      '/invoices': {
        get: {
          tags: ['Invoices'],
          summary: 'List invoices',
          description: 'Get all invoices for the current organization',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'sent', 'paid', 'overdue'] } }
          ],
          responses: {
            '200': {
              description: 'List of invoices',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { type: 'array', items: { $ref: '#/components/schemas/Invoice' } },
                      meta: { $ref: '#/components/schemas/PaginationMeta' }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          tags: ['Invoices'],
          summary: 'Create invoice',
          description: 'Create a new invoice',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateInvoice' }
              }
            }
          },
          responses: {
            '201': { description: 'Invoice created successfully' },
            '400': { description: 'Validation error' }
          }
        }
      },
      '/invoices/{id}': {
        get: {
          tags: ['Invoices'],
          summary: 'Get invoice',
          description: 'Get invoice by ID',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            '200': { description: 'Invoice details' },
            '404': { description: 'Invoice not found' }
          }
        },
        put: {
          tags: ['Invoices'],
          summary: 'Update invoice',
          description: 'Update an existing invoice',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            '200': { description: 'Invoice updated' },
            '404': { description: 'Invoice not found' }
          }
        },
        delete: {
          tags: ['Invoices'],
          summary: 'Delete invoice',
          description: 'Delete an invoice',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            '204': { description: 'Invoice deleted' },
            '404': { description: 'Invoice not found' }
          }
        }
      },
      '/expenses': {
        get: {
          tags: ['Expenses'],
          summary: 'List expenses',
          description: 'Get all expenses',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'List of expenses' }
          }
        },
        post: {
          tags: ['Expenses'],
          summary: 'Create expense',
          description: 'Create a new expense',
          security: [{ bearerAuth: [] }],
          responses: {
            '201': { description: 'Expense created' }
          }
        }
      },
      '/banking/accounts': {
        get: {
          tags: ['Banking'],
          summary: 'List bank accounts',
          description: 'Get connected bank accounts',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'List of bank accounts' }
          }
        }
      },
      '/banking/transactions': {
        get: {
          tags: ['Banking'],
          summary: 'List transactions',
          description: 'Get bank transactions',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'accountId', in: 'query', schema: { type: 'string' } },
            { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } }
          ],
          responses: {
            '200': { description: 'List of transactions' }
          }
        }
      },
      '/reports/profit-loss': {
        get: {
          tags: ['Reports'],
          summary: 'Profit & Loss Report',
          description: 'Generate profit and loss report',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'from', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
            { name: 'to', in: 'query', required: true, schema: { type: 'string', format: 'date' } }
          ],
          responses: {
            '200': { description: 'P&L report data' }
          }
        }
      },
      '/health': {
        get: {
          tags: ['System'],
          summary: 'Health check',
          description: 'Check API health status',
          responses: {
            '200': {
              description: 'API is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      timestamp: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Invoice: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            number: { type: 'string', example: 'INV-2024-001' },
            status: { type: 'string', enum: ['draft', 'sent', 'paid', 'overdue'] },
            customerId: { type: 'string', format: 'uuid' },
            amount: { type: 'number', example: 1500.00 },
            currency: { type: 'string', example: 'EUR' },
            dueDate: { type: 'string', format: 'date' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        CreateInvoice: {
          type: 'object',
          required: ['customerId', 'items'],
          properties: {
            customerId: { type: 'string', format: 'uuid' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['description', 'quantity', 'unitPrice'],
                properties: {
                  description: { type: 'string' },
                  quantity: { type: 'number' },
                  unitPrice: { type: 'number' }
                }
              }
            },
            dueDate: { type: 'string', format: 'date' },
            notes: { type: 'string' }
          }
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'object' }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'Auth endpoints' },
      { name: 'Invoices', description: 'Invoice management' },
      { name: 'Expenses', description: 'Expense tracking' },
      { name: 'Banking', description: 'Bank connections' },
      { name: 'Reports', description: 'Financial reports' },
      { name: 'System', description: 'System endpoints' }
    ]
  };

  fs.writeFileSync(OPENAPI_PATH, JSON.stringify(defaultSpec, null, 2));
  console.log(`Created: ${OPENAPI_PATH}`);
}

// Create index.html with Redoc
console.log('Building static HTML documentation...');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Operate API Documentation - AI-powered business automation platform">
  <title>Operate API Documentation</title>
  <link rel="icon" type="image/png" href="https://operate.guru/favicon.ico">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    /* Custom header */
    .custom-header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }

    .custom-header .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      color: white;
      text-decoration: none;
      font-weight: 600;
      font-size: 18px;
    }

    .custom-header .logo svg {
      width: 32px;
      height: 32px;
    }

    .custom-header nav {
      display: flex;
      gap: 24px;
    }

    .custom-header nav a {
      color: #94a3b8;
      text-decoration: none;
      font-size: 14px;
      transition: color 0.2s;
    }

    .custom-header nav a:hover {
      color: white;
    }

    /* Redoc container - add top padding for fixed header */
    redoc {
      display: block;
      padding-top: 64px;
    }
  </style>
</head>
<body>
  <!-- Custom Header -->
  <div class="custom-header">
    <a href="https://operate.guru" class="logo">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#3b82f6"/>
        <path d="M2 17l10 5 10-5" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M2 12l10 5 10-5" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Operate API
    </a>
    <nav>
      <a href="https://operate.guru">Home</a>
      <a href="https://operate.guru/developer">Developer Portal</a>
      <a href="https://operate.guru/developer/api-keys">API Keys</a>
      <a href="https://operate.guru/help">Support</a>
    </nav>
  </div>

  <!-- Redoc Element -->
  <redoc
    spec-url="./openapi.json"
    hide-hostname="false"
    expand-responses="200,201"
    json-sample-expand-level="2"
    hide-download-button="false"
    native-scrollbars="true"
    theme='{
      "colors": {
        "primary": { "main": "#3b82f6" },
        "success": { "main": "#22c55e" },
        "warning": { "main": "#f59e0b" },
        "error": { "main": "#ef4444" },
        "text": { "primary": "#0f172a", "secondary": "#64748b" },
        "http": {
          "get": "#3b82f6",
          "post": "#22c55e",
          "put": "#f59e0b",
          "delete": "#ef4444",
          "patch": "#8b5cf6"
        }
      },
      "typography": {
        "fontSize": "15px",
        "fontFamily": "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        "headings": { "fontFamily": "Inter, -apple-system, BlinkMacSystemFont, sans-serif" },
        "code": { "fontFamily": "JetBrains Mono, Consolas, monospace" }
      },
      "sidebar": {
        "backgroundColor": "#f8fafc",
        "textColor": "#0f172a",
        "activeTextColor": "#3b82f6"
      },
      "rightPanel": {
        "backgroundColor": "#1e293b"
      }
    }'
  ></redoc>

  <!-- Redoc Standalone JS -->
  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
</body>
</html>`;

const htmlPath = path.join(OUTPUT_DIR, 'index.html');
fs.writeFileSync(htmlPath, htmlContent);
console.log(`Created: ${htmlPath}`);

// Create a simple nginx/server config suggestion
const nginxConfig = `# Nginx configuration for docs.operate.guru
# Add this to your server configuration

server {
    listen 80;
    server_name docs.operate.guru;

    root /path/to/docs/api;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_types text/html application/json application/javascript text/css;

    # Cache static assets
    location ~* \\.(json|js|css|png|ico)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
`;

const nginxPath = path.join(OUTPUT_DIR, 'nginx.conf.example');
fs.writeFileSync(nginxPath, nginxConfig);

console.log('\\n✅ Static API documentation built successfully!');
console.log(`\\nFiles created in: ${OUTPUT_DIR}`);
console.log('  - index.html (main documentation page)');
console.log('  - openapi.json (OpenAPI specification)');
console.log('  - nginx.conf.example (server configuration)');
console.log('\\nNext steps:');
console.log('  1. Create subdomain docs.operate.guru on Cloudways');
console.log('  2. Upload docs/api/ contents to the subdomain');
console.log('  3. Point DNS to the server');
