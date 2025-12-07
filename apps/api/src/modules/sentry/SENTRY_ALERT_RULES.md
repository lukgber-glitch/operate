# Sentry Alert Rules Configuration

This document outlines the recommended Sentry alert rules for the Operate application to ensure critical issues are caught and addressed promptly.

## Alert Severity Levels

### Critical (Immediate PagerDuty/SMS)
These alerts require immediate attention and should trigger on-call notifications.

#### 1. Payment Processing Errors
- **Condition**: Any error in Stripe payment processing
- **Threshold**: 1 error
- **Time Window**: 1 minute
- **Action**: PagerDuty alert
- **Rationale**: Payment failures directly impact revenue

#### 2. Database Connection Failures
- **Condition**: Database connection errors
- **Threshold**: 3 errors
- **Time Window**: 5 minutes
- **Action**: PagerDuty alert
- **Rationale**: Database unavailability breaks entire application

#### 3. ELSTER Tax Filing Errors
- **Condition**: Errors during ELSTER tax submission
- **Threshold**: 1 error
- **Time Window**: 1 minute
- **Action**: Email + Slack
- **Rationale**: Tax filing failures can have legal/compliance implications

#### 4. Authentication System Down
- **Condition**: Authentication service errors > 10%
- **Threshold**: Error rate > 10%
- **Time Window**: 5 minutes
- **Action**: PagerDuty alert
- **Rationale**: Users cannot access the application

---

### High Priority (Slack Notification)
These alerts indicate serious issues but may not require immediate wake-up.

#### 5. High Error Rate
- **Condition**: Overall error rate exceeds threshold
- **Threshold**: Error rate > 5%
- **Time Window**: 15 minutes
- **Action**: Slack notification
- **Rationale**: Indicates widespread issues affecting user experience

#### 6. Queue Processing Failures
- **Condition**: Background job failures (Bull/BullMQ)
- **Threshold**: 10 failures
- **Time Window**: 10 minutes
- **Action**: Slack notification
- **Rationale**: Background jobs handle important automation tasks

#### 7. Banking Integration Errors
- **Condition**: Tink/Plaid/TrueLayer API errors
- **Threshold**: 5 errors
- **Time Window**: 10 minutes
- **Action**: Slack notification
- **Rationale**: Banking data sync is critical for financial operations

#### 8. Email Processing Failures
- **Condition**: Gmail/Outlook integration errors
- **Threshold**: 10 errors
- **Time Window**: 30 minutes
- **Action**: Slack notification
- **Rationale**: Email-to-invoice extraction is a core feature

#### 9. AI Service Errors
- **Condition**: Claude API errors or classification failures
- **Threshold**: Error rate > 10%
- **Time Window**: 15 minutes
- **Action**: Slack notification
- **Rationale**: AI powers core automation features

#### 10. Slow Response Times
- **Condition**: P95 response time > 5 seconds
- **Threshold**: P95 > 5000ms
- **Time Window**: 15 minutes
- **Action**: Slack notification
- **Rationale**: Performance degradation affects user experience

---

### Warning (Email Notification)
These alerts indicate potential issues that need investigation but aren't urgent.

#### 11. New Error Type Detected
- **Condition**: First occurrence of a new error type
- **Threshold**: 1 error (new fingerprint)
- **Time Window**: Immediate
- **Action**: Email
- **Rationale**: Early detection of new issues

#### 12. Increased Memory Usage
- **Condition**: Memory usage trends upward
- **Threshold**: > 80% average
- **Time Window**: 1 hour
- **Action**: Email
- **Rationale**: Potential memory leak detection

#### 13. Cache Performance Degradation
- **Condition**: Redis cache hit rate drops
- **Threshold**: Hit rate < 70%
- **Time Window**: 30 minutes
- **Action**: Email
- **Rationale**: Cache performance affects response times

#### 14. Compliance Module Warnings
- **Condition**: GoBD or SAF-T validation warnings
- **Threshold**: 5 warnings
- **Time Window**: 1 hour
- **Action**: Email
- **Rationale**: Compliance issues need tracking but may not be urgent

---

### Info (Daily Digest)
These are informational and aggregated in daily reports.

#### 15. 4xx Client Errors
- **Condition**: Summary of client errors
- **Frequency**: Daily digest
- **Action**: Email summary
- **Rationale**: Track API usage patterns and potential client issues

