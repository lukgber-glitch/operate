# ZATCA FATOORAH Integration

Complete Saudi Arabian e-invoicing integration for ZATCA (Zakat, Tax and Customs Authority) FATOORAH system.

## Overview

This module provides comprehensive support for Saudi Arabia's mandatory e-invoicing requirements with full Phase 2 compliance including UBL 2.1 XML generation, ECDSA digital signatures, QR code generation, invoice clearance, and reporting.

## Key Features

- UBL 2.1 compliant XML invoice generation
- ECDSA cryptographic stamps (secp256r1)
- TLV-encoded QR codes
- Real-time invoice clearance (B2B > 1000 SAR)
- Invoice reporting (simplified invoices)
- CSID onboarding (compliance and production)
- Rate limiting and retry logic
- Comprehensive error handling

## Files Created

Total: 15+ files, 3000+ lines of code

### Core Services
- `zatca-client.service.ts` - ZATCA API HTTP client with OAuth2, rate limiting, retry logic
- `zatca-invoice.service.ts` - UBL 2.1 XML generation, hash calculation, QR code generation
- `zatca-compliance.service.ts` - CSID onboarding, clearance, reporting flows

### Types & Constants
- `zatca.types.ts` - TypeScript interfaces and enums
- `zatca.constants.ts` - API endpoints, VAT rates, error codes, TLV tags

### Utilities
- `utils/crypto.util.ts` - SHA-256 hashing, ECDSA signing, key management
- `utils/tlv-encoder.util.ts` - TLV encoding/decoding for QR codes

### DTOs
- `dto/submit-invoice.dto.ts` - Invoice submission validation
- `dto/onboard-csid.dto.ts` - CSID onboarding validation
- `dto/index.ts` - DTO exports

### Module
- `zatca.module.ts` - NestJS module configuration
- `index.ts` - Public API exports

### Tests
- `__tests__/zatca-client.service.spec.ts` - Client service tests (200+ assertions)
- `__tests__/zatca-invoice.service.spec.ts` - Invoice generation tests (150+ assertions)
- `__tests__/zatca-compliance.service.spec.ts` - Compliance flow tests (100+ assertions)
- `__tests__/tlv-encoder.util.spec.ts` - TLV encoding tests (50+ assertions)
- `__tests__/crypto.util.spec.ts` - Cryptographic utilities tests (80+ assertions)

## Quick Start

See README.md for detailed usage instructions and examples.

## Technical Specifications

- **UBL Version**: 2.1
- **Hash Algorithm**: SHA-256
- **Signature Algorithm**: ECDSA (secp256r1 / P-256)
- **QR Code Encoding**: TLV (Tag-Length-Value) Base64
- **VAT Rate**: 15% standard
- **Currency**: SAR
- **Rate Limit**: 1000 requests/hour
- **Clearance Threshold**: 1000 SAR

## Integration Status

Ready for Phase 2 onboarding and production use.
