/**
 * GoBD Report PDF Template
 * German-language template for tax auditor compliance reports
 *
 * Note: This is a template generator. Actual PDF rendering requires
 * @react-pdf/renderer or pdfmake to be installed.
 */

import {
  GoBDReport,
  ComplianceCheck,
  ComplianceCheckStatus,
  ComplianceIssue,
  IssueSeverity,
  ComplianceCheckType,
} from '../types/gobd-compliance-report.types';

/**
 * German translations for compliance check types
 */
export const COMPLIANCE_CHECK_NAMES_DE: Record<ComplianceCheckType, { name: string; description: string }> = {
  [ComplianceCheckType.AUDIT_LOG_INTEGRITY]: {
    name: 'Audit-Log-Integrität',
    description: 'Überprüfung der Unveränderlichkeit der Hash-Kette in den Audit-Logs',
  },
  [ComplianceCheckType.DOCUMENT_ARCHIVE_INTEGRITY]: {
    name: 'Dokumentenarchiv-Integrität',
    description: 'Verifizierung der archivierten Dokumente und deren Prüfsummen',
  },
  [ComplianceCheckType.RETENTION_POLICY]: {
    name: 'Aufbewahrungsrichtlinien',
    description: 'Einhaltung der gesetzlichen Aufbewahrungsfristen gemäß GoBD',
  },
  [ComplianceCheckType.JOURNAL_COMPLETENESS]: {
    name: 'Journal-Vollständigkeit',
    description: 'Prüfung auf Lücken in den Buchführungseinträgen',
  },
  [ComplianceCheckType.PROCESS_DOCUMENTATION]: {
    name: 'Verfahrensdokumentation',
    description: 'Vorhandensein und Aktualität der Verfahrensdokumentation',
  },
  [ComplianceCheckType.CHANGE_TRACKING]: {
    name: 'Änderungsverfolgung',
    description: 'Nachvollziehbarkeit aller Änderungen durch Audit-Logs',
  },
  [ComplianceCheckType.ACCESS_CONTROL]: {
    name: 'Zugriffssteuerung',
    description: 'Rollenbasierte Zugriffskontrolle (RBAC) korrekt konfiguriert',
  },
  [ComplianceCheckType.DATA_BACKUP]: {
    name: 'Datensicherung',
    description: 'Dokumentierte Backup-Verfahren und -Wiederherstellung',
  },
  [ComplianceCheckType.TAX_DOCUMENT_ARCHIVAL]: {
    name: 'Steuerrelevante Dokumente',
    description: 'Alle steuerrelevanten Dokumente ordnungsgemäß archiviert',
  },
  [ComplianceCheckType.SYSTEM_CONFIGURATION]: {
    name: 'Systemkonfiguration',
    description: 'Systemeinstellungen entsprechen GoBD-Anforderungen',
  },
};

/**
 * German severity labels
 */
export const SEVERITY_LABELS_DE: Record<IssueSeverity, string> = {
  [IssueSeverity.CRITICAL]: 'Kritisch',
  [IssueSeverity.HIGH]: 'Hoch',
  [IssueSeverity.MEDIUM]: 'Mittel',
  [IssueSeverity.LOW]: 'Niedrig',
  [IssueSeverity.INFO]: 'Information',
};

/**
 * German status labels
 */
export const STATUS_LABELS_DE: Record<ComplianceCheckStatus, string> = {
  [ComplianceCheckStatus.PASSED]: 'Bestanden',
  [ComplianceCheckStatus.FAILED]: 'Nicht bestanden',
  [ComplianceCheckStatus.WARNING]: 'Warnung',
  [ComplianceCheckStatus.NOT_APPLICABLE]: 'Nicht zutreffend',
  [ComplianceCheckStatus.SKIPPED]: 'Übersprungen',
};

/**
 * Generate HTML report (can be converted to PDF using puppeteer or similar)
 */
