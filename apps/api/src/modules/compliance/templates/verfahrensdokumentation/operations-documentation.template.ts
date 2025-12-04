/**
 * German Template: Betriebsdokumentation (Operations Documentation)
 * Section 4 of Verfahrensdokumentation
 */

import { OperationsDocumentation } from '../../types/process-documentation.types';

export const OPERATIONS_DOCUMENTATION_TEMPLATE_DE: Partial<OperationsDocumentation> = {
  backup: {
    strategy: 'Inkrementelle tägliche Backups mit wöchentlichem Vollbackup',
    frequency: 'Täglich um 02:00 Uhr UTC',
    retention: '30 Tage für tägliche Backups, 12 Monate für wöchentliche Backups',
    storageLocation: 'Geografisch getrennte Cloud-Region',
    encryptionEnabled: true,
    testFrequency: 'Monatlich',
    restoreProcedure: 'Automatisiertes Wiederherstellungsverfahren über Admin-Panel',
  },

  monitoring: {
    systemMonitoring: true,
    alerting: true,
    logManagement: 'Zentralisiertes Logging mit ELK-Stack (Elasticsearch, Logstash, Kibana)',
    performanceMetrics: [
      'CPU-Auslastung',
      'RAM-Auslastung',
      'Disk I/O',
      'Netzwerk-Bandbreite',
      'API-Response-Zeit',
      'Datenbank-Abfragezeit',
      'Fehlerrate',
      'Verfügbarkeit',
    ],
  },

  maintenance: {
    schedule: 'Wartungsfenster: Sonntag 02:00-04:00 Uhr',
    updateProcedure: 'Rolling Deployment ohne Downtime',
    downtimePolicy: 'Ungeplante Ausfälle: Sofortige Benachrichtigung, geplante Wartung: 48h Vorlauf',
    notificationProcess: 'E-Mail und In-App-Benachrichtigung',
  },

  disasterRecovery: {
    plan: 'Disaster Recovery Plan dokumentiert und getestet',
    rto: '4 Stunden', // Recovery Time Objective
    rpo: '1 Stunde', // Recovery Point Objective
    backupSite: 'Sekundäres Rechenzentrum in anderer geografischer Region',
  },

  dataProtection: {
    gdprCompliant: true,
    privacyPolicy: 'Datenschutzerklärung verfügbar und aktuell',
    dataSubjectRights: [
      'Auskunftsrecht (Art. 15 DSGVO)',
      'Recht auf Berichtigung (Art. 16 DSGVO)',
      'Recht auf Löschung (Art. 17 DSGVO)',
      'Recht auf Einschränkung (Art. 18 DSGVO)',
      'Recht auf Datenübertragbarkeit (Art. 20 DSGVO)',
      'Widerspruchsrecht (Art. 21 DSGVO)',
    ],
    breachNotificationProcedure: 'Benachrichtigung innerhalb 72 Stunden gemäß Art. 33 DSGVO',
  },
};

