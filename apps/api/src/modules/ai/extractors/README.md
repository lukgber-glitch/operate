# Invoice Extractor Service

AI-powered invoice data extraction using OpenAI GPT-4 Vision API.

## Overview

The Invoice Extractor Service uses GPT-4 Vision to extract structured data from invoice PDFs and images. It supports German, Austrian, and international invoice formats with high accuracy and confidence scoring.

## Features

- **Multi-format Support**: PDF, PNG, JPG, JPEG
- **Multi-page Processing**: Handles multi-page invoices with intelligent merging
- **High Accuracy**: GPT-4 Vision with structured JSON output
- **Confidence Scoring**: Field-level and overall confidence scores
- **Validation**: Automatic validation and correction of extracted data
- **Async Processing**: BullMQ integration for background extraction
- **Fallback Strategy**: Text-based extraction for PDFs when image conversion fails
- **Multi-language**: German, Austrian, and international formats

## Dependencies

Required dependencies:
- openai (GPT-4 Vision API)
- pdf-parse (PDF text extraction)
- sharp (image optimization)
- @nestjs/bull + bull (async processing)

## Configuration

Environment variables:
- OPENAI_API_KEY (required)
- REDIS_HOST, REDIS_PORT (for BullMQ)

## Database Migration

After creating the ExtractedInvoice model, run:
```bash
cd packages/database
pnpm prisma migrate dev --name add_extracted_invoice
pnpm prisma generate
```
