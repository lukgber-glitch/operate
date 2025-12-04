/**
 * German Template: Anwenderdokumentation (User Documentation)
 * Section 2 of Verfahrensdokumentation
 */

import { UserDocumentation, UserRole, BusinessProcess } from '../../types/process-documentation.types';

export const USER_DOCUMENTATION_TEMPLATE_DE: Partial<UserDocumentation> = {
  roles: [
    {
      roleName: 'Geschäftsführung (Owner)',
      description: 'Vollzugriff auf alle Funktionen und Daten',
      responsibilities: [
        'Strategische Entscheidungen',
        'Genehmigung von Jahresabschlüssen',
        'Benutzerverwaltung',
        'Systemkonfiguration',
      ],
      permissions: ['Alle'],
    },
    {
      roleName: 'Administrator (Admin)',
      description: 'Technische Systemverwaltung',
      responsibilities: [
        'Benutzerverwaltung',
        'Systemkonfiguration',
        'Backup-Verwaltung',
        'Integration Management',
      ],
      permissions: ['Systemverwaltung', 'Benutzerverwaltung', 'Audit-Logs einsehen'],
    },
    {
      roleName: 'Buchhaltung (Manager)',
      description: 'Finanz- und Buchhaltungsprozesse',
      responsibilities: [
        'Rechnungserstellung',
        'Belegerfassung',
        'Zahlungsverkehr',
        'UStVA-Erstellung',
        'Steuerliche Prüfung',
      ],
      permissions: ['Rechnungen erstellen/bearbeiten', 'Belege erfassen', 'Zahlungen verwalten', 'Steuerberichte erstellen'],
    },
    {
      roleName: 'Personalabteilung (HR Manager)',
      description: 'Personalverwaltung und Gehaltsabrechnung',
      responsibilities: [
        'Mitarbeiterverwaltung',
        'Gehaltsabrechnung',
        'Urlaubsverwaltung',
        'Zeiterfassung',
      ],
      permissions: ['Mitarbeiter verwalten', 'Gehaltsabrechnungen erstellen', 'Urlaub genehmigen', 'Zeiterfassung einsehen'],
    },
    {
      roleName: 'Mitarbeiter (Member)',
      description: 'Standard-Benutzer mit eingeschränktem Zugriff',
      responsibilities: [
        'Eigene Belege erfassen',
        'Eigene Zeiterfassung',
        'Eigene Urlaubsanträge',
      ],
      permissions: ['Eigene Daten einsehen', 'Belege hochladen', 'Zeit erfassen', 'Urlaub beantragen'],
    },
    {
      roleName: 'Betrachter (Viewer)',
      description: 'Nur-Lese-Zugriff auf ausgewählte Bereiche',
      responsibilities: ['Berichte einsehen', 'Dashboard anzeigen'],
      permissions: ['Lesen'],
    },
  ],

  processes: [],

  workflows: [
    {
      name: 'Eingangsrechnung verarbeiten',
      description: 'Workflow für die Verarbeitung von Eingangsrechnungen',
      triggerEvent: 'E-Mail-Eingang oder manueller Upload',
      steps: [
        'Rechnung hochladen oder per E-Mail empfangen',
        'OCR-Extraktion der Rechnungsdaten',
        'Manuelle Prüfung und Korrektur',
        'Freigabe durch Buchhaltung',
        'Buchung im System',
        'Archivierung als unveränderbar',
      ],
      expectedOutcome: 'Rechnung ist gebucht und archiviert',
      errorHandling: 'Bei Fehlern: Manuelle Nachbearbeitung erforderlich, Fehlerbenachrichtigung an Buchhaltung',
    },
    {
      name: 'Ausgangsrechnung erstellen',
      description: 'Workflow für Erstellung und Versand von Ausgangsrechnungen',
      triggerEvent: 'Manuell durch Buchhaltung oder automatisch (wiederkehrende Rechnungen)',
      steps: [
        'Rechnungsdaten eingeben',
        'Vorschau prüfen',
        'PDF generieren',
        'Rechnung versenden (E-Mail)',
        'Rechnung als gesendet markieren',
        'Archivierung',
        'Zahlungserinnerung aktivieren',
      ],
      expectedOutcome: 'Rechnung versendet und archiviert',
      errorHandling: 'Bei Versandfehler: Erneuter Versuch oder manueller Versand',
    },
    {
      name: 'UStVA erstellen und übermitteln',
      description: 'Umsatzsteuervoranmeldung erstellen und an ELSTER übermitteln',
      triggerEvent: 'Monatlich oder quartalsweise (konfigurierbar)',
      steps: [
        'Zeitraum auswählen',
        'Daten automatisch berechnen',
        'Manuelle Prüfung durch Buchhaltung',
        'ELSTER-Zertifikat auswählen',
        'An ELSTER übermitteln',
        'Transferticket erhalten',
        'Bestätigung abwarten',
        'Archivierung der UStVA',
      ],
      expectedOutcome: 'UStVA erfolgreich übermittelt',
      errorHandling: 'Bei ELSTER-Fehler: Fehlerprotokoll prüfen, Korrektur, erneute Übermittlung',
    },
  ],

  training: {
    manualAvailable: true,
    trainingRequired: true,
    trainingFrequency: 'Bei Neueinstellung und bei größeren Updates',
  },
};