export const OPERATIONS_DOCUMENTATION_CONTENT_DE = `
# 4. Betriebsdokumentation

## 4.1 Datensicherung (Backup)

### 4.1.1 Backup-Strategie

**Strategie:** {{BACKUP_STRATEGY}}

**Backup-Typen:**
- **Vollbackup:** Jeden Sonntag um 02:00 Uhr UTC
- **Inkrementelles Backup:** Täglich (Montag-Samstag) um 02:00 Uhr UTC
- **Transaction Log Backup:** Kontinuierlich (PostgreSQL WAL)

### 4.1.2 Backup-Zeitplan

| Typ | Frequenz | Aufbewahrung | Speicherort |
|-----|----------|--------------|-------------|
| Vollbackup | Wöchentlich | 12 Monate | Sekundäre Cloud-Region |
| Inkrementell | Täglich | 30 Tage | Sekundäre Cloud-Region |
| Transaction Logs | Kontinuierlich | 7 Tage | Primäre Cloud-Region |
| Archiv-Snapshots | Monatlich | 10 Jahre | Cold Storage |

### 4.1.3 Backup-Verschlüsselung

- **Algorithmus:** AES-256-GCM
- **Key Management:** Separate Encryption Keys pro Mandant
- **Verschlüsselung während Übertragung:** TLS 1.3
- **Verschlüsselung im Ruhezustand:** Verschlüsselt gespeichert

### 4.1.4 Backup-Test und Wiederherstellung

**Test-Frequenz:** Monatlich

**Testverfahren:**
1. Vollständiges Backup aus Produktionsumgebung erstellen
2. Wiederherstellung in isolierter Test-Umgebung
3. Integritätsprüfung aller Daten
4. Funktionstest kritischer Anwendungen
5. Dokumentation der Ergebnisse

**Wiederherstellungsverfahren:**

1. **Notfall-Wiederherstellung:**
   - Benachrichtigung des Admin-Teams
   - Backup-Quelle identifizieren
   - Wiederherstellung initiieren über Admin-Panel
   - Integritätsprüfung durchführen
   - System online schalten
   - Benutzer benachrichtigen

2. **Einzelne Datei/Dokument wiederherstellen:**
   - Admin-Panel öffnen
   - Backup-Zeitpunkt auswählen
   - Dokument suchen
   - Wiederherstellung initiieren

**Recovery Time Objective (RTO):** 4 Stunden
**Recovery Point Objective (RPO):** 1 Stunde

### 4.1.5 Backup-Aufbewahrungsrichtlinie

| Datentyp | Aufbewahrungsfrist |
|----------|-------------------|
| Produktionsdaten | 30 Tage (täglich), 12 Monate (wöchentlich) |
| Steuerrelevante Daten | 10 Jahre (monatliche Archiv-Snapshots) |
| Audit-Logs | 10 Jahre |
| Temporäre Daten | 7 Tage |

## 4.2 Systemüberwachung (Monitoring)

### 4.2.1 Monitoring-Tools

- **Application Performance Monitoring (APM):** New Relic / Datadog
- **Infrastructure Monitoring:** CloudWatch / Azure Monitor / Google Cloud Monitoring
- **Log Management:** ELK-Stack (Elasticsearch, Logstash, Kibana)
- **Uptime Monitoring:** UptimeRobot / Pingdom
- **Security Monitoring:** SIEM-System

### 4.2.2 Überwachte Metriken

**System-Metriken:**
- CPU-Auslastung (Durchschnitt, Peak)
- RAM-Auslastung
- Festplatten-I/O
- Netzwerk-Bandbreite
- Container-Status (Kubernetes)

**Anwendungs-Metriken:**
- API-Response-Zeit (p50, p95, p99)
- Fehlerrate (4xx, 5xx)
- Durchsatz (Requests/Sekunde)
- Datenbank-Abfragezeit
- Job-Queue-Länge

**Business-Metriken:**
- Aktive Benutzer
- Erstellte Rechnungen pro Tag
- Verarbeitete Transaktionen
- Fehlerhafte ELSTER-Übermittlungen

### 4.2.3 Alerting

**Alert-Stufen:**

| Stufe | Schwere | Reaktionszeit | Benachrichtigung |
|-------|---------|---------------|------------------|
| Critical | Produktionsausfall | Sofort | On-Call-Team (Telefon) |
| High | Funktionsbeeinträchtigung | 15 Minuten | Admin-Team (E-Mail + SMS) |
| Medium | Performance-Problem | 1 Stunde | Admin-Team (E-Mail) |
| Low | Warnung | 24 Stunden | Admin-Team (E-Mail) |

**Alert-Beispiele:**

- **Critical:**
  - API nicht erreichbar
  - Datenbank-Ausfall
  - Datenverlust

- **High:**
  - Response-Zeit > 3 Sekunden
  - Fehlerrate > 5%
  - Disk-Auslastung > 90%

- **Medium:**
  - CPU-Auslastung > 80%
  - Memory-Auslastung > 85%
  - Backup-Fehler

- **Low:**
  - Zertifikat läuft in 30 Tagen ab
  - Ungewöhnliche Aktivität
  - Performance-Degradation

### 4.2.4 Incident Response

**Incident-Prozess:**

1. **Detection:** Automatische Erkennung via Monitoring
2. **Notification:** On-Call-Team wird benachrichtigt
3. **Triage:** Schweregrad einschätzen
4. **Mitigation:** Sofortmaßnahmen ergreifen
5. **Communication:** Benutzer informieren (falls nötig)
6. **Resolution:** Problem vollständig beheben
7. **Post-Mortem:** Nachanalyse und Dokumentation

## 4.3 Wartung

### 4.3.1 Wartungsfenster

**Geplante Wartung:**
- **Zeitfenster:** Sonntag 02:00-04:00 Uhr (MEZ)
- **Benachrichtigung:** 48 Stunden im Voraus
- **Durchschnittliche Dauer:** 1 Stunde
- **Verfügbarkeit während Wartung:** Read-Only-Modus möglich

### 4.3.2 Update-Verfahren

**Rolling Deployment (Zero Downtime):**

1. Neue Version in Staging deployen
2. Automatisierte Tests ausführen
3. Canary Deployment (10% Traffic)
4. Monitoring beobachten (15 Minuten)
5. Schrittweise Rollout (25%, 50%, 100%)
6. Health Checks nach jedem Schritt
7. Automatisches Rollback bei Fehlern

**Kritische Updates (mit Wartungsfenster):**
1. Ankündigung 48 Stunden vorher
2. Datenbank-Backup erstellen
3. System in Wartungsmodus versetzen
4. Update durchführen
5. Smoke Tests
6. System online schalten
7. Monitoring beobachten

### 4.3.3 Patch Management

- **Security Patches:** Innerhalb 48 Stunden nach Veröffentlichung
- **Critical Bugfixes:** Innerhalb 7 Tagen
- **Feature Updates:** Monatlich (nach Test-Phase)
- **Dependency Updates:** Quartalsweise

### 4.3.4 Downtime-Policy

**Geplante Downtime:**
- Benachrichtigung: Minimum 48 Stunden vorher
- Maximale Dauer: 2 Stunden
- Kompensation: Keine (innerhalb SLA)

**Ungeplante Downtime:**
- Benachrichtigung: Sofort (Status-Page + E-Mail)
- Maximale Reaktionszeit: 15 Minuten
- Kompensation: Gemäß SLA (bei > 0,1% monatlicher Downtime)

## 4.4 Disaster Recovery

### 4.4.1 Disaster Recovery Plan

**Disaster-Szenarien:**
1. Rechenzentrumsausfall
2. Ransomware-Angriff
3. Datenbankkorruption
4. Kompletter Datenverlust
5. DDoS-Angriff

### 4.4.2 Recovery-Ziele

- **RTO (Recovery Time Objective):** 4 Stunden
- **RPO (Recovery Point Objective):** 1 Stunde
- **MTTR (Mean Time To Recovery):** 2 Stunden (Durchschnitt)

### 4.4.3 Backup-Standort

- **Primäres Rechenzentrum:** EU-West (Frankfurt)
- **Sekundäres Rechenzentrum:** EU-North (Stockholm)
- **Geografische Trennung:** > 1000 km
- **Failover-Zeit:** < 15 Minuten (automatisch)

### 4.4.4 Disaster Recovery Test

- **Frequenz:** Quartalsweise
- **Scope:** Vollständiger Failover-Test
- **Dauer:** 4 Stunden
- **Dokumentation:** Test-Protokoll archivieren

## 4.5 Datenschutz (DSGVO)

### 4.5.1 Datenschutzbeauftragter

- **Name:** {{DATA_PROTECTION_OFFICER}}
- **E-Mail:** datenschutz@[domain].de
- **Verantwortlichkeiten:**
  - DSGVO-Compliance überwachen
  - Datenschutz-Folgenabschätzungen
  - Schulungen durchführen
  - Behörden-Kontakt

### 4.5.2 Betroffenenrechte

Betroffene Personen haben folgende Rechte:

1. **Auskunftsrecht (Art. 15 DSGVO)**
   - Betroffene können Auskunft über ihre gespeicherten Daten verlangen
   - Antwortfrist: 30 Tage

2. **Recht auf Berichtigung (Art. 16 DSGVO)**
   - Fehlerhafte Daten müssen korrigiert werden
   - Unverzügliche Bearbeitung

3. **Recht auf Löschung (Art. 17 DSGVO)**
   - "Recht auf Vergessenwerden"
   - Ausnahmen: Gesetzliche Aufbewahrungspflichten

4. **Recht auf Einschränkung (Art. 18 DSGVO)**
   - Verarbeitung einschränken (aber nicht löschen)

5. **Recht auf Datenübertragbarkeit (Art. 20 DSGVO)**
   - Export der Daten in maschinenlesbarem Format
   - JSON-Export über API

6. **Widerspruchsrecht (Art. 21 DSGVO)**
   - Widerspruch gegen Verarbeitung
   - Unverzügliche Prüfung

### 4.5.3 Datenschutzverletzungen

**Meldeprozess:**

1. **Erkennung:** Datenschutzverletzung wird festgestellt
2. **Dokumentation:** Alle Details dokumentieren
3. **Bewertung:** Risiko für Betroffene einschätzen
4. **Meldung an Aufsichtsbehörde:** Innerhalb 72 Stunden (Art. 33 DSGVO)
5. **Benachrichtigung Betroffener:** Bei hohem Risiko (Art. 34 DSGVO)
6. **Gegenmaßnahmen:** Sofortige Eindämmung und Behebung
7. **Post-Incident-Review:** Maßnahmen zur Vermeidung

### 4.5.4 Datenschutz-Folgenabschätzung (DSFA)

- **Wann erforderlich:** Bei hohem Risiko für Rechte und Freiheiten
- **Durchführung:** Datenschutzbeauftragter
- **Dokumentation:** DSFA-Bericht archivieren
- **Review:** Jährlich oder bei Änderungen
`;

export function getOperationsDocumentationPlaceholders(data: any): Record<string, string> {
  return {
    '{{BACKUP_STRATEGY}}': data.backup?.strategy || 'Inkrementelle tägliche Backups',
    '{{DATA_PROTECTION_OFFICER}}': data.dataProtection?.dataProtectionOfficer || '[Zu benennen]',
  };
}
