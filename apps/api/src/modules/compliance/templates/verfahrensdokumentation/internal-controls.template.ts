/**
 * German Template: Internes Kontrollsystem (Internal Controls)
 * Section 5 of Verfahrensdokumentation
 */

import { InternalControls } from '../../types/process-documentation.types';

export const INTERNAL_CONTROLS_TEMPLATE_DE: Partial<InternalControls> = {
  segregationOfDuties: {
    implemented: true,
    description: 'Vier-Augen-Prinzip für kritische Operationen',
    criticalFunctions: [
      {
        function1: 'Rechnung erstellen',
        function2: 'Rechnung genehmigen',
        reason: 'Vermeidung von Betrug und Fehlern',
        implementation: 'Systemseitige Trennung: Ersteller ≠ Genehmiger',
      },
      {
        function1: 'Zahlungen auslösen',
        function2: 'Zahlungen genehmigen',
        reason: 'Schutz vor unbefugten Zahlungen',
        implementation: 'Zweite Genehmigung erforderlich bei Beträgen > 5.000 €',
      },
      {
        function1: 'Benutzerverwaltung',
        function2: 'Rollenänderungen',
        reason: 'Schutz vor Rechtemissbrauch',
        implementation: 'Nur Owner/Admin können Rollen ändern',
      },
      {
        function1: 'Datenbankzugriff',
        function2: 'Produktionsdaten ändern',
        reason: 'Datenschutz und Datenintegrität',
        implementation: 'Direkter DB-Zugriff nur über Admin-Interface mit Audit-Log',
      },
    ],
  },

  approvalWorkflows: [
    {
      process: 'Rechnungsfreigabe',
      triggerConditions: ['Rechnungsbetrag > 5.000 €', 'Neue Lieferanten'],
      approvers: ['Buchhaltung', 'Geschäftsführung'],
      levels: 2,
      timeout: '3 Tage',
      escalation: 'Nach 3 Tagen automatische Eskalation an Owner',
    },
    {
      process: 'Ausgabenfreigabe',
      triggerConditions: ['Betrag > 1.000 €'],
      approvers: ['Manager', 'Geschäftsführung'],
      levels: 2,
      timeout: '2 Tage',
    },
    {
      process: 'UStVA-Übermittlung',
      triggerConditions: ['Vor ELSTER-Übermittlung'],
      approvers: ['Buchhaltung', 'Steuerberater/Geschäftsführung'],
      levels: 2,
      timeout: '5 Tage',
    },
    {
      process: 'Mitarbeiter-Onboarding',
      triggerConditions: ['Neuer Mitarbeiter'],
      approvers: ['HR', 'Geschäftsführung'],
      levels: 2,
      timeout: '1 Tag',
    },
    {
      process: 'Rollenänderungen',
      triggerConditions: ['Berechtigungsänderung'],
      approvers: ['Admin', 'Owner'],
      levels: 2,
      timeout: '1 Tag',
    },
  ],

  accessControls: {
    userProvisioning: 'Zentralisierte Benutzerverwaltung über Admin-Panel',
    accessReview: {
      frequency: 'Quartalsweise',
    },
    privilegedAccessManagement: 'Admin-Zugriff nur mit MFA und Audit-Logging',
    passwordPolicy: {
      minLength: 12,
      complexity: true,
      expiryDays: 90,
      history: 5,
    },
  },

  changeManagement: {
    processDocumented: true,
    approvalRequired: true,
    testingRequired: true,
    rollbackProcedure: 'Automatischer Rollback bei fehlgeschlagenen Deployments',
    changeLog: true,
  },

  complianceChecks: [
    {
      name: 'Audit-Log-Integritätsprüfung',
      description: 'Überprüfung der Hash-Chain im Audit-Log',
      frequency: 'Monatlich',
      responsibility: 'Admin-Team',
    },
    {
      name: 'Dokumenten-Integritätsprüfung',
      description: 'Stichprobenartige Prüfung archivierter Dokumente',
      frequency: 'Monatlich',
      responsibility: 'Compliance-Beauftragter',
    },
    {
      name: 'Zugriffsprüfung',
      description: 'Review aller Benutzerrollen und Berechtigungen',
      frequency: 'Quartalsweise',
      responsibility: 'Admin + Owner',
    },
    {
      name: 'Backup-Test',
      description: 'Wiederherstellungstest aus Backup',
      frequency: 'Monatlich',
      responsibility: 'DevOps-Team',
    },
    {
      name: 'Penetration Test',
      description: 'Sicherheitstest durch externe Firma',
      frequency: 'Jährlich',
      responsibility: 'Geschäftsführung',
    },
    {
      name: 'DSGVO-Compliance-Check',
      description: 'Überprüfung aller DSGVO-relevanten Prozesse',
      frequency: 'Jährlich',
      responsibility: 'Datenschutzbeauftragter',
    },
  ],
};

