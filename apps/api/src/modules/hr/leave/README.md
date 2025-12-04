# Leave Management Module

Enterprise-grade leave management system with country-specific rules, automated entitlement calculations, and comprehensive workflow management.

## Features

### Core Functionality
- Employee leave request submission
- Manager approval workflow
- Automated balance tracking
- Country-specific entitlement calculations
- Carryover management with expiry dates
- Team calendar views
- Part-time employee proration
- Multi-country support (DE, AT, CH)

### Country Support

#### Germany (DE)
- 20 days minimum annual leave
- Up to 5 days carryover
- Carryover expires March 31

#### Austria (AT)
- 25 days minimum annual leave
- Up to 10 days carryover
- Carryover expires December 31
- +5 days bonus after 25 years service

#### Switzerland (CH)
- 20 days minimum annual leave
- Up to 5 days carryover
- Carryover expires March 31
- +5 days bonus from age 50

## Architecture

```
leave/
├── dto/                          # Data Transfer Objects
│   ├── create-leave-request.dto.ts
│   ├── approve-leave.dto.ts
│   ├── leave-balance.dto.ts
│   ├── leave-request-response.dto.ts
│   └── leave-query.dto.ts
├── entitlements/                 # Entitlement calculation subsystem
│   ├── entitlements.calculator.ts  # Country-specific rules
│   └── entitlements.service.ts     # Entitlement management
├── __tests__/                    # Unit tests
│   ├── entitlements.calculator.spec.ts
│   └── leave.service.spec.ts
├── leave.controller.ts           # REST API endpoints
├── leave.service.ts              # Business logic & workflow
├── leave.repository.ts           # Data access layer
└── leave.module.ts               # Module definition
```

## Installation

### 1. Database Migration
```bash
cd packages/database
npx prisma migrate dev
```

### 2. Import Module
```typescript
// app.module.ts
import { HrModule } from './modules/hr/hr.module';

@Module({
  imports: [
    // ... other modules
    HrModule,
  ],
})
export class AppModule {}
```

### 3. Run Tests
```bash
npm test leave
```

## Usage Examples

### Submit Leave Request
```typescript
import { LeaveService } from './modules/hr/leave/leave.service';

@Injectable()
class MyService {
  constructor(private leaveService: LeaveService) {}

  async requestLeave(employeeId: string) {
    return await this.leaveService.submitRequest(employeeId, {
      leaveType: LeaveType.ANNUAL,
      startDate: '2024-07-15T00:00:00Z',
      endDate: '2024-07-19T00:00:00Z',
      reason: 'Summer vacation',
    });
  }
}
```

### Check Balance
```typescript
async getBalance(employeeId: string) {
  const balance = await this.leaveService.getBalance(employeeId);

  const annualLeave = balance.balances.find(
    b => b.leaveType === LeaveType.ANNUAL
  );

  console.log(`Available: ${annualLeave.availableDays} days`);
}
```

### Approve Request (Manager)
```typescript
async approveLeave(requestId: string, managerId: string) {
  return await this.leaveService.approveRequest(
    requestId,
    managerId,
    'Approved - enjoy your time off!'
  );
}
```

### Calculate Entitlements
```typescript
import { EntitlementsService } from './modules/hr/leave/entitlements/entitlements.service';

async calculateYearlyEntitlement(employeeId: string) {
  const entitlements = await this.entitlementsService.calculateForYear(
    employeeId,
    2024
  );

  return entitlements;
}
```

## API Endpoints

### Employee Operations
```
GET    /api/v1/employees/:employeeId/leave-requests
GET    /api/v1/employees/:employeeId/leave-requests/:id
POST   /api/v1/employees/:employeeId/leave-requests
DELETE /api/v1/employees/:employeeId/leave-requests/:id
GET    /api/v1/employees/:employeeId/leave-balance
GET    /api/v1/employees/:employeeId/leave-balance/:year
```

### Manager Operations
```
POST   /api/v1/leave-requests/:id/approve
POST   /api/v1/leave-requests/:id/reject
```

### Organisation Operations
```
GET    /api/v1/organisations/:orgId/leave-requests
GET    /api/v1/organisations/:orgId/leave-requests/pending
GET    /api/v1/organisations/:orgId/leave-calendar
```

## Configuration

### Environment Variables
```env
# None required - uses existing database connection
```

### Country Rules
Country-specific rules are hardcoded in `entitlements.calculator.ts`:
```typescript
const COUNTRY_RULES: Record<string, CountryLeaveRules> = {
  DE: { minAnnualLeaveDays: 20, carryoverMaxDays: 5, ... },
  AT: { minAnnualLeaveDays: 25, carryoverMaxDays: 10, ... },
  CH: { minAnnualLeaveDays: 20, carryoverMaxDays: 5, ... },
};
```

To add a new country, extend this object with the country code and rules.

