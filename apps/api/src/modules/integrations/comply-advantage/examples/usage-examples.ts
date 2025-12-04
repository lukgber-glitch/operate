/**
 * ComplyAdvantage Integration - Usage Examples
 * This file demonstrates how to use the ComplyAdvantage AML integration
 */

import { ComplyAdvantageService } from '../comply-advantage.service';
import { SearchType, MonitoringFrequency, AlertStatus } from '../types/comply-advantage.types';

/**
 * Example 1: Screen a new customer
 */
async function screenNewCustomer(
  service: ComplyAdvantageService,
  customerName: string,
  dateOfBirth: string,
  organizationId: string,
) {
  const screening = await service.screening.createSearch({
    searchTerm: customerName,
    searchType: SearchType.PERSON,
    dateOfBirth,
    organizationId,
    matchTypes: ['pep', 'sanction', 'watchlist'],
    fuzziness: 0.7, // 70% match threshold
  });

  console.log('Screening created:', {
    id: screening.id,
    riskLevel: screening.riskLevel,
    matchCount: screening.matchCount,
    status: screening.status,
  });

  return screening;
}

/**
 * Example 2: Enable ongoing monitoring for high-risk customer
 */
async function enableMonitoringForHighRisk(
  service: ComplyAdvantageService,
  screeningId: string,
) {
  const monitoring = await service.monitoring.enableMonitoring({
    screeningId,
    frequency: MonitoringFrequency.WEEKLY,
  });

  console.log('Monitoring enabled:', {
    id: monitoring.id,
    frequency: monitoring.frequency,
    nextCheckAt: monitoring.nextCheckAt,
  });

  return monitoring;
}

/**
 * Example 3: Review and dismiss false positive alert
 */
async function reviewFalsePositive(
  service: ComplyAdvantageService,
  alertId: string,
  reviewerId: string,
) {
  const alert = await service.caseManagement.reviewAlert(alertId, {
    status: AlertStatus.DISMISSED,
    reviewedBy: reviewerId,
    reviewNotes: 'False positive - different person with similar name. Verified via passport check.',
  });

  console.log('Alert dismissed:', {
    id: alert.id,
    status: alert.status,
    reviewedAt: alert.reviewedAt,
  });

  return alert;
}

/**
 * Example 4: Confirm a true match and escalate
 */
async function confirmAndEscalateMatch(
  service: ComplyAdvantageService,
  alertId: string,
  reviewerId: string,
) {
  // First confirm the match
  await service.caseManagement.reviewAlert(alertId, {
    status: AlertStatus.CONFIRMED,
    reviewedBy: reviewerId,
    reviewNotes: 'Confirmed match against OFAC sanctions list. Customer verified.',
  });

  // Then escalate to compliance team
  const escalated = await service.caseManagement.escalateAlert(
    alertId,
    reviewerId,
    'Confirmed OFAC sanctions match - immediate action required',
  );

  console.log('Alert escalated:', {
    id: escalated.id,
    status: escalated.status,
  });

  return escalated;
}

/**
 * Example 5: Get pending review dashboard
 */
async function getPendingReviewDashboard(
  service: ComplyAdvantageService,
  organizationId: string,
) {
  // Get all pending reviews
  const pendingReviews = await service.caseManagement.getPendingReviewCases(organizationId);

  // Get overdue reviews
  const overdueReviews = await service.caseManagement.getOverdueReviews(organizationId);

  // Get statistics
  const statistics = await service.caseManagement.getAlertStatistics(organizationId);

  console.log('Dashboard data:', {
    pendingCount: pendingReviews.length,
    overdueCount: overdueReviews.length,
    statistics,
  });

  return {
    pending: pendingReviews,
    overdue: overdueReviews,
    stats: statistics,
  };
}

/**
 * Example 6: Screen a company
 */
async function screenCompany(
  service: ComplyAdvantageService,
  companyName: string,
  countryCode: string,
  organizationId: string,
) {
  const screening = await service.screening.createSearch({
    searchTerm: companyName,
    searchType: SearchType.COMPANY,
    countryCode,
    organizationId,
    matchTypes: ['sanction', 'watchlist', 'adverse_media'],
    exactMatch: false,
  });

  console.log('Company screening:', {
    id: screening.id,
    company: companyName,
    riskLevel: screening.riskLevel,
    matches: screening.matchCount,
  });

  return screening;
}

