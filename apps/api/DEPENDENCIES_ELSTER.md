# ELSTER Module Dependencies

## Required NPM Packages

Add these dependencies to your `package.json`:

```json
{
  "dependencies": {
    "node-forge": "^1.3.1"
  },
  "devDependencies": {
    "@types/node-forge": "^1.3.11"
  }
}
```

## Installation

```bash
# Install runtime dependency
npm install node-forge

# Install TypeScript types
npm install -D @types/node-forge
```

## About node-forge

**node-forge** is a native JavaScript implementation of TLS and various networking and cryptographic tools.

### Why node-forge?

1. **PKCS#12 Support**: Native support for parsing .pfx/.p12 certificate files
2. **Certificate Parsing**: Extract metadata (serial number, issuer, subject, validity dates)
3. **Pure JavaScript**: No native dependencies, works across all platforms
4. **Well-maintained**: Active development, security updates
5. **Comprehensive**: Supports various crypto operations beyond certificates

### Security

- Open source: https://github.com/digitalbazaar/forge
- Regular security audits
- Used by major projects (Webpack, Karma, etc.)
- No native dependencies (reduces attack surface)

### Alternatives Considered

| Package | Why Not Used |
|---------|--------------|
| `x509` | Limited PKCS#12 support |
| `pkijs` | Heavier, more complex API |
| Native `crypto` | No PKCS#12 parsing support |
| `asn1js` | Low-level, requires more code |

### Version Compatibility

- **node-forge 1.3.1**: Latest stable version
- **Node.js**: Compatible with Node 12+
- **TypeScript**: Full type definitions included

## Existing Dependencies

The ELSTER module also uses these existing project dependencies:

```json
{
  "dependencies": {
    "@nestjs/common": "^10.x",
    "@nestjs/config": "^3.x",
    "@prisma/client": "^5.x"
  }
}
```

These should already be installed in your NestJS project.

## Verify Installation

After installing, verify the package:

```bash
# Check if node-forge is installed
npm list node-forge

# Expected output:
# └── node-forge@1.3.1

# Run tests to verify integration
npm test elster-certificate.service.spec.ts
```

## TypeScript Configuration

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

This ensures proper import of node-forge types.

## Usage in Service

```typescript
import * as forge from 'node-forge';

// Parse PKCS#12 certificate
const p12Asn1 = forge.asn1.fromDer(certificate.toString('binary'));
const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

// Extract certificates and keys
const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
```

## License

node-forge is licensed under BSD-3-Clause, compatible with commercial use.