## Business Rules

### Entitlement Calculation
1. Base entitlement from country rules
2. Prorate for part-time (based on weekly hours)
3. Prorate for first year (based on hire date)
4. Prorate for termination year
5. Add age-based bonuses (if applicable)
6. Add seniority bonuses (if applicable)
7. Round to nearest 0.5 days

### Request Validation
1. Employee must exist with active contract
2. Start date must be before end date
3. Cannot request past dates (except sick leave)
4. No overlapping requests
5. Sufficient balance (for annual leave)

### Workflow States
- **PENDING** - Awaiting manager approval
- **APPROVED** - Approved by manager, days deducted
- **REJECTED** - Rejected by manager
- **CANCELLED** - Cancelled by employee

### Carryover Rules
1. Maximum carryover defined per country
2. Unused days up to max can be carried over
3. Carried over days expire on country-specific date
4. Carryover calculated automatically on year-end

## Testing

### Run All Tests
```bash
npm test leave
```

### Run Specific Tests
```bash
npm test entitlements.calculator.spec.ts
npm test leave.service.spec.ts
```

### Coverage
```bash
npm run test:cov -- leave
```

### Test Scenarios Covered
- ✅ Base entitlement calculation (all countries)
- ✅ Part-time proration
- ✅ First year proration
- ✅ Age and seniority bonuses
- ✅ Carryover calculation
- ✅ Submit request (happy path)
- ✅ Insufficient balance
- ✅ Overlapping requests
- ✅ Approval workflow
- ✅ Rejection workflow
- ✅ Cancellation workflow

## Performance

### Database Indexes
Ensure these indexes exist:
```sql
CREATE INDEX idx_leave_request_employee ON leave_request(employee_id);
CREATE INDEX idx_leave_request_status ON leave_request(status);
CREATE INDEX idx_leave_request_dates ON leave_request(start_date, end_date);
CREATE INDEX idx_leave_entitlement_employee_year ON leave_entitlement(employee_id, year);
```

### Caching Strategy
Recommended caching:
- Country rules (static)
- Employee entitlements (TTL: 1 hour)
- Leave balances (TTL: 15 minutes)
- Calendar views (TTL: 5 minutes)

### Query Optimization
- Use pagination on all list endpoints
- Filter by date ranges efficiently
- Include only necessary relations

## Security

### Authentication
Add JWT authentication guard:
```typescript
@UseGuards(JwtAuthGuard)
@Controller('api/v1')
export class LeaveController {
  // ...
}
```

### Authorization
Implement permission checks:
```typescript
// Employee can only see/manage own requests
if (request.employeeId !== currentUser.employeeId) {
  throw new ForbiddenException();
}

// Only managers can approve
@RequirePermission('leave:approve')
async approveRequest() { ... }
```

### Audit Logging
All operations are logged via Logger:
```typescript
this.logger.log(`Leave request ${id} approved by ${managerId}`);
```

For compliance, integrate with audit log system.

## Troubleshooting

### Issue: Entitlement calculation returns 0
**Cause**: No active contract for the year
**Solution**: Ensure employee has a contract record with correct dates

### Issue: Cannot submit request - insufficient balance
**Cause**: Available days less than requested
**Solution**: Check balance first, or request fewer days

### Issue: Overlapping request error
**Cause**: Another request exists for overlapping dates
**Solution**: Check existing requests, cancel/modify conflicting request

### Issue: Test failures
**Cause**: Prisma client not generated
**Solution**: Run `npx prisma generate`

## Monitoring

### Key Metrics to Track
- Request submission rate
- Approval/rejection rates
- Average approval time
- Balance utilization rates
- Carryover trends

### Log Queries
```bash
# Submissions
grep "Leave request.*submitted" logs/*.log

# Approvals
grep "Leave request.*approved" logs/*.log

# Errors
grep "ERROR.*leave" logs/*.log
```

## Future Enhancements

Potential additions:
- [ ] Public holiday integration
- [ ] Block-out period configuration
- [ ] Multi-level approval workflow
- [ ] Automatic reminders for pending approvals
- [ ] Delegation during manager absence
- [ ] Leave policy templates
- [ ] Reporting and analytics dashboard
- [ ] Mobile app integration
- [ ] Calendar sync (Google, Outlook)
- [ ] Sick leave certificate upload

## Support

### Documentation
- [IMPLEMENTATION_REPORT.md](./IMPLEMENTATION_REPORT.md) - Full implementation details
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Quick reference guide

### Code Structure
Follow NestJS best practices:
- Controller handles HTTP
- Service handles business logic
- Repository handles data access
- Calculator handles pure calculations
- DTOs handle validation

### Contributing
When modifying:
1. Update tests
2. Update documentation
3. Follow RULES.md standards
4. Ensure backward compatibility

## License

Part of Operate/CoachOS - Internal use only