#### 16. Performance Metrics
- **Condition**: Daily performance summary
- **Frequency**: Daily digest
- **Action**: Email summary
- **Rationale**: Monitor trends in response times and throughput

#### 17. Integration Usage Stats
- **Condition**: Daily integration usage
- **Frequency**: Daily digest
- **Action**: Email summary
- **Rationale**: Track API usage across third-party integrations

---

## Alert Configuration in Sentry

### Setting up Alerts

1. **Navigate to Alerts**
   - Go to your Sentry project
   - Click "Alerts" in the left sidebar
   - Click "Create Alert Rule"

2. **Choose Alert Type**
   - **Issue Alert**: Triggered by specific errors
   - **Metric Alert**: Triggered by performance metrics

3. **Configure Conditions**
   ```
   Example: Payment Processing Errors
   - When: An error is captured
   - If: event.tags.route contains "/stripe" OR event.tags.route contains "/payment"
   - Then: Send notification to #payments-alerts Slack channel
   ```

4. **Set Up Integrations**
   - Slack for team notifications
   - PagerDuty for critical on-call alerts
   - Email for individual notifications

### Recommended Filters

#### Critical Errors Only
```javascript
// In Sentry alert conditions
event.level === "error" AND
event.tags.http_status >= 500
```

#### Exclude Known Issues
```javascript
// Filter out transient network errors
NOT event.exception.values[0].value contains "ECONNRESET" AND
NOT event.exception.values[0].value contains "ETIMEDOUT"
```

#### Organization-Specific
```javascript
// Alert only for production organization errors
event.tags.environment === "production"
```

---

## Alert Response Playbook

### Payment Processing Error
1. Check Stripe dashboard for service status
2. Review recent payment attempts in Sentry
3. Verify webhook signatures are valid
4. Check database for stuck transactions
5. Escalate to CTO if not resolved in 15 minutes

### Database Connection Error
1. Check Cloudways server status
2. Verify Redis is running
3. Check connection pool metrics
4. Review recent deployments
5. Restart API service if needed

### ELSTER Submission Failure
1. Check ELSTER service status
2. Verify certificate validity
3. Review submission payload in Sentry
3. Check user's tax credentials
4. Contact ELSTER support if service issue

### High Error Rate
1. Identify error pattern in Sentry
2. Check for recent deployments
3. Review server metrics (CPU, memory)
4. Check third-party API status
5. Roll back deployment if needed

---

## Metrics to Monitor

### Performance
- **Response Time**: P50, P95, P99
- **Throughput**: Requests per minute
- **Error Rate**: Percentage of failed requests
- **Apdex Score**: User satisfaction metric

### Resource Usage
- **Memory**: Heap usage, RSS
- **CPU**: Process CPU percentage
- **Database**: Connection pool usage
- **Cache**: Hit rate, eviction rate

### Business Metrics
- **Invoice Processing**: Time from email to invoice
- **Bank Sync**: Success rate, sync frequency
- **Tax Filing**: Submission success rate
- **User Engagement**: Active sessions, feature usage

---

## Integration with Other Tools

### Slack Integration
```bash
# Channel structure
#alerts-critical     - PagerDuty + Critical errors
#alerts-production   - High priority production issues
#alerts-staging      - Staging environment issues
#dev-errors          - Development errors
```

### PagerDuty Integration
- Create service for "Operate Production"
- Set escalation policy: Primary on-call → Secondary → CTO
- Configure intelligent grouping to avoid alert fatigue

### Email Notifications
- Critical: CTO + Tech Lead
- High: Engineering team
- Warning: DevOps team
- Info: Daily digest to all engineers

---

## Alert Tuning

### Reducing False Positives
1. Start with conservative thresholds
2. Monitor for 2 weeks
3. Adjust based on actual patterns
4. Use fingerprinting to group similar errors

### Preventing Alert Fatigue
1. Auto-resolve alerts after fix deployment
2. Group related errors
3. Use time-based thresholds
4. Implement "quiet hours" for non-critical alerts

---

## Review Schedule

- **Weekly**: Review triggered alerts and false positives
- **Monthly**: Adjust thresholds based on traffic patterns
- **Quarterly**: Review alert coverage for new features
- **Annually**: Full audit of alert rules and response times
