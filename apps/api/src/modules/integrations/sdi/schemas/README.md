# FatturaPA XML Schemas

This directory contains the XML Schema Definition (XSD) files for FatturaPA v1.2.2.

## Official Schemas

Download the official FatturaPA schemas from:
https://www.fatturapa.gov.it/export/documenti/fatturapa/v1.2.2/

Required files:
- `Schema_del_file_xml_FatturaPA_versione_1.2.2.xsd` - Main FatturaPA schema
- `xmldsig-core-schema.xsd` - XML Digital Signature schema

## Schema Versions

### FatturaPA v1.2.2 (Current)
- **Release Date**: 2024
- **Namespace**: `http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2`
- **Formats**:
  - FPA12: Public Administration (B2G)
  - FPR12: Private sector (B2B, B2C)

### Document Types Supported

| Code | Description |
|------|-------------|
| TD01 | Invoice |
| TD02 | Advance or down payment on invoice |
| TD03 | Advance or down payment on fee |
| TD04 | Credit note |
| TD05 | Debit note |
| TD06 | Fee, compensation or commission |
| TD16 | Internal reverse charge |
| TD17 | Integration/self-invoice for purchase of services from abroad |
| TD18 | Integration for purchase of goods from EU |
| TD19 | Integration/self-invoice for purchase of goods ex art.17 c.2 DPR 633/72 |
| TD20 | Self-invoice for regularization and integration of invoices |
| TD21 | Self-invoice for split payment |
| TD22 | Extraction from San Marino |
| TD23 | Integration of invoices for importation of goods already in free circulation |
| TD24 | Deferred invoice |
| TD25 | Deferred credit note |
| TD26 | Sale of depreciable assets and for internal transfers |
| TD27 | Self-invoice for self-consumption or for free allocation without recourse |

## Schema Structure

### FatturaElettronica Root Element

```xml
<p:FatturaElettronica versione="FPR12" xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2">
  <FatturaElettronicaHeader>
    <DatiTrasmissione>...</DatiTrasmissione>
    <CedentePrestatore>...</CedentePrestatore>
    <CessionarioCommittente>...</CessionarioCommittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali>...</DatiGenerali>
    <DatiBeniServizi>...</DatiBeniServizi>
    <DatiPagamento>...</DatiPagamento>
  </FatturaElettronicaBody>
</p:FatturaElettronica>
```

## Validation

The SDI performs automatic validation against the XSD schema.
Common validation errors:

- **00001**: File format error
- **00002**: File name error
- **00003**: Transmitter code not found
- **00004**: Recipient code not found
- **00100-00199**: Header errors
- **00200-00299**: Body errors
- **00300-00399**: Payment data errors
- **00400-00499**: Tax data errors

## Digital Signature

All FatturaPA invoices must be digitally signed:
- **Format**: CAdES-BES (PKCS#7) or XAdES-BES (XML)
- **File Extension**: .p7m for CAdES-BES
- **Algorithm**: RSA-SHA256 or stronger
- **Certificate**: Qualified certificate from accredited CA

## Resources

- [FatturaPA Official Site](https://www.fatturapa.gov.it/)
- [SDI Technical Specifications](https://www.fatturapa.gov.it/export/documenti/fatturapa/v1.2.2/Specifiche_tecniche_v1.2.2.pdf)
- [Codice Destinatario Registry](https://www.indicepa.gov.it/)
- [Agenzia delle Entrate](https://www.agenziaentrate.gov.it/)

## Filename Format

FatturaPA XML files must follow this naming convention:

```
CCNNNNNNNNNNN_PPPPP.xml
```

Where:
- **CC**: Country code (IT)
- **NNNNNNNNNNN**: Partita IVA (11 digits)
- **PPPPP**: Progressive number (up to 5 alphanumeric characters)

Example: `IT12345678901_00001.xml`

Signed files add .p7m extension:
`IT12345678901_00001.xml.p7m`

## Testing

Use the SDI test environment for validation:
- **Test Endpoint**: https://testservizi.fatturapa.it/sdi
- **Test Recipient Codes**: 0000000 (use with PEC email)