/**
 * Example 7: Re-screen an existing customer
 */
async function performPeriodicRescreen(
  service: ComplyAdvantageService,
  originalScreeningId: string,
) {
  const newScreening = await service.screening.reScreen(originalScreeningId);

  console.log('Re-screening completed:', {
    originalId: originalScreeningId,
    newId: newScreening.id,
    riskLevel: newScreening.riskLevel,
    matchCount: newScreening.matchCount,
  });

  return newScreening;
}

/**
 * Example 8: List all active monitoring
 */
async function listAllMonitoring(
  service: ComplyAdvantageService,
  organizationId: string,
) {
  const activeMonitoring = await service.monitoring.listActiveMonitoring(organizationId);

  console.log(`Active monitoring: ${activeMonitoring.length} entities`);

  activeMonitoring.forEach((monitor) => {
    console.log({
      entityName: monitor.screening.entityName,
      frequency: monitor.frequency,
      nextCheck: monitor.nextCheckAt,
      openAlerts: monitor.screening.alerts.length,
    });
  });

  return activeMonitoring;
}

/**
 * Example 9: Bulk onboarding workflow
 */
async function bulkOnboardingWorkflow(
  service: ComplyAdvantageService,
  customers: Array<{ name: string; dob: string; userId: string }>,
  organizationId: string,
) {
  console.log(`Starting bulk screening for ${customers.length} customers...`);

  const results = await Promise.all(
    customers.map(async (customer) => {
      try {
        const screening = await service.screening.createSearch({
          searchTerm: customer.name,
          searchType: SearchType.PERSON,
          dateOfBirth: customer.dob,
          userId: customer.userId,
          organizationId,
        });

        // Enable monitoring for medium/high/critical risk
        if (['medium', 'high', 'critical'].includes(screening.riskLevel)) {
          await service.monitoring.enableMonitoring({
            screeningId: screening.id,
            frequency: screening.riskLevel === 'critical'
              ? MonitoringFrequency.DAILY
              : MonitoringFrequency.WEEKLY,
          });
        }

        return {
          customer: customer.name,
          status: 'success',
          riskLevel: screening.riskLevel,
          requiresReview: screening.status === 'pending_review',
        };
      } catch (error) {
        return {
          customer: customer.name,
          status: 'error',
          error: error.message,
        };
      }
    }),
  );

  const summary = {
    total: results.length,
    successful: results.filter((r) => r.status === 'success').length,
    failed: results.filter((r) => r.status === 'error').length,
    requiresReview: results.filter((r) => r.requiresReview).length,
  };

  console.log('Bulk screening summary:', summary);

  return results;
}

/**
 * Example 10: Daily compliance review workflow
 */
async function dailyComplianceReview(
  service: ComplyAdvantageService,
  organizationId: string,
) {
  // 1. Get all pending reviews
  const pending = await service.caseManagement.getPendingReviewCases(organizationId);
  console.log(`Pending reviews: ${pending.length}`);

  // 2. Get overdue reviews
  const overdue = await service.caseManagement.getOverdueReviews(organizationId);
  console.log(`Overdue reviews: ${overdue.length}`);

  // 3. Get today's statistics
  const stats = await service.caseManagement.getAlertStatistics(organizationId);
  console.log('Statistics:', stats);

  // 4. Prioritize critical risks
  const critical = pending.filter((s) => s.riskLevel === 'critical');
  console.log(`Critical risk cases: ${critical.length}`);

  return {
    pending,
    overdue,
    critical,
    stats,
  };
}

// Export examples
export {
  screenNewCustomer,
  enableMonitoringForHighRisk,
  reviewFalsePositive,
  confirmAndEscalateMatch,
  getPendingReviewDashboard,
  screenCompany,
  performPeriodicRescreen,
  listAllMonitoring,
  bulkOnboardingWorkflow,
  dailyComplianceReview,
};
