/**
 * German Template: Technische Systemdokumentation (Technical Documentation)
 * Section 3 of Verfahrensdokumentation
 */

import { TechnicalDocumentation } from '../../types/process-documentation.types';

export const TECHNICAL_DOCUMENTATION_TEMPLATE_DE: Partial<TechnicalDocumentation> = {
  architecture: {
    overview: 'Microservice-basierte Cloud-Architektur mit separaten Services für API, Web-Frontend, Worker und Datenbank',
    components: [
      {
        name: 'API Server',
        type: 'Backend API',
        description: 'RESTful API für alle Geschäftslogik',
        technology: 'NestJS (Node.js)',
        version: '1.0.0',
        dependencies: ['PostgreSQL', 'Redis', 'S3-kompatiblerSpeicher'],
      },
      {
        name: 'Web Frontend',
        type: 'Single Page Application',
        description: 'Benutzeroberfläche für Web-Browser',
        technology: 'Next.js 14 (React)',
        version: '1.0.0',
        dependencies: ['API Server'],
      },
      {
        name: 'Worker Services',
        type: 'Background Jobs',
        description: 'Asynchrone Verarbeitung (E-Mails, Reports, Cron-Jobs)',
        technology: 'NestJS + BullMQ',
        version: '1.0.0',
        dependencies: ['Redis', 'API Server'],
      },
      {
        name: 'PostgreSQL',
        type: 'Database',
        description: 'Relationale Hauptdatenbank',
        technology: 'PostgreSQL 15',
        version: '15.0',
      },
      {
        name: 'Redis',
        type: 'Cache & Queue',
        description: 'Caching und Job-Queue',
        technology: 'Redis 7',
        version: '7.0',
      },
      {
        name: 'Object Storage',
        type: 'File Storage',
        description: 'Verschlüsselte Dokumentenablage',
        technology: 'S3-kompatibel (AWS S3 / MinIO)',
        version: '-',
      },
    ],
    infrastructure: 'Cloud-nativ (Kubernetes oder Container-basiert)',
    hosting: 'Cloud-Provider (AWS, Azure oder GCP)',
    scalability: 'Horizontal skalierbar über Container-Orchestrierung',
  },

  dataFlow: {
    description: 'Alle Daten durchlaufen eine dreistufige Pipeline: Eingabe → Verarbeitung → Archivierung',
    inputSources: [
      'Manuelle Benutzereingaben',
      'E-Mail-Empfang (IMAP/SMTP)',
      'API-Importe',
      'Datei-Uploads',
      'Bank-Synchronisation (Open Banking)',
      'ELSTER-Rückmeldungen',
    ],
    outputDestinations: [
      'Web-Dashboard',
      'PDF-Reports',
      'E-Mail-Versand',
      'ELSTER-Übermittlung',
      'API-Exporte',
      'Archivierte Dokumente',
    ],
    dataTransformations: [
      'OCR-Texterkennung',
      'KI-basierte Klassifizierung',
      'Verschlüsselung (AES-256-GCM)',
      'Hash-Berechnung (SHA-256)',
      'PDF-Generierung',
      'XML-Transformation (ELSTER)',
    ],
  },

  interfaces: [
    {
      name: 'REST API',
      type: 'HTTP REST',
      description: 'Haupt-API für Frontend und Integrationen',
      protocol: 'HTTPS (TLS 1.3)',
      dataFormat: 'JSON',
      authentication: 'JWT Bearer Token',
      rateLimit: '1000 requests/minute pro Benutzer',
    },
    {
      name: 'WebSocket',
      type: 'Real-time',
      description: 'Echtzeit-Benachrichtigungen',
      protocol: 'WSS (WebSocket Secure)',
      dataFormat: 'JSON',
      authentication: 'JWT',
    },
    {
      name: 'ELSTER-Schnittstelle',
      type: 'External API',
      description: 'Übermittlung von Steuerdaten',
      protocol: 'HTTPS',
      dataFormat: 'XML (ELSTER-Format)',
      authentication: 'Zertifikat-basiert (PKCS#12)',
    },
    {
      name: 'E-Mail-Import',
      type: 'IMAP/SMTP',
      description: 'E-Mail-Empfang und -Versand',
      protocol: 'IMAPS/SMTPS',
      dataFormat: 'MIME',
      authentication: 'OAuth 2.0 oder Passwort',
    },
    {
      name: 'Bank-Integration',
      type: 'Open Banking',
      description: 'Banktransaktions-Synchronisation',
      protocol: 'HTTPS',
      dataFormat: 'JSON',
      authentication: 'OAuth 2.0',
    },
  ],

  dataStructure: {
    databaseSchema: 'Prisma ORM Schema mit 80+ Tabellen',
    keyTables: [
      'Organisation (Mandanten)',
      'User (Benutzer)',
      'Invoice (Rechnungen)',
      'Expense (Ausgaben)',
      'Employee (Mitarbeiter)',
      'AuditLog (Audit-Trail)',
      'ArchivedDocument (Dokumente)',
      'ProcessDocumentation (Verfahrensdokumentation)',
    ],
    dataRetention: 'Gesetzliche Aufbewahrungsfristen (6-10 Jahre)',
    archiveFormat: 'Verschlüsselte Binärdaten (AES-256-GCM) + JSON-Metadaten',
  },

  security: {
    encryption: {
      atRest: true,
      inTransit: true,
      algorithm: 'AES-256-GCM (at rest), TLS 1.3 (in transit)',
    },
    authentication: {
      method: 'JWT mit Refresh Tokens',
      mfaEnabled: true,
      sessionManagement: 'Session-Tokens mit automatischem Ablauf (1 Stunde)',
    },
    authorization: {
      model: 'RBAC (Role-Based Access Control)',
      accessControl: 'Rollenbasierte Zugriffskontrolle mit Organisationskontext',
    },
    auditLogging: {
      enabled: true,
      immutability: true,
      hashChain: true,
      retention: 10,
    },
  },
};