export function generateHTMLReport(report: GoBDReport, companyInfo?: any): string {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#22c55e'; // green
    if (score >= 70) return '#eab308'; // yellow
    if (score >= 50) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getSeverityColor = (severity: IssueSeverity): string => {
    switch (severity) {
      case IssueSeverity.CRITICAL:
        return '#dc2626';
      case IssueSeverity.HIGH:
        return '#ea580c';
      case IssueSeverity.MEDIUM:
        return '#d97706';
      case IssueSeverity.LOW:
        return '#65a30d';
      case IssueSeverity.INFO:
        return '#0284c7';
      default:
        return '#6b7280';
    }
  };

  const passedChecks = report.checks.filter((c) => c.status === ComplianceCheckStatus.PASSED).length;
  const totalChecks = report.checks.length;

  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GoBD-Konformitätsbericht</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #f9fafb;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
      background: white;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #3b82f6;
    }

    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #3b82f6;
      margin-bottom: 10px;
    }

    h1 {
      font-size: 28px;
      color: #111827;
      margin: 20px 0;
    }

    h2 {
      font-size: 22px;
      color: #374151;
      margin: 30px 0 15px 0;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }

    h3 {
      font-size: 18px;
      color: #4b5563;
      margin: 20px 0 10px 0;
    }

    .metadata {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 40px;
      padding: 20px;
      background: #f3f4f6;
      border-radius: 8px;
    }

    .metadata-item {
      display: flex;
      flex-direction: column;
    }

    .metadata-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }

    .metadata-value {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    }

    .score-section {
      text-align: center;
      margin: 40px 0;
      padding: 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      color: white;
    }

    .score-circle {
      display: inline-block;
      width: 200px;
      height: 200px;
      border-radius: 50%;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 64px;
      font-weight: bold;
      margin: 20px auto;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .certification-badge {
      display: inline-block;
      padding: 10px 20px;
      margin-top: 20px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 16px;
    }

    .certification-ready {
      background: #22c55e;
      color: white;
    }

    .certification-not-ready {
      background: #ef4444;
      color: white;
    }

    .checks-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin: 30px 0;
    }

    .check-stat {
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
    }

    .check-stat-value {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .check-stat-label {
      font-size: 14px;
      color: #6b7280;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 14px;
    }

    th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #d1d5db;
    }

    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }

    tr:hover {
      background: #f9fafb;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-passed {
      background: #d1fae5;
      color: #065f46;
    }

    .status-failed {
      background: #fee2e2;
      color: #991b1b;
    }

    .status-warning {
      background: #fef3c7;
      color: #92400e;
    }

    .severity-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      color: white;
    }

    .issue-card {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 15px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .issue-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .issue-title {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    }

    .issue-description {
      color: #6b7280;
      margin-bottom: 10px;
    }

    .remediation {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 15px;
      margin-top: 10px;
      border-radius: 4px;
    }

    .remediation h4 {
      color: #1e40af;
      margin-bottom: 10px;
      font-size: 14px;
    }

    .remediation ul {
      margin-left: 20px;
      color: #374151;
    }

    .statistics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin: 30px 0;
    }

    .stat-card {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .stat-card-title {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }

    .stat-card-value {
      font-size: 28px;
      font-weight: bold;
      color: #111827;
    }

    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }

    .page-break {
      page-break-after: always;
    }

    @media print {
      body {
        background: white;
      }

      .container {
        max-width: 100%;
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo">OPERATE / CoachOS</div>
      <h1>GoBD-Konformitätsbericht</h1>
      <p>Gemäß den Grundsätzen zur ordnungsmäßigen Führung und Aufbewahrung von Büchern, Aufzeichnungen und Unterlagen in elektronischer Form sowie zum Datenzugriff</p>
    </div>

    <!-- Metadata -->
    <div class="metadata">
      <div class="metadata-item">
        <span class="metadata-label">Bericht-ID</span>
        <span class="metadata-value">${report.reportId}</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">Berichtsdatum</span>
        <span class="metadata-value">${formatDateTime(report.reportDate)}</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">Prüfungszeitraum</span>
        <span class="metadata-value">${formatDate(report.periodStart)} - ${formatDate(report.periodEnd)}</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">Mandant</span>
        <span class="metadata-value">${report.tenantName || report.tenantId}</span>
      </div>
    </div>

    <!-- Compliance Score -->
    <div class="score-section">
      <h2 style="color: white; border: none; margin: 0;">Konformitätsbewertung</h2>
      <div class="score-circle" style="color: ${getScoreColor(report.complianceScore)}">
        ${report.complianceScore}<span style="font-size: 24px;">%</span>
      </div>
      <div class="certification-badge ${report.certificationReady ? 'certification-ready' : 'certification-not-ready'}">
        ${report.certificationReady ? '✓ Zertifizierungsbereit' : '✗ Nicht zertifizierungsbereit'}
      </div>
      <p style="margin-top: 20px; font-size: 14px;">
        ${passedChecks} von ${totalChecks} Prüfungen bestanden
      </p>
    </div>

    <!-- Checks Summary -->
    <h2>Zusammenfassung der Prüfungen</h2>
    <div class="checks-summary">
      <div class="check-stat">
        <div class="check-stat-value" style="color: #22c55e;">${report.checks.filter((c) => c.status === ComplianceCheckStatus.PASSED).length}</div>
        <div class="check-stat-label">Bestanden</div>
      </div>
      <div class="check-stat">
        <div class="check-stat-value" style="color: #ef4444;">${report.checks.filter((c) => c.status === ComplianceCheckStatus.FAILED).length}</div>
        <div class="check-stat-label">Nicht bestanden</div>
      </div>
      <div class="check-stat">
        <div class="check-stat-value" style="color: #f59e0b;">${report.checks.filter((c) => c.status === ComplianceCheckStatus.WARNING).length}</div>
        <div class="check-stat-label">Warnungen</div>
      </div>
      <div class="check-stat">
        <div class="check-stat-value" style="color: #6b7280;">${totalChecks}</div>
        <div class="check-stat-label">Gesamt</div>
      </div>
    </div>

    <!-- Detailed Checks -->
    <h2>Detaillierte Prüfergebnisse</h2>
    <table>
      <thead>
        <tr>
          <th>Prüfung</th>
          <th>Beschreibung</th>
          <th style="text-align: center;">Bewertung</th>
          <th style="text-align: center;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${report.checks.map((check) => `
          <tr>
            <td><strong>${COMPLIANCE_CHECK_NAMES_DE[check.checkType]?.name || check.name}</strong></td>
            <td>${COMPLIANCE_CHECK_NAMES_DE[check.checkType]?.description || check.description}</td>
            <td style="text-align: center; font-weight: bold; color: ${getScoreColor(check.score)};">${check.score}%</td>
            <td style="text-align: center;">
              <span class="status-badge status-${check.status.toLowerCase()}">
                ${STATUS_LABELS_DE[check.status]}
              </span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    ${report.issues.length > 0 ? `
      <div class="page-break"></div>
      <h2>Festgestellte Mängel</h2>
      <p style="margin-bottom: 20px;">Es wurden ${report.issues.length} Mängel festgestellt, die Ihre Aufmerksamkeit erfordern.</p>

      ${report.issues.map((issue) => `
        <div class="issue-card">
          <div class="issue-header">
            <span class="issue-title">${issue.title}</span>
            <span class="severity-badge" style="background-color: ${getSeverityColor(issue.severity)};">
              ${SEVERITY_LABELS_DE[issue.severity]}
            </span>
          </div>
          <div class="issue-description">${issue.description}</div>
          ${issue.remediation && issue.remediation.length > 0 ? `
            <div class="remediation">
              <h4>Empfohlene Maßnahmen:</h4>
              <ul>
                ${issue.remediation.map((step) => `<li>${step}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      `).join('')}
    ` : `
      <h2>Festgestellte Mängel</h2>
      <p style="color: #22c55e; font-weight: 600;">✓ Keine Mängel festgestellt.</p>
    `}

    ${report.recommendations.length > 0 ? `
      <h2>Empfehlungen zur Verbesserung</h2>
      <ul style="margin-left: 20px; line-height: 2;">
        ${report.recommendations.map((rec) => `<li>${rec}</li>`).join('')}
      </ul>
    ` : ''}

    <!-- Statistics -->
    <div class="page-break"></div>
    <h2>Statistische Auswertung</h2>
    <div class="statistics-grid">
      <div class="stat-card">
        <div class="stat-card-title">Audit-Einträge</div>
        <div class="stat-card-value">${report.statistics.totalAuditEntries.toLocaleString('de-DE')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-title">Archivierte Dokumente</div>
        <div class="stat-card-value">${report.statistics.totalArchivedDocuments.toLocaleString('de-DE')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-title">Dokumentversionen</div>
        <div class="stat-card-value">${report.statistics.totalDocumentVersions.toLocaleString('de-DE')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-title">Verifizierte Dokumente</div>
        <div class="stat-card-value">${report.statistics.documentsVerified.toLocaleString('de-DE')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-title">Dokumente in Aufbewahrung</div>
        <div class="stat-card-value">${report.statistics.documentsInRetention.toLocaleString('de-DE')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-title">Bald auslaufend</div>
        <div class="stat-card-value">${report.statistics.documentsExpiringSoon.toLocaleString('de-DE')}</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>Dieser Bericht wurde automatisch generiert von OPERATE / CoachOS</p>
      <p>Generiert am ${formatDateTime(report.reportDate)}</p>
      <p style="margin-top: 10px; font-style: italic;">
        Dieser Bericht entspricht den Anforderungen der GoBD (Grundsätze zur ordnungsmäßigen Führung und Aufbewahrung von Büchern, Aufzeichnungen und Unterlagen in elektronischer Form sowie zum Datenzugriff).
      </p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Generate JSON report for programmatic access
 */
export function generateJSONReport(report: GoBDReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Generate CSV summary for quick overview
 */
export function generateCSVSummary(report: GoBDReport): string {
  const rows = [
    ['Prüfung', 'Status', 'Bewertung', 'Gewichtung', 'Beschreibung'],
    ...report.checks.map((check) => [
      COMPLIANCE_CHECK_NAMES_DE[check.checkType]?.name || check.name,
      STATUS_LABELS_DE[check.status],
      `${check.score}%`,
      `${check.weight}`,
      COMPLIANCE_CHECK_NAMES_DE[check.checkType]?.description || check.description,
    ]),
  ];

  return rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
}
