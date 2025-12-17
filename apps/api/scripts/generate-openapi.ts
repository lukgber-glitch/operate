/**
 * Generate OpenAPI specification from NestJS application
 * Run with: npx ts-node scripts/generate-openapi.ts
 */

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

async function generateOpenApiSpec() {
  console.log('Initializing NestJS application...');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Operate API')
    .setDescription(`
# Operate API Documentation

Operate is an AI-powered business automation platform that helps businesses manage their finances, invoices, expenses, and operations.

## Authentication

All API endpoints require authentication using Bearer tokens. Include your API key in the Authorization header:

\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Rate Limits

- Development keys: 1,000 requests/day
- Production keys: 5,000 requests/day
- Burst limit: 100 requests/minute

## Base URL

Production: \`https://api.operate.guru/api/v1\`

## Support

For API support, contact: dev@operate.guru
    `)
    .setVersion('1.0.0')
    .setContact('Operate Support', 'https://operate.guru', 'support@operate.guru')
    .setLicense('Proprietary', 'https://operate.guru/terms')
    .addServer('https://operate.guru', 'Production')
    .addServer('http://localhost:3001', 'Development')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Health', 'Health check endpoints')
    .addTag('Auth', 'Authentication and authorization')
    .addTag('Users', 'User management')
    .addTag('Invoices', 'Invoice management')
    .addTag('Expenses', 'Expense tracking')
    .addTag('Banking', 'Bank connections and transactions')
    .addTag('Tax', 'Tax management and compliance')
    .addTag('Reports', 'Financial reports')
    .addTag('Documents', 'Document management')
    .addTag('AI', 'AI-powered features')
    .addTag('Integrations', 'Third-party integrations')
    .addTag('Webhooks', 'Webhook management')
    .build();

  console.log('Generating OpenAPI document...');
  const document = SwaggerModule.createDocument(app, config);

  // Output directory
  const outputDir = path.join(__dirname, '../../..', 'docs', 'api');

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write OpenAPI JSON
  const jsonPath = path.join(outputDir, 'openapi.json');
  fs.writeFileSync(jsonPath, JSON.stringify(document, null, 2));
  console.log(`OpenAPI JSON saved to: ${jsonPath}`);

  // Write OpenAPI YAML (using simple conversion)
  const yamlContent = jsonToYaml(document);
  const yamlPath = path.join(outputDir, 'openapi.yaml');
  fs.writeFileSync(yamlPath, yamlContent);
  console.log(`OpenAPI YAML saved to: ${yamlPath}`);

  await app.close();
  console.log('Done!');
  process.exit(0);
}

// Simple JSON to YAML conversion
function jsonToYaml(obj: any, indent = 0): string {
  const spaces = '  '.repeat(indent);
  let yaml = '';

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      yaml += `${spaces}${key}: null\n`;
    } else if (typeof value === 'string') {
      if (value.includes('\n') || value.includes(':') || value.includes('#')) {
        yaml += `${spaces}${key}: |\n`;
        value.split('\n').forEach(line => {
          yaml += `${spaces}  ${line}\n`;
        });
      } else {
        yaml += `${spaces}${key}: "${value.replace(/"/g, '\\"')}"\n`;
      }
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      yaml += `${spaces}${key}: ${value}\n`;
    } else if (Array.isArray(value)) {
      yaml += `${spaces}${key}:\n`;
      value.forEach(item => {
        if (typeof item === 'object') {
          yaml += `${spaces}- \n${jsonToYaml(item, indent + 2).replace(/^/gm, '  ')}`;
        } else {
          yaml += `${spaces}- ${item}\n`;
        }
      });
    } else if (typeof value === 'object') {
      yaml += `${spaces}${key}:\n${jsonToYaml(value, indent + 1)}`;
    }
  }

  return yaml;
}

generateOpenApiSpec().catch(err => {
  console.error('Failed to generate OpenAPI spec:', err);
  process.exit(1);
});