export const TECHNICAL_DOCUMENTATION_CONTENT_DE = `
# 3. Technische Systemdokumentation

## 3.1 Systemarchitektur

### 3.1.1 Architekturübersicht

OPERATE / CoachOS folgt einer **Microservice-basierten Cloud-Architektur**:

\`\`\`
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                        │
└────────────┬────────────────────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼────┐      ┌────▼────┐
│  Web   │      │   API   │
│Frontend│◄─────┤ Server  │
│(Next.js│      │(NestJS) │
└────────┘      └───┬─────┘
                    │
       ┌────────────┼──────────────┐
       │            │              │
   ┌───▼───┐   ┌───▼───┐    ┌─────▼─────┐
   │Worker │   │Redis  │    │PostgreSQL │
   │Service│   │Cache  │    │ Database  │
   └───┬───┘   └───────┘    └───────────┘
       │
   ┌───▼────────┐
   │  Object    │
   │  Storage   │
   │ (S3/MinIO) │
   └────────────┘
\`\`\`

### 3.1.2 Systemkomponenten

{{COMPONENTS_TABLE}}

### 3.1.3 Hosting und Infrastruktur

- **Hosting:** Cloud-basiert (AWS, Azure oder GCP)
- **Container-Technologie:** Docker
- **Orchestrierung:** Kubernetes oder Docker Compose
- **Skalierung:** Horizontal skalierbar
- **Verfügbarkeit:** 99,9% SLA (angestrebt)

## 3.2 Datenfluss

### 3.2.1 Datenfluss-Diagramm

\`\`\`mermaid
graph TB
    A[Benutzer] -->|HTTPS| B[Load Balancer]
    B --> C[API Server]
    C -->|Read/Write| D[(PostgreSQL)]
    C -->|Cache| E[(Redis)]
    C -->|Store Files| F[Object Storage]
    C -->|Queue Jobs| G[Worker Service]
    G -->|Process| D
    G -->|Send| H[ELSTER]
    G -->|Send| I[E-Mail]
    J[E-Mail Server] -->|Receive| C
    K[Bank API] -->|Sync| C
\`\`\`

### 3.2.2 Datenquellen (Input)

- **Manuelle Eingaben:** Benutzer geben Daten über Web-UI ein
- **E-Mail-Empfang:** Rechnungen werden per E-Mail empfangen
- **Datei-Uploads:** PDFs, Bilder, Excel-Dateien
- **Bank-Synchronisation:** Transaktionen per Open Banking API
- **API-Integrationen:** Externe Systeme (Lexoffice, DATEV, etc.)
- **ELSTER-Rückmeldungen:** Statusupdates von Behörden

### 3.2.3 Datenziele (Output)

- **Web-Dashboard:** Visualisierung für Benutzer
- **PDF-Reports:** Berichte, Rechnungen, UStVA
- **E-Mail-Versand:** Rechnungen, Benachrichtigungen
- **ELSTER-Übermittlung:** Steuererklärungen
- **API-Exporte:** GoBD-Export, SAF-T-Export
- **Archivierte Dokumente:** Langzeitarchivierung

### 3.2.4 Datenverarbeitungs-Pipeline

1. **Eingang:** Daten werden empfangen (Upload, E-Mail, API)
2. **Validierung:** Pflichtfelder, Format, Plausibilität
3. **OCR/Extraktion:** Text und Daten werden extrahiert
4. **KI-Klassifizierung:** Automatische Kategorisierung
5. **Verschlüsselung:** Sensible Daten werden verschlüsselt
6. **Speicherung:** Daten in PostgreSQL, Dateien in Object Storage
7. **Audit-Log:** Jede Änderung wird im Audit-Log festgehalten
8. **Hash-Chain:** Audit-Log-Eintrag wird in Hash-Kette aufgenommen

## 3.3 Schnittstellen

### 3.3.1 REST API

- **Endpunkt:** https://api.operate.app/v1
- **Protokoll:** HTTPS (TLS 1.3)
- **Datenformat:** JSON
- **Authentifizierung:** JWT Bearer Token
- **Rate Limiting:** 1000 Requests/Minute pro Benutzer
- **Versionierung:** URI-basiert (/v1, /v2)

**Hauptendpunkte:**
- \`GET /organisations/:id\` - Organisation abrufen
- \`POST /invoices\` - Rechnung erstellen
- \`GET /invoices/:id\` - Rechnung abrufen
- \`POST /expenses\` - Ausgabe erfassen
- \`POST /elster/ustva\` - UStVA übermitteln
- \`GET /compliance/report\` - Compliance-Bericht

### 3.3.2 WebSocket

- **Endpunkt:** wss://api.operate.app/ws
- **Protokoll:** WebSocket Secure (WSS)
- **Datenformat:** JSON
- **Authentifizierung:** JWT

**Ereignisse:**
- \`notification\` - Neue Benachrichtigung
- \`invoice.created\` - Rechnung erstellt
- \`payment.received\` - Zahlung eingegangen
- \`alert\` - Systemwarnung

### 3.3.3 ELSTER-Schnittstelle

- **Anbieter:** Elster.de oder tigerVAT (Drittanbieter)
- **Protokoll:** HTTPS
- **Datenformat:** XML (ERiC-Format)
- **Authentifizierung:** PKCS#12-Zertifikat
- **Verwendung:** UStVA-Übermittlung

### 3.3.4 E-Mail-Integration

- **Empfang:** IMAP(S) für Rechnungsempfang
- **Versand:** SMTP(S) für Rechnungsversand
- **Authentifizierung:** OAuth 2.0 (Gmail, Outlook) oder Passwort
- **Verschlüsselung:** TLS

### 3.3.5 Bank-Integration (Open Banking)

- **Provider:** Tink, Plaid, GoCardless, FinAPI
- **Protokoll:** HTTPS (REST API)
- **Standard:** PSD2-konform
- **Authentifizierung:** OAuth 2.0
- **Datenformat:** JSON

## 3.4 Datenbankstruktur

### 3.4.1 Datenbank-Technologie

- **DBMS:** PostgreSQL 15
- **ORM:** Prisma
- **Schema-Verwaltung:** Prisma Migrations
- **Backup:** Automatische tägliche Backups

### 3.4.2 Haupttabellen

| Tabelle | Beschreibung | Steuerrelevant | Aufbewahrung |
|---------|--------------|----------------|--------------|
| Organisation | Mandanten | Nein | Permanent |
| User | Benutzer | Nein | Permanent |
| Invoice | Rechnungen | Ja | 10 Jahre |
| Expense | Ausgaben | Ja | 10 Jahre |
| Transaction | Transaktionen | Ja | 10 Jahre |
| Employee | Mitarbeiter | Ja | 10 Jahre |
| Payslip | Gehaltsabrechnungen | Ja | 10 Jahre |
| AuditLog | Änderungsprotokoll | Ja | 10 Jahre |
| ArchivedDocument | Archivierte Dokumente | Ja | 10 Jahre |

### 3.4.3 Datenintegrität

- **Constraints:** Foreign Keys, Unique Constraints
- **Indizes:** Optimierte Abfragen für häufige Zugriffe
- **Hash-Chain:** Audit-Log ist durch Hash-Kette gesichert
- **Checksums:** Dokumente haben SHA-256-Prüfsummen

## 3.5 Sicherheit

### 3.5.1 Verschlüsselung

**Verschlüsselung im Ruhezustand (at rest):**
- Algorithmus: AES-256-GCM
- Key Management: Separate Verschlüsselungsschlüssel pro Mandant
- Dokumente: Verschlüsselt in Object Storage
- Datenbank: Transparent Data Encryption (TDE)

**Verschlüsselung während Übertragung (in transit):**
- Protokoll: TLS 1.3
- Zertifikate: Let's Encrypt (automatische Erneuerung)
- HSTS: HTTP Strict Transport Security aktiviert

### 3.5.2 Authentifizierung

- **Methode:** JWT (JSON Web Tokens)
- **Session-Dauer:** Access Token: 1 Stunde, Refresh Token: 7 Tage
- **Multi-Faktor-Authentifizierung (MFA):** TOTP (Time-based One-Time Password)
- **Passwort-Policy:**
  - Mindestlänge: 12 Zeichen
  - Komplexität: Groß-/Kleinbuchstaben, Zahlen, Sonderzeichen
  - Passwort-History: Letzte 5 Passwörter nicht wiederverwendbar

### 3.5.3 Autorisierung

- **Modell:** RBAC (Role-Based Access Control)
- **Rollen:** Owner, Admin, Manager, Member, Viewer
- **Organisationskontext:** Jeder Benutzer hat Zugriff nur auf eigene Organisation
- **API-Level:** Jeder Endpunkt prüft Berechtigung

### 3.5.4 Audit-Logging

Alle Änderungen werden im **GoBD-konformen Audit-Log** festgehalten:
- **Immutabilität:** Einträge können nicht geändert oder gelöscht werden
- **Hash-Chain:** Jeder Eintrag verweist auf vorherigen (wie Blockchain)
- **Inhalt:** Entity-Typ, Entity-ID, Aktion, Vorher-/Nachher-Zustand, Zeitstempel, Benutzer, IP-Adresse
- **Aufbewahrung:** 10 Jahre

### 3.5.5 Penetration Testing

- **Frequenz:** Jährlich durch externen Dienstleister
- **Scope:** Gesamtsystem (API, Frontend, Datenbank)
- **Bericht:** Dokumentiert und archiviert
`;

export function getTechnicalDocumentationPlaceholders(data: any): Record<string, string> {
  const componentsTable = data.architecture?.components?.map((c: any) =>
    `| ${c.name} | ${c.type} | ${c.description} | ${c.technology} | ${c.version} |`
  ).join('\n') || '[Komponenten fehlen]';

  return {
    '{{COMPONENTS_TABLE}}': `| Name | Typ | Beschreibung | Technologie | Version |\n|------|-----|--------------|-------------|---------|
\n${componentsTable}`,
  };
}