/**
 * Template content in German
 */
export const USER_DOCUMENTATION_CONTENT_DE = `
# 2. Anwenderdokumentation

## 2.1 Benutzerrollen und Berechtigungen

Das System implementiert ein rollenbasiertes Zugriffskontrollsystem (RBAC). Jeder Benutzer wird einer oder mehreren Rollen zugewiesen.

### 2.1.1 Rollendefinitionen

{{ROLES_TABLE}}

### 2.1.2 Funktionsmatrix

| Funktion | Owner | Admin | Manager | Member | Viewer |
|----------|-------|-------|---------|--------|--------|
| Dashboard anzeigen | ✓ | ✓ | ✓ | ✓ | ✓ |
| Rechnungen erstellen | ✓ | ✓ | ✓ | - | - |
| Rechnungen genehmigen | ✓ | ✓ | ✓ | - | - |
| Belege hochladen | ✓ | ✓ | ✓ | ✓ | - |
| Zahlungen verwalten | ✓ | ✓ | ✓ | - | - |
| UStVA erstellen | ✓ | ✓ | ✓ | - | - |
| Mitarbeiter verwalten | ✓ | ✓ | HR | - | - |
| Gehaltsabrechnungen | ✓ | ✓ | HR | - | - |
| Zeiterfassung (eigene) | ✓ | ✓ | ✓ | ✓ | - |
| Zeiterfassung (alle) | ✓ | ✓ | HR | - | - |
| Urlaub beantragen | ✓ | ✓ | ✓ | ✓ | - |
| Urlaub genehmigen | ✓ | ✓ | ✓ | - | - |
| Berichte anzeigen | ✓ | ✓ | ✓ | - | ✓ |
| Systemeinstellungen | ✓ | ✓ | - | - | - |
| Benutzerverwaltung | ✓ | ✓ | - | - | - |
| Audit-Logs einsehen | ✓ | ✓ | - | - | - |

## 2.2 Geschäftsprozesse

### 2.2.1 Eingangsrechnungsverarbeitung

**Prozessverantwortlich:** Buchhaltung

**Beschreibung:** Eingangsrechnungen werden empfangen, geprüft, gebucht und archiviert.

**Ablauf:**

1. **Rechnungseingang** (Automatisch oder manuell)
   - Per E-Mail an rechnungen@[domain].de
   - Manueller Upload im System
   - OCR-Extraktion der Rechnungsdaten

2. **Datenkontrolle** (Buchhaltung)
   - Prüfung auf Vollständigkeit
   - Prüfung auf Richtigkeit
   - Manuelle Korrektur falls erforderlich

3. **Klassifizierung** (Automatisch + manuell)
   - KI-basierte Kategorisierung
   - Steuerliche Bewertung
   - Vorsteuerabzug prüfen

4. **Freigabe** (Buchhaltung/Manager)
   - Freigabe der Buchung
   - Zahlungsfreigabe

5. **Buchung** (System)
   - Automatische Buchung im Journal
   - Unveränderbare Speicherung

6. **Archivierung** (System)
   - Verschlüsselte Archivierung
   - Hash-Berechnung für Integrität
   - 10-jährige Aufbewahrung

**Eingaben:** PDF-Rechnung, E-Mail

**Ausgaben:** Gebuchte Rechnung, Archiviertes Dokument

**Kontrollen:**
- Vollständigkeitsprüfung (Pflichtfelder)
- Vier-Augen-Prinzip bei Beträgen > 5.000 €
- Duplikatsprüfung anhand Rechnungsnummer

### 2.2.2 Ausgangsrechnungserstellung

**Prozessverantwortlich:** Buchhaltung

**Beschreibung:** Ausgangsrechnungen werden erstellt, versendet und archiviert.

**Ablauf:**

1. **Rechnungserstellung** (Buchhaltung)
   - Kundendaten auswählen
   - Leistungen/Produkte hinzufügen
   - Umsatzsteuer berechnen
   - Rechnungsnummer automatisch generieren

2. **Prüfung** (Buchhaltung)
   - Vorschau anzeigen
   - Daten prüfen
   - Korrekturen vornehmen

3. **Freigabe** (Manager/Owner)
   - Bei Beträgen > 10.000 € erforderlich

4. **PDF-Generierung** (System)
   - PDF nach GoBD-Standard generieren
   - Signatur/Wasserzeichen hinzufügen

5. **Versand** (System)
   - E-Mail-Versand an Kunden
   - Versandbestätigung

6. **Archivierung** (System)
   - Unveränderbare Archivierung
   - 10-jährige Aufbewahrung

7. **Zahlungsüberwachung** (System)
   - Automatische Zahlungserinnerungen
   - Mahnwesen

**Eingaben:** Kundendaten, Leistungsbeschreibung

**Ausgaben:** PDF-Rechnung, E-Mail

**Kontrollen:**
- Pflichtangaben gemäß § 14 UStG
- Fortlaufende Rechnungsnummer
- Duplikatsvermeidung

### 2.2.3 Umsatzsteuervoranmeldung (UStVA)

**Prozessverantwortlich:** Buchhaltung

**Beschreibung:** Monatliche/quartalsweise UStVA-Erstellung und Übermittlung an ELSTER.

**Ablauf:**

1. **Zeitraumauswahl** (Buchhaltung)
   - Monat/Quartal auswählen

2. **Datenberechnung** (System)
   - Umsatzsteuer aus Ausgangsrechnungen
   - Vorsteuer aus Eingangsrechnungen
   - Automatische Berechnung der Zahllast/Erstattung

3. **Manuelle Prüfung** (Buchhaltung)
   - Plausibilitätsprüfung
   - Korrekturen falls erforderlich

4. **ELSTER-Übermittlung** (System)
   - Auswahl des ELSTER-Zertifikats
   - Signierung der Daten
   - Übermittlung an ELSTER

5. **Bestätigung** (System)
   - Transferticket erhalten
   - Auf Annahme/Ablehnung warten
   - Fehlerbehandlung bei Ablehnung

6. **Archivierung** (System)
   - UStVA-XML archivieren
   - Übermittlungsprotokoll speichern

**Eingaben:** Buchungen des Zeitraums

**Ausgaben:** ELSTER-XML, Transferticket

**Kontrollen:**
- Vollständigkeit aller Buchungen
- Plausibilitätsprüfung
- ELSTER-Validierung

## 2.3 Benutzer-Workflows

### 2.3.1 Eingangsrechnung verarbeiten

{{WORKFLOW_EINGANGSRECHNUNG}}

### 2.3.2 Ausgangsrechnung erstellen

{{WORKFLOW_AUSGANGSRECHNUNG}}

### 2.3.3 UStVA erstellen und übermitteln

{{WORKFLOW_USTVA}}

## 2.4 Schulung und Handbücher

### 2.4.1 Verfügbare Dokumentation

- **Benutzerhandbuch:** Vollständiges Handbuch für alle Benutzerrollen (PDF)
- **Online-Hilfe:** Kontextsensitive Hilfe im System
- **Video-Tutorials:** Schritt-für-Schritt-Anleitungen für häufige Aufgaben
- **FAQ:** Häufig gestellte Fragen und Antworten

### 2.4.2 Schulungsanforderungen

Alle neuen Benutzer müssen vor der ersten Nutzung geschult werden:
- **Einweisung:** 2 Stunden (allgemeine Systemnutzung)
- **Rollenspezifische Schulung:** 2-4 Stunden (abhängig von der Rolle)
- **Auffrischungsschulung:** Bei größeren Updates

### 2.4.3 Schulungsnachweis

Alle Schulungen werden dokumentiert und im System hinterlegt.
`;

export function getUserDocumentationPlaceholders(data: any): Record<string, string> {
  const rolesTable = data.roles?.map((role: UserRole) =>
    `| ${role.roleName} | ${role.description} | ${role.responsibilities.join(', ')} |`
  ).join('\n') || '[Rollen fehlen]';

  return {
    '{{ROLES_TABLE}}': rolesTable,
    '{{WORKFLOW_EINGANGSRECHNUNG}}': data.workflows?.[0]?.steps?.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n') || '',
    '{{WORKFLOW_AUSGANGSRECHNUNG}}': data.workflows?.[1]?.steps?.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n') || '',
    '{{WORKFLOW_USTVA}}': data.workflows?.[2]?.steps?.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n') || '',
  };
}