export const INTERNAL_CONTROLS_CONTENT_DE = `
# 5. Internes Kontrollsystem

## 5.1 Funktionstrennung (Segregation of Duties)

### 5.1.1 Grundsätze

Das System implementiert das **Vier-Augen-Prinzip** für alle kritischen Operationen. Keine einzelne Person kann sensible Prozesse vollständig alleine durchführen.

**Ziele:**
- Vermeidung von Betrug
- Reduzierung von Fehlern
- Erhöhung der Datenqualität
- Compliance mit GoBD-Anforderungen

### 5.1.2 Implementierte Funktionstrennungen

{{SOD_RULES_TABLE}}

### 5.1.3 Überwachung

- **Automatische Erkennung:** System prüft bei jeder Aktion, ob Funktionstrennung eingehalten wird
- **Alerts:** Admin erhält Benachrichtigung bei Verstößen
- **Audit-Log:** Alle Genehmigungen werden protokolliert
- **Quartalsweise Review:** Manuelle Überprüfung aller Regeln

## 5.2 Genehmigungs-Workflows

Das System erzwingt Genehmigungsprozesse für kritische Operationen:

### 5.2.1 Workflow-Definitionen

{{APPROVAL_WORKFLOWS_TABLE}}

### 5.2.2 Workflow-Engine

- **Automatische Auslösung:** Workflows werden automatisch gestartet, wenn Bedingungen erfüllt sind
- **E-Mail-Benachrichtigungen:** Genehmiger werden sofort informiert
- **Eskalation:** Bei Timeout automatische Eskalation an höhere Instanz
- **Ablehnung:** Bei Ablehnung wird Ersteller benachrichtigt
- **Audit-Trail:** Vollständige Dokumentation aller Schritte

### 5.2.3 Beispiel: Rechnungsfreigabe-Workflow

\`\`\`
1. Buchhaltung erstellt Rechnung
   ↓
2. System prüft Betrag > 5.000 € ?
   ↓ (Ja)
3. Workflow gestartet: Freigabe erforderlich
   ↓
4. E-Mail an Manager
   ↓
5. Manager genehmigt
   ↓
6. Bei Betrag > 10.000 €: E-Mail an Geschäftsführung
   ↓
7. Geschäftsführung genehmigt
   ↓
8. Rechnung wird versendet
   ↓
9. Audit-Log-Eintrag
\`\`\`

## 5.3 Zugriffskontrolle

### 5.3.1 Benutzerbereitstellung

**Prozess für neue Benutzer:**

1. **Antrag:** HR oder Manager stellt Antrag
2. **Genehmigung:** Geschäftsführung genehmigt
3. **Rollenzuweisung:** Admin weist Rolle zu
4. **Account-Erstellung:** System erstellt Account
5. **Einladung:** Benutzer erhält Einladungslink
6. **Passwort-Einrichtung:** Benutzer setzt eigenes Passwort
7. **MFA-Aktivierung:** Benutzer richtet 2FA ein (optional, aber empfohlen)
8. **Schulung:** Benutzer wird geschult
9. **Audit-Log:** Alle Schritte werden protokolliert

**Prozess für Benutzerdeaktivierung:**

1. **Antrag:** HR/Manager meldet Ausscheiden des Mitarbeiters
2. **Genehmigung:** Geschäftsführung genehmigt
3. **Sofortige Deaktivierung:** Account wird gesperrt
4. **Session-Terminierung:** Alle aktiven Sessions werden beendet
5. **Datenübergabe:** Falls erforderlich, Übergabe an Nachfolger
6. **Archivierung:** Benutzerdaten werden archiviert (nicht gelöscht)
7. **Audit-Log:** Deaktivierung wird protokolliert

### 5.3.2 Zugriffsprüfung (Access Review)

**Frequenz:** Quartalsweise

**Prozess:**

1. **Report generieren:** System erstellt Liste aller Benutzer und Rollen
2. **Manuelle Prüfung:** Owner/Admin prüft jeden Benutzer
3. **Änderungen:** Nicht mehr benötigte Zugänge werden deaktiviert
4. **Dokumentation:** Review-Ergebnis wird archiviert
5. **Eskalation:** Auffälligkeiten werden gemeldet

**Prüfkriterien:**
- Ist der Benutzer noch aktiv?
- Ist die zugewiesene Rolle noch angemessen?
- Gibt es ungewöhnliche Aktivitäten?
- Sind alle privilegierten Zugänge gerechtfertigt?

### 5.3.3 Privilegiertes Zugriffs-Management

**Admin-Zugriff:**
- **MFA erforderlich:** Admins müssen 2FA aktivieren
- **Session-Timeout:** 15 Minuten Inaktivität
- **IP-Whitelist:** Optional für zusätzliche Sicherheit
- **Audit-Logging:** Alle Admin-Aktionen werden protokolliert

**Produktionsdatenbank-Zugriff:**
- **Nur über Admin-Interface:** Kein direkter SQL-Zugriff
- **Read-Only standardmäßig:** Write-Zugriff nur mit expliziter Genehmigung
- **Vier-Augen-Prinzip:** Zweite Person muss bestätigen
- **Temporärer Zugriff:** Zugriff wird automatisch nach 1 Stunde widerrufen

### 5.3.4 Passwort-Richtlinien

**Anforderungen:**
- **Mindestlänge:** 12 Zeichen
- **Komplexität:** Groß- und Kleinbuchstaben, Zahlen, Sonderzeichen
- **Passwort-Historie:** Letzte 5 Passwörter nicht wiederverwendbar
- **Ablauf:** Passwörter laufen nach 90 Tagen ab (konfigurierbar)
- **Sofortige Sperrung:** Nach 5 Fehlversuchen wird Account gesperrt

**Best Practices:**
- Verwendung eines Passwort-Managers empfohlen
- Multi-Faktor-Authentifizierung (MFA) aktivieren
- Regelmäßiger Passwortwechsel
- Keine Passwörter teilen

## 5.4 Change Management

### 5.4.1 Änderungsprozess

**Prozess für System-Änderungen:**

1. **Change Request:** Entwickler stellt Änderungsantrag (Jira-Ticket)
2. **Bewertung:** Tech Lead bewertet Risiko und Aufwand
3. **Genehmigung:** Bei hohem Risiko: Geschäftsführung genehmigt
4. **Entwicklung:** Änderung wird implementiert
5. **Code Review:** Zweiter Entwickler prüft Code
6. **Testing:** Automatisierte Tests + manuelle Tests
7. **Staging-Deployment:** Deployment in Test-Umgebung
8. **User Acceptance Test (UAT):** Fachbereich testet
9. **Produktions-Deployment:** Rollout in Produktionsumgebung
10. **Monitoring:** Überwachung nach Deployment
11. **Dokumentation:** Change Log aktualisieren

### 5.4.2 Rollback-Verfahren

**Automatischer Rollback:**
- Bei fehlgeschlagenen Health Checks
- Bei Erhöhung der Fehlerrate
- Bei kritischen Errors

**Manueller Rollback:**
- Admin kann über Admin-Panel Rollback auslösen
- Vorherige Version wird wiederhergestellt
- Datenbank-Migrationen werden rückgängig gemacht (falls möglich)

### 5.4.3 Change Log

Alle Änderungen werden dokumentiert:
- **Version:** Semantische Versionierung (MAJOR.MINOR.PATCH)
- **Datum:** Deployment-Datum
- **Autor:** Entwickler/Team
- **Typ:** Feature, Bugfix, Security Patch, etc.
- **Beschreibung:** Was wurde geändert
- **Breaking Changes:** Rückwärts-inkompatible Änderungen
- **Migration Notes:** Hinweise für Benutzer

## 5.5 Compliance-Prüfungen

### 5.5.1 Regelmäßige Prüfungen

{{COMPLIANCE_CHECKS_TABLE}}

### 5.5.2 Audit-Dokumentation

Alle Compliance-Prüfungen werden dokumentiert:
- **Prüfprotokoll:** Detaillierte Aufzeichnung der Prüfung
- **Ergebnisse:** Feststellungen und Abweichungen
- **Maßnahmen:** Korrekturmaßnahmen bei Abweichungen
- **Nachverfolgung:** Status der Maßnahmenumsetzung
- **Archivierung:** Prüfprotokolle werden 10 Jahre aufbewahrt

### 5.5.3 Externe Audits

**Frequenz:** Jährlich

**Scope:**
- GoBD-Compliance
- DSGVO-Compliance
- IT-Sicherheit (Penetration Test)
- Geschäftsprozesse

**Prüfer:**
- Externe Wirtschaftsprüfungsgesellschaft
- IT-Sicherheitsfirma
- Datenschutzbeauftragter

**Ergebnisse:**
- Audit-Bericht wird der Geschäftsführung vorgelegt
- Abweichungen werden dokumentiert
- Maßnahmenplan wird erstellt
- Follow-up-Audit nach 6 Monaten

## 5.6 Risikomanagement

### 5.6.1 Risikoidentifikation

Regelmäßige Identifikation von Risiken:
- **Compliance-Risiken:** Gesetzesänderungen, neue Vorschriften
- **Sicherheitsrisiken:** Cyberangriffe, Datenlecks
- **Technische Risiken:** Systemausfälle, Bugs
- **Geschäftsrisiken:** Kundenverlust, Wettbewerb

### 5.6.2 Risikobewertung

**Risiko-Matrix:**

| Wahrscheinlichkeit | Auswirkung | Risiko-Level |
|--------------------|------------|--------------|
| Hoch | Hoch | Kritisch |
| Hoch | Mittel | Hoch |
| Mittel | Hoch | Hoch |
| Mittel | Mittel | Mittel |
| Niedrig | Hoch | Mittel |
| Niedrig | Mittel | Niedrig |
| Niedrig | Niedrig | Sehr niedrig |

### 5.6.3 Risikominderung

Für jedes identifizierte Risiko:
- **Maßnahmen:** Konkrete Schritte zur Risikominderung
- **Verantwortlicher:** Zuständige Person
- **Zeitplan:** Umsetzungsfrist
- **Status:** Tracking der Umsetzung

### 5.6.4 Risiko-Monitoring

- **Quartalsweise Review:** Überprüfung aller Risiken
- **Dashboard:** Visualisierung der Top-Risiken
- **Alerts:** Benachrichtigung bei neuen Risiken
- **Reporting:** Risikobericht an Geschäftsführung

## 5.7 Kontinuierliche Verbesserung

### 5.7.1 Feedback-Prozess

- **Benutzer-Feedback:** Regelmäßige Umfragen
- **Support-Tickets:** Analyse häufiger Probleme
- **Feature Requests:** Priorisierung nach Business Value
- **Lessons Learned:** Post-Mortem nach Incidents

### 5.7.2 KPI-Tracking

**Gemessene Kennzahlen:**
- Compliance-Score (0-100%)
- Anzahl offener Abweichungen
- Zeit bis zur Behebung von Abweichungen
- Anzahl Security-Incidents
- Benutzer-Zufriedenheit
- System-Verfügbarkeit (Uptime)

### 5.7.3 Verbesserungsmaßnahmen

Aus den KPIs und Feedback werden konkrete Verbesserungsmaßnahmen abgeleitet und priorisiert.
`;

