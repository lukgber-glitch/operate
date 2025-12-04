/**
 * German Template: Allgemeine Beschreibung (General Description)
 * Section 1 of Verfahrensdokumentation
 */

import { GeneralDescription } from '../../types/process-documentation.types';

export const GENERAL_DESCRIPTION_TEMPLATE_DE: Partial<GeneralDescription> = {
  companyInfo: {
    name: '{{COMPANY_NAME}}',
    legalForm: '{{LEGAL_FORM}}', // e.g., GmbH, AG, KG
    address: '{{COMPANY_ADDRESS}}',
    taxNumber: '{{TAX_NUMBER}}',
    vatId: '{{VAT_ID}}',
    registrationNumber: '{{REGISTRATION_NUMBER}}',
    industry: '{{INDUSTRY}}',
    employees: 0,
  },

  systemInfo: {
    name: 'OPERATE / CoachOS',
    version: '1.0.0',
    vendor: 'OPERATE GmbH',
    purpose: 'Enterprise SaaS-Plattform für SME-Geschäftsprozesse, Steuerautomatisierung und HR-Management',
    implementationDate: new Date(),
    operatingSystem: 'Cloud-basiert (Linux)',
    database: 'PostgreSQL',
  },

  scope: {
    coveredProcesses: [
      'Buchhaltung und Rechnungswesen',
      'Belegerfassung und -archivierung',
      'Umsatzsteuervoranmeldung (UStVA)',
      'Personalverwaltung',
      'Zeiterfassung',
      'Gehaltsabrechnung',
      'Dokumentenmanagement',
      'Steuerliche Klassifizierung',
      'Betriebsausgabenabzug',
    ],
    coveredDepartments: [
      'Finanzabteilung',
      'Personalabteilung',
      'Geschäftsführung',
    ],
    taxRelevantData: [
      'Eingangs- und Ausgangsrechnungen',
      'Belege und Quittungen',
      'Lohn- und Gehaltsabrechnungen',
      'Umsatzsteuervoranmeldungen',
      'Jahresabschlüsse',
      'Bankbewegungen',
      'Verträge',
    ],
    retentionPeriods: {
      'Steuerrelevante Dokumente': 10,
      'Geschäftsdokumente': 6,
      'Korrespondenz': 6,
      'HR-Dokumente': 10,
      'Rechtsdokumente': 30,
      'Temporäre Dokumente': 1,
    },
  },
};

/**
 * Template content in German
 */
export const GENERAL_DESCRIPTION_CONTENT_DE = `
# 1. Allgemeine Beschreibung

## 1.1 Unternehmensinformationen

**Firmenname:** {{COMPANY_NAME}}
**Rechtsform:** {{LEGAL_FORM}}
**Anschrift:** {{COMPANY_ADDRESS}}
**Steuernummer:** {{TAX_NUMBER}}
**Umsatzsteuer-ID:** {{VAT_ID}}
**Handelsregisternummer:** {{REGISTRATION_NUMBER}}
**Branche:** {{INDUSTRY}}
**Mitarbeiteranzahl:** {{EMPLOYEES}}

## 1.2 Systemübersicht

### 1.2.1 Systemname und Zweck

Das Unternehmen nutzt **OPERATE / CoachOS**, eine cloudbasierte Enterprise-SaaS-Plattform zur Verwaltung von:
- Finanzbuchhaltung und Rechnungswesen
- Steuerautomatisierung (UStVA, Betriebsausgaben)
- Personalverwaltung und Gehaltsabrechnung
- Dokumentenarchivierung (GoBD-konform)
- Zeiterfassung und Urlaubsverwaltung

### 1.2.2 Systemdetails

- **Hersteller:** OPERATE GmbH
- **Version:** 1.0.0
- **Implementierungsdatum:** {{IMPLEMENTATION_DATE}}
- **Betriebssystem:** Linux (Cloud)
- **Datenbank:** PostgreSQL
- **Hosting:** {{HOSTING_PROVIDER}}

### 1.2.3 Systemzweck

OPERATE / CoachOS dient der vollständigen digitalen Abwicklung aller steuerrelevanten Geschäftsvorfälle. Das System gewährleistet:
- Nachvollziehbare und unveränderbare Aufzeichnung aller Geschäftsvorfälle
- Ordnungsgemäße Archivierung gemäß GoBD
- Vollständige Audit-Trail-Dokumentation
- Verschlüsselte und integritätsgesicherte Datenhaltung

## 1.3 Geltungsbereich der Verfahrensdokumentation

### 1.3.1 Erfasste Geschäftsprozesse

Diese Verfahrensdokumentation beschreibt folgende Geschäftsprozesse:

1. **Buchhaltung und Rechnungswesen**
   - Eingangsrechnungsverarbeitung
   - Ausgangsrechnungserstellung
   - Zahlungsverkehr
   - Kontenabstimmung

2. **Steuerliche Prozesse**
   - Umsatzsteuervoranmeldung
   - Betriebsausgabenerfassung und -klassifizierung
   - Steuerliche Dokumentation
   - ELSTER-Übermittlung

3. **Personalverwaltung**
   - Mitarbeiterstammdaten
   - Gehaltsabrechnung
   - Zeiterfassung
   - Urlaubsverwaltung

4. **Dokumentenmanagement**
   - Belegerfassung
   - Archivierung
   - Versionierung
   - Aufbewahrungsfristen

### 1.3.2 Erfasste Abteilungen

- Finanzabteilung
- Personalabteilung
- Geschäftsführung

### 1.3.3 Steuerrelevante Daten

Folgende Daten werden als steuerrelevant klassifiziert und unterliegen besonderen Aufbewahrungs- und Dokumentationspflichten:

- Eingangs- und Ausgangsrechnungen
- Belege und Quittungen
- Bankkontoauszüge und Zahlungsnachweise
- Verträge
- Lohn- und Gehaltsabrechnungen
- Umsatzsteuervoranmeldungen
- Jahresabschlüsse

### 1.3.4 Aufbewahrungsfristen

| Dokumentenkategorie | Aufbewahrungsfrist |
|---------------------|---------------------|
| Steuerrelevante Dokumente (Rechnungen, Belege) | 10 Jahre |
| Geschäftsdokumente (Verträge, Korrespondenz) | 6 Jahre |
| HR-Dokumente | 10 Jahre |
| Rechtsdokumente | 30 Jahre |
| Temporäre Dokumente | 1 Jahr |

## 1.4 Gesetzliche Grundlagen

Diese Verfahrensdokumentation erfüllt die Anforderungen gemäß:
- **§ 146 AO** (Ordnungsvorschriften für die Buchführung)
- **§ 147 AO** (Ordnungsvorschriften für die Aufbewahrung von Unterlagen)
- **GoBD** (Grundsätze zur ordnungsmäßigen Führung und Aufbewahrung von Büchern, Aufzeichnungen und Unterlagen in elektronischer Form)
- **HGB** (Handelsgesetzbuch)
- **DSGVO** (Datenschutz-Grundverordnung)

## 1.5 Änderungshistorie

| Version | Datum | Änderung | Genehmigt durch |
|---------|-------|----------|-----------------|
| 1.0 | {{CREATION_DATE}} | Erstveröffentlichung | {{APPROVED_BY}} |
`;

/**
 * Get placeholders for template substitution
 */
export function getGeneralDescriptionPlaceholders(data: any): Record<string, string> {
  return {
    '{{COMPANY_NAME}}': data.companyInfo?.name || '[Firmenname]',
    '{{LEGAL_FORM}}': data.companyInfo?.legalForm || '[Rechtsform]',
    '{{COMPANY_ADDRESS}}': data.companyInfo?.address || '[Adresse]',
    '{{TAX_NUMBER}}': data.companyInfo?.taxNumber || '[Steuernummer]',
    '{{VAT_ID}}': data.companyInfo?.vatId || '[USt-IdNr.]',
    '{{REGISTRATION_NUMBER}}': data.companyInfo?.registrationNumber || '[Handelsregisternummer]',
    '{{INDUSTRY}}': data.companyInfo?.industry || '[Branche]',
    '{{EMPLOYEES}}': data.companyInfo?.employees?.toString() || '[Anzahl]',
    '{{IMPLEMENTATION_DATE}}': data.systemInfo?.implementationDate?.toLocaleDateString('de-DE') || new Date().toLocaleDateString('de-DE'),
    '{{HOSTING_PROVIDER}}': data.systemInfo?.hosting || 'Cloud (AWS/Azure/GCP)',
    '{{CREATION_DATE}}': new Date().toLocaleDateString('de-DE'),
    '{{APPROVED_BY}}': data.approvedBy || '[Zu genehmigen]',
  };
}