export function getInternalControlsPlaceholders(data: any): Record<string, string> {
  const sodRulesTable = data.segregationOfDuties?.criticalFunctions?.map((rule: any) =>
    `| ${rule.function1} | ${rule.function2} | ${rule.reason} | ${rule.implementation} |`
  ).join('\n') || '[Regeln fehlen]';

  const approvalWorkflowsTable = data.approvalWorkflows?.map((wf: any) =>
    `| ${wf.process} | ${wf.triggerConditions.join(', ')} | ${wf.approvers.join(' → ')} | ${wf.levels} | ${wf.timeout || 'N/A'} |`
  ).join('\n') || '[Workflows fehlen]';

  const complianceChecksTable = data.complianceChecks?.map((check: any) =>
    `| ${check.name} | ${check.description} | ${check.frequency} | ${check.responsibility} |`
  ).join('\n') || '[Prüfungen fehlen]';

  return {
    '{{SOD_RULES_TABLE}}': `| Funktion 1 | Funktion 2 | Grund | Implementierung |\n|------------|------------|-------|-----------------|
\n${sodRulesTable}`,
    '{{APPROVAL_WORKFLOWS_TABLE}}': `| Prozess | Auslösebedingungen | Genehmiger | Ebenen | Timeout |\n|---------|-------------------|------------|--------|---------|
\n${approvalWorkflowsTable}`,
    '{{COMPLIANCE_CHECKS_TABLE}}': `| Prüfung | Beschreibung | Frequenz | Verantwortlich |\n|---------|--------------|----------|----------------|
\n${complianceChecksTable}`,
  };
}
