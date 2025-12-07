# HR Pipeline to Chat Actions Integration Analysis

**Task**: S9-03 - Wire HR Pipeline to Chat Actions
**Agent**: BRIDGE (Integrations)
**Date**: 2025-12-07
**Status**: Analysis Complete

---

## Executive Summary

The HR modules (Employees, Leave, Documents) are **partially integrated** into the chat suggestion system but **NOT yet wired into the Chat Action execution system**. Current integration allows for proactive suggestions but lacks actionable chat commands for HR operations.

### Current State
- ✅ HR Suggestions Generator exists and creates proactive suggestions
- ✅ Event emissions exist for Leave module (submitted, approved, rejected, cancelled)
- ✅ Leave notification listener exists (placeholder implementation)
- ❌ **No HR action handlers** in the Chat Action Executor
- ❌ **No HR action types** defined in ActionType enum
- ❌ Document upload/verification events don't create chat suggestions
- ❌ Employee onboarding workflow not integrated with chat

---

## 1. Current HR Module Structure

### A. Leave Module
**Location**: `C:\Users\grube\op\operate-fresh\apps\api\src\modules\hr\leave\`

**Core Files**:
- `leave.service.ts` - Business logic with event emissions
- `leave.controller.ts` - REST API endpoints
- `leave.repository.ts` - Database operations
- `listeners/leave-notification.listener.ts` - Event handler (placeholder)

**Events Already Emitted**:
```typescript
// From leave.service.ts
this.eventEmitter.emit('leave.request.submitted', {
  leaveRequest,
  employeeId
});

this.eventEmitter.emit('leave.request.approved', {
  leaveRequest: approvedRequest,
  employeeId,
  managerId,
  note
});

this.eventEmitter.emit('leave.request.rejected', {
  leaveRequest: rejectedRequest,
  employeeId,
  managerId,
  reason
});

this.eventEmitter.emit('leave.request.cancelled', {
  leaveRequest: request,
  employeeId,
  wasApproved: true
});
```

**Database Model**: `LeaveRequest` (Prisma schema line 1099)

---

### B. Employees Module
**Location**: `C:\Users\grube\op\operate-fresh\apps\api\src\modules\hr\employees\`

**Core Files**:
- `employees.service.ts` - CRUD operations, contracts, tax info, banking
- `employees.controller.ts` - REST API endpoints
- `employees.repository.ts` - Database access

**Current Capabilities**:
- Employee CRUD
- Contract management (create, update, terminate)
- Tax info updates
- Banking details updates

**Events**: ❌ **None currently emitted**

**Database Model**: `Employee` (Prisma schema line 983)

---

### C. Documents Module
**Location**: `C:\Users\grube\op\operate-fresh\apps\api\src\modules\hr\documents\`

**Core Files**:
- `employee-documents.service.ts` - Document lifecycle management
- `employee-documents.controller.ts` - REST API + file upload
- `document-storage.service.ts` - Secure storage with encryption
- `i9-form.service.ts` - US I-9 form handling
- `w4-form.service.ts` - US W-4 tax form handling

**Current Capabilities**:
- Document upload (encrypted storage)
- Verification workflow (PENDING → VERIFIED/REJECTED)
- Document expiration tracking
- Compliance checking
- Audit logging (HrAuditLog model)

**Methods with Action Potential**:
```typescript
// From employee-documents.service.ts
uploadDocument()        // Creates document
verifyDocument()        // Approves document
rejectDocument()        // Rejects with reason
getDocumentsRequiringAttention()  // Returns expiring/pending docs
```

**Events**: ❌ **None currently emitted** (only audit logging)

**Database Model**: `EmployeeDocument` (Prisma schema line 1233)

---

## 2. Current Chat Integration

### A. HR Suggestions Generator
**Location**: `C:\Users\grube\op\operate-fresh\apps\api\src\modules\chatbot\suggestions\generators\hr-suggestions.generator.ts`

**Current Suggestions**:
1. **Pending Leave Requests** - Shows count, navigates to review page
2. **Contract Expirations** - Reminders for contracts ending in 3 months
3. **Probation Periods Ending** - Alerts for evaluation meetings

**Integration Points**:
```typescript
// Already integrated into ProactiveSuggestionsService
private readonly hrGenerator: HRSuggestionsGenerator

this.generators = [
  this.invoiceGenerator,
  this.expenseGenerator,
  this.taxGenerator,
  this.hrGenerator,  // ✅ Already registered
];
```

---

### B. Chat Action Executor
**Location**: `C:\Users\grube\op\operate-fresh\apps\api\src\modules\chatbot\actions\action-executor.service.ts`

**Current Action Types** (from `action.types.ts` line 9-26):
```typescript
export enum ActionType {
  CREATE_INVOICE = 'create_invoice',
  SEND_REMINDER = 'send_reminder',
  GENERATE_REPORT = 'generate_report',
  CREATE_EXPENSE = 'create_expense',
  SEND_EMAIL = 'send_email',
  EXPORT_DATA = 'export_data',
  UPDATE_STATUS = 'update_status',
  SCHEDULE_TASK = 'schedule_task',
  CREATE_BILL = 'create_bill',
  PAY_BILL = 'pay_bill',
  LIST_BILLS = 'list_bills',
  BILL_STATUS = 'bill_status',
  GET_CASH_FLOW = 'get_cash_flow',
  GET_RUNWAY = 'get_runway',
  GET_BURN_RATE = 'get_burn_rate',
  GET_CASH_FORECAST = 'get_cash_forecast',
}
```

**❌ MISSING**: No HR-related action types

---

## 3. Integration Gaps Analysis

### Gap 1: HR Action Types Not Defined
**Impact**: HIGH
**Location**: `action.types.ts`

**Missing Action Types**:
```typescript
// Needed additions:
APPROVE_LEAVE = 'approve_leave',
REJECT_LEAVE = 'reject_leave',
LIST_LEAVE_REQUESTS = 'list_leave_requests',
VERIFY_DOCUMENT = 'verify_document',
REJECT_DOCUMENT = 'reject_document',
LIST_PENDING_DOCUMENTS = 'list_pending_documents',
CREATE_EMPLOYEE = 'create_employee',
UPDATE_EMPLOYEE = 'update_employee',
```

---

### Gap 2: HR Action Handlers Not Implemented
**Impact**: HIGH
**Location**: `apps/api/src/modules/chatbot/actions/handlers/`

**Files Needed**:
```
handlers/
├── approve-leave.handler.ts    (NEW)
├── reject-leave.handler.ts     (NEW)
├── list-leave.handler.ts       (NEW)
├── verify-document.handler.ts  (NEW)
└── reject-document.handler.ts  (NEW)
```

**Handler Structure** (based on existing handlers):
```typescript
@Injectable()
export class ApproveLeaveHandler extends BaseActionHandler {
  constructor(
    private leaveService: LeaveService,
    private prisma: PrismaService,
  ) {
    super('ApproveLeaveHandler');
  }

  async execute(params: any, context: ActionContext): Promise<ActionResult> {
    const { leaveRequestId, note } = params;
    const managerId = context.userId;

    const result = await this.leaveService.approveRequest(
      leaveRequestId,
      managerId,
      note,
    );

    return {
      success: true,
      message: `Leave request approved for employee`,
      entityType: 'LeaveRequest',
      entityId: result.id,
      data: result,
    };
  }

  validate(params: any, context: ActionContext): ValidationResult {
    const errors: string[] = [];

    if (!params.leaveRequestId) {
      errors.push('leaveRequestId is required');
    }

    if (!context.permissions.includes('hr:manage')) {
      errors.push('Insufficient permissions to approve leave');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'leaveRequestId',
        type: 'string',
        required: true,
        description: 'ID of the leave request to approve',
      },
      {
        name: 'note',
        type: 'string',
        required: false,
        description: 'Optional approval note',
      },
    ];
  }
}
```

---

### Gap 3: Document Events Don't Create Suggestions
**Impact**: MEDIUM
**Location**: `employee-documents.service.ts`

**Current State**:
- Document uploads are logged to audit trail
- Verification/rejection creates audit entries
- `getDocumentsRequiringAttention()` method exists but not exposed

**Needed**:
1. Event emissions on document upload/verification
2. Listener to create chat suggestions for pending documents
3. Listener to create reminders for expiring documents

**Implementation**:
```typescript
// In employee-documents.service.ts
async uploadDocument(...) {
  // ... existing code ...

  // Emit event for chat integration
  this.eventEmitter.emit('hr.document.uploaded', {
    documentId: document.id,
    employeeId,
    documentType: dto.documentType,
    orgId,
    requiresVerification: true,
  });

  return document;
}

async verifyDocument(...) {
  // ... existing code ...

  this.eventEmitter.emit('hr.document.verified', {
    documentId,
    employeeId: document.employeeId,
    verifiedBy: userId,
    orgId,
  });

  return updated;
}
```

---

### Gap 4: Employee Onboarding Not Chat-Integrated
**Impact**: MEDIUM
**Location**: `employees.service.ts`

**Current State**:
- Employee creation is a single API call
- No workflow tracking
- No chat suggestions for onboarding tasks

**Needed**:
1. Onboarding workflow tracking (database table or status field)
2. Event emission on employee creation
3. Task suggestions for incomplete onboarding steps

**Example Suggestions**:
- "New employee John Doe - Upload I-9 form"
- "Sarah Smith onboarding incomplete - Missing W-4"
- "3 employees need contract signatures"

---

### Gap 5: HR Events Don't Create Actionable Suggestions
**Impact**: HIGH
**Location**: New listener file needed

**Current State**:
- Leave events are emitted but only logged
- No automatic suggestion creation

**Needed Implementation**:
```typescript
// New file: hr/leave/listeners/leave-suggestion.listener.ts
@Injectable()
export class LeaveSuggestionListener {
  constructor(
    private prisma: PrismaService,
  ) {}

  @OnEvent('leave.request.submitted')
  async createLeaveApprovalSuggestion(payload: any) {
    const { leaveRequest, employeeId } = payload;

    // Get employee details
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    // Create suggestion for managers
    await this.prisma.suggestion.create({
      data: {
        orgId: employee.orgId,
        userId: null, // Visible to all managers
        type: 'QUICK_ACTION',
        priority: 'MEDIUM',
        title: `Leave request from ${employee.firstName} ${employee.lastName}`,
        description: `${employee.firstName} requested ${leaveRequest.leaveType} leave from ${leaveRequest.startDate} to ${leaveRequest.endDate}`,
        actionLabel: 'Review Request',
        entityType: 'LeaveRequest',
        entityId: leaveRequest.id,
        actionType: 'approve_leave',
        actionParams: {
          leaveRequestId: leaveRequest.id,
          employeeId,
        },
        status: 'PENDING',
        showAfter: new Date(),
      },
    });
  }
}
```

---

## 4. Expected HR Suggestions (User Story)

### Scenario 1: Leave Request Flow
```
1. Employee submits leave request via UI
   ↓
2. Event: 'leave.request.submitted'
   ↓
3. Chat Suggestion Created:
   "Leave request from John Doe (Dec 15-20) - Approve?"
   [Approve] [Reject] [View Details]
   ↓
4. Manager clicks "Approve" in chat
   ↓
5. Chat Action: APPROVE_LEAVE
   ↓
6. Leave Service: approveRequest()
   ↓
7. Event: 'leave.request.approved'
   ↓
8. Notification sent to employee
```

---

### Scenario 2: Document Review
```
1. Employee uploads I-9 form
   ↓
2. Event: 'hr.document.uploaded'
   ↓
3. Chat Suggestion:
   "New employee document uploaded - Review?"
   [Verify] [Reject] [View Document]
   ↓
4. HR manager clicks "Verify"
   ↓
5. Chat Action: VERIFY_DOCUMENT
   ↓
6. Document Service: verifyDocument()
   ↓
7. Document status → VERIFIED
```

---

### Scenario 3: Proactive Deadline Alert
```
1. Daily cron job runs
   ↓
2. HR Generator checks expiring documents
   ↓
3. Chat Suggestion:
   "3 employee documents expiring this month"
   [View Documents]
   ↓
4. Manager clicks suggestion
   ↓
5. Navigate to /hr/documents?expiring=true
```

---

## 5. Files Requiring Modification

### HIGH Priority (Core Integration)

1. **`action.types.ts`**
   - Add HR action types to ActionType enum
   - Complexity: LOW

2. **`action-executor.service.ts`**
   - Register HR action handlers
   - Import HR handler classes
   - Add to handler map
   - Complexity: LOW

3. **`hr/leave/listeners/leave-suggestion.listener.ts`** (NEW)
   - Create suggestion on leave submission
   - Update suggestion on approval/rejection
   - Complexity: MEDIUM

4. **`handlers/approve-leave.handler.ts`** (NEW)
   - Implement approve leave action
   - Call LeaveService.approveRequest()
   - Complexity: LOW

5. **`handlers/reject-leave.handler.ts`** (NEW)
   - Implement reject leave action
   - Call LeaveService.rejectRequest()
   - Complexity: LOW

---

### MEDIUM Priority (Enhanced UX)

6. **`handlers/list-leave.handler.ts`** (NEW)
   - List pending leave requests
   - Filter by status/employee
   - Complexity: LOW

7. **`employee-documents.service.ts`**
   - Add event emissions for upload/verify/reject
   - Inject EventEmitter2
   - Complexity: LOW

8. **`hr/documents/listeners/document-suggestion.listener.ts`** (NEW)
   - Create suggestions for pending documents
   - Create reminders for expiring documents
   - Complexity: MEDIUM

9. **`handlers/verify-document.handler.ts`** (NEW)
   - Verify employee document
   - Call EmployeeDocumentsService.verifyDocument()
   - Complexity: LOW

10. **`handlers/reject-document.handler.ts`** (NEW)
    - Reject employee document with reason
    - Call EmployeeDocumentsService.rejectDocument()
    - Complexity: LOW

---

### LOW Priority (Nice-to-Have)

11. **`hr-suggestions.generator.ts`**
    - Add document expiration checks
    - Add onboarding incomplete checks
    - Complexity: MEDIUM

12. **`employees.service.ts`**
    - Add event emissions for employee creation
    - Add onboarding tracking events
    - Complexity: LOW

13. **`handlers/create-employee.handler.ts`** (NEW)
    - Create employee via chat
    - Complexity: MEDIUM (more parameters)

---

## 6. Implementation Complexity Assessment

### Effort Breakdown

| Component | Files | Lines of Code (est.) | Complexity | Time (hrs) |
|-----------|-------|---------------------|------------|------------|
| **Action Types** | 1 | 20 | LOW | 0.5 |
| **Action Handlers** | 5 | 600 | LOW-MEDIUM | 4.0 |
| **Event Listeners** | 2 | 400 | MEDIUM | 3.0 |
| **Service Updates** | 2 | 100 | LOW | 1.0 |
| **Generator Updates** | 1 | 200 | MEDIUM | 2.0 |
| **Testing** | - | - | - | 3.0 |
| **Integration** | - | - | - | 1.5 |
| **TOTAL** | 11 | ~1,320 | - | **15 hours** |

---

### Risk Assessment

**LOW RISK**:
- ✅ Event emission infrastructure already exists (EventEmitter2)
- ✅ Suggestion system is mature and well-tested
- ✅ Action executor pattern is established
- ✅ HR services have clear boundaries

**MEDIUM RISK**:
- ⚠️ Permission system needs to verify HR permissions
- ⚠️ Suggestion deduplication (avoid creating duplicate suggestions)
- ⚠️ Cache invalidation when HR events occur

**MITIGATION**:
- Use existing permission checks from HR controllers
- Add unique constraints on suggestions (orgId + entityType + entityId)
- Call `SuggestionsService.invalidateCache()` in event listeners

---

## 7. Dependencies

### Required Services (Already Available)
- ✅ LeaveService
- ✅ EmployeeDocumentsService
- ✅ EmployeesService
- ✅ PrismaService
- ✅ EventEmitter2
- ✅ SuggestionsService

### Required Permissions (Need to Verify)
```typescript
// Check these exist in permission system:
'hr:manage'           // Approve/reject leave, verify documents
'hr:view'             // View HR data
'employees:create'    // Create employees
'employees:update'    // Update employee info
```

---

## 8. Database Schema Requirements

### Existing Models (No Changes Needed)
- ✅ `LeaveRequest` (line 1099)
- ✅ `EmployeeDocument` (line 1233)
- ✅ `Employee` (line 983)
- ✅ `Suggestion` (line 3132)
- ✅ `MessageActionLog` (for action tracking)

### Potential Enhancements (Optional)
```prisma
// Add to Suggestion model for better HR filtering
model Suggestion {
  // ... existing fields ...

  // Optional: Add HR-specific fields
  hrCategory     HRCategory?  // LEAVE, DOCUMENT, ONBOARDING, CONTRACT
  employeeId     String?      // Link to employee
  employee       Employee?    @relation(fields: [employeeId], references: [id])
}

enum HRCategory {
  LEAVE
  DOCUMENT
  ONBOARDING
  CONTRACT
  PROBATION
}
```

**Recommendation**: Start without schema changes, add if filtering becomes complex.

---

## 9. Testing Requirements

### Unit Tests Needed
1. Leave action handlers (approve, reject, list)
2. Document action handlers (verify, reject)
3. Leave suggestion listener
4. Document suggestion listener
5. HR generator updates

### Integration Tests Needed
1. End-to-end leave approval via chat
2. Document verification workflow
3. Suggestion creation on events
4. Permission enforcement

### Test Data Requirements
- Sample employees with various statuses
- Leave requests in different states
- Documents pending verification
- Expiring documents

---

## 10. Recommended Implementation Order

### Phase 1: Leave Request Integration (Critical Path)
**Goal**: Enable leave approval/rejection via chat

1. Add action types for leave operations
2. Create `ApproveLeaveHandler` and `RejectLeaveHandler`
3. Create `LeaveSuggestionListener`
4. Register handlers in ActionExecutor
5. Test end-to-end flow

**Output**: Manager can approve/reject leave requests from chat suggestions

---

### Phase 2: Document Workflow Integration
**Goal**: Enable document verification via chat

1. Add event emissions to `EmployeeDocumentsService`
2. Create `DocumentSuggestionListener`
3. Create `VerifyDocumentHandler` and `RejectDocumentHandler`
4. Add document expiration checks to HR generator
5. Test verification workflow

**Output**: HR can verify/reject documents from chat suggestions

---

### Phase 3: Enhanced Suggestions & Queries
**Goal**: Add query capabilities

1. Create `ListLeaveHandler` for querying leave requests
2. Create `ListPendingDocumentsHandler`
3. Add onboarding tracking to employees
4. Enhance HR generator with more suggestion types
5. Add employee creation handler (optional)

**Output**: Chat can answer "Show pending leave requests" queries

---

## 11. Key Integration Points Summary

### Events to Wire
```typescript
// Leave Module (already emitted, needs listener)
'leave.request.submitted'  → Create approval suggestion
'leave.request.approved'   → Update/dismiss suggestion
'leave.request.rejected'   → Update/dismiss suggestion
'leave.request.cancelled'  → Update/dismiss suggestion

// Document Module (needs emission + listener)
'hr.document.uploaded'     → Create verification suggestion
'hr.document.verified'     → Dismiss suggestion
'hr.document.rejected'     → Dismiss suggestion
'hr.document.expiring'     → Create reminder (cron job)

// Employee Module (optional)
'employee.created'         → Create onboarding suggestions
'employee.updated'         → Update related suggestions
```

---

### Actions to Implement
```typescript
// Priority 1: Leave Management
APPROVE_LEAVE       → LeaveService.approveRequest()
REJECT_LEAVE        → LeaveService.rejectRequest()
LIST_LEAVE_REQUESTS → LeaveService.getPendingForOrganisation()

// Priority 2: Document Management
VERIFY_DOCUMENT     → EmployeeDocumentsService.verifyDocument()
REJECT_DOCUMENT     → EmployeeDocumentsService.rejectDocument()
LIST_PENDING_DOCS   → EmployeeDocumentsService.getDocumentsRequiringAttention()

// Priority 3: Employee Management (optional)
CREATE_EMPLOYEE     → EmployeesService.create()
UPDATE_EMPLOYEE     → EmployeesService.update()
```

---

### Suggestions to Generate
```typescript
// From Events (Reactive)
- "Leave request from [Name] ([dates]) - Approve?"
- "New employee document uploaded - Review?"
- "[Name]'s document rejected - Re-upload needed"

// From Scheduled Checks (Proactive)
- "[N] pending leave requests await approval"
- "[N] employee documents expiring this month"
- "Probation period ending for [Name] - Schedule review"
- "[Name]'s contract expires in [N] days"
- "New employee [Name] - Onboarding incomplete"
```

---

## 12. Code Examples

### Example: Complete Leave Approval Flow

**1. Event Listener** (`leave-suggestion.listener.ts`):
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class LeaveSuggestionListener {
  private readonly logger = new Logger(LeaveSuggestionListener.name);

  constructor(private prisma: PrismaService) {}

  @OnEvent('leave.request.submitted')
  async handleLeaveSubmitted(payload: any) {
    const { leaveRequest, employeeId } = payload;

    this.logger.log(`Creating suggestion for leave request ${leaveRequest.id}`);

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) return;

    // Create suggestion for managers
    await this.prisma.suggestion.create({
      data: {
        orgId: employee.orgId,
        userId: null, // Org-wide (managers)
        type: 'QUICK_ACTION',
        priority: 'MEDIUM',
        title: `Leave request from ${employee.firstName} ${employee.lastName}`,
        description: `${employee.firstName} ${employee.lastName} requested ${leaveRequest.leaveType} leave from ${this.formatDate(leaveRequest.startDate)} to ${this.formatDate(leaveRequest.endDate)}. Total: ${leaveRequest.totalDays} days.`,
        actionLabel: 'Review Request',
        entityType: 'LeaveRequest',
        entityId: leaveRequest.id,
        actionType: 'approve_leave',
        actionParams: {
          leaveRequestId: leaveRequest.id,
          employeeId,
          employeeName: `${employee.firstName} ${employee.lastName}`,
        },
        status: 'PENDING',
        showAfter: new Date(),
      },
    });
  }

  @OnEvent('leave.request.approved')
  @OnEvent('leave.request.rejected')
  async handleLeaveResolved(payload: any) {
    const { leaveRequest } = payload;

    // Dismiss the suggestion
    await this.prisma.suggestion.updateMany({
      where: {
        entityType: 'LeaveRequest',
        entityId: leaveRequest.id,
        status: { in: ['PENDING', 'VIEWED'] },
      },
      data: {
        status: 'ACTED',
        actedAt: new Date(),
      },
    });
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  }
}
```

**2. Action Handler** (`handlers/approve-leave.handler.ts`):
```typescript
import { Injectable } from '@nestjs/common';
import { BaseActionHandler } from './base.handler';
import { LeaveService } from '../../../hr/leave/leave.service';
import {
  ActionResult,
  ActionContext,
  ValidationResult,
  ParameterDefinition,
} from '../action.types';

@Injectable()
export class ApproveLeaveHandler extends BaseActionHandler {
  constructor(private readonly leaveService: LeaveService) {
    super('ApproveLeaveHandler');
  }

  async execute(
    params: any,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      const { leaveRequestId, note } = params;

      const result = await this.leaveService.approveRequest(
        leaveRequestId,
        context.userId,
        note,
      );

      const employee = await this.prisma.employee.findUnique({
        where: { id: result.employeeId },
        select: { firstName: true, lastName: true },
      });

      return {
        success: true,
        message: `Leave request approved for ${employee?.firstName} ${employee?.lastName}`,
        entityType: 'LeaveRequest',
        entityId: result.id,
        data: {
          leaveRequest: result,
          approvedBy: context.userId,
        },
      };
    } catch (error) {
      this.logger.error('Error approving leave:', error);
      return {
        success: false,
        message: 'Failed to approve leave request',
        error: error.message,
      };
    }
  }

  validate(params: any, context: ActionContext): ValidationResult {
    const errors: string[] = [];

    if (!params.leaveRequestId) {
      errors.push('Leave request ID is required');
    }

    if (!context.permissions.includes('hr:manage')) {
      errors.push('You do not have permission to approve leave requests');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'leaveRequestId',
        type: 'string',
        required: true,
        description: 'ID of the leave request to approve',
      },
      {
        name: 'note',
        type: 'string',
        required: false,
        description: 'Optional note for the employee',
      },
    ];
  }
}
```

**3. Register in ActionExecutor** (`action-executor.service.ts`):
```typescript
// Add to imports
import { ApproveLeaveHandler } from './handlers/approve-leave.handler';
import { RejectLeaveHandler } from './handlers/reject-leave.handler';

// Add to constructor
constructor(
  // ... existing handlers ...
  private approveLeaveHandler: ApproveLeaveHandler,
  private rejectLeaveHandler: RejectLeaveHandler,
) {
  this.registerHandlers();
}

// Add to registerHandlers()
private registerHandlers(): void {
  // ... existing handlers ...
  this.handlers.set(ActionType.APPROVE_LEAVE, this.approveLeaveHandler);
  this.handlers.set(ActionType.REJECT_LEAVE, this.rejectLeaveHandler);
}

// Add to getAvailableActions()
{
  type: ActionType.APPROVE_LEAVE,
  name: 'Approve Leave Request',
  description: 'Approve an employee leave request',
  parameters: this.approveLeaveHandler.getRequiredParameters(),
  requiredPermissions: ['hr:manage'],
  requiresConfirmation: false,
  riskLevel: 'low',
  examples: [
    '[ACTION:approve_leave params={"leaveRequestId":"lr_123","note":"Approved"}]',
  ],
},
```

---

## 13. Next Steps

### Immediate Actions (BRIDGE Agent)
1. ✅ **This Analysis Document** - Complete understanding of integration needs
2. Create GitHub issue with implementation tasks
3. Coordinate with FORGE (Backend) for service integration
4. Coordinate with PRISM (Frontend) for UI updates

### Implementation Sequence
1. **Sprint 1 Week 1**: Leave approval/rejection (Phase 1)
2. **Sprint 1 Week 2**: Document verification (Phase 2)
3. **Sprint 2**: Enhanced queries and suggestions (Phase 3)

### Success Criteria
- [ ] Manager receives chat suggestion when employee submits leave
- [ ] Manager can approve/reject leave directly from chat
- [ ] HR receives notification when document is uploaded
- [ ] HR can verify/reject documents from chat
- [ ] Proactive suggestions for expiring documents
- [ ] All actions logged in MessageActionLog
- [ ] Permissions properly enforced

---

## Appendix A: File Tree

```
apps/api/src/modules/
├── hr/
│   ├── employees/
│   │   ├── employees.service.ts         (Needs: Event emissions)
│   │   ├── employees.controller.ts
│   │   └── employees.repository.ts
│   ├── leave/
│   │   ├── leave.service.ts             (Has: Event emissions ✓)
│   │   ├── leave.controller.ts
│   │   ├── leave.repository.ts
│   │   └── listeners/
│   │       ├── leave-notification.listener.ts  (Exists: Placeholder)
│   │       └── leave-suggestion.listener.ts    (NEW: Create suggestions)
│   └── documents/
│       ├── employee-documents.service.ts       (Needs: Event emissions)
│       ├── employee-documents.controller.ts
│       ├── document-storage.service.ts
│       └── listeners/                          (NEW: Entire directory)
│           └── document-suggestion.listener.ts
├── chatbot/
│   ├── actions/
│   │   ├── action.types.ts                     (Modify: Add HR types)
│   │   ├── action-executor.service.ts          (Modify: Register handlers)
│   │   └── handlers/
│   │       ├── approve-leave.handler.ts        (NEW)
│   │       ├── reject-leave.handler.ts         (NEW)
│   │       ├── list-leave.handler.ts           (NEW)
│   │       ├── verify-document.handler.ts      (NEW)
│   │       └── reject-document.handler.ts      (NEW)
│   └── suggestions/
│       ├── proactive-suggestions.service.ts    (Has: HR generator ✓)
│       └── generators/
│           └── hr-suggestions.generator.ts     (Enhance: Add more checks)
```

---

## Appendix B: Permission Matrix

| Action | Required Permission | Risk Level | Confirmation |
|--------|-------------------|------------|--------------|
| Approve Leave | `hr:manage` | Low | No |
| Reject Leave | `hr:manage` | Low | Optional |
| View Leave Requests | `hr:view` | Low | No |
| Verify Document | `hr:manage` | Medium | No |
| Reject Document | `hr:manage` | Medium | Yes (reason) |
| Create Employee | `employees:create` | High | Yes |
| Update Employee | `employees:update` | Medium | No |
| View Documents | `hr:view` | Low | No |

---

## Conclusion

The HR modules are **80% ready** for chat integration. The infrastructure exists (events, services, database), but the **critical missing piece** is the Chat Action Executor wiring.

**Estimated effort**: 15 hours
**Complexity**: LOW to MEDIUM
**Risk**: LOW (well-established patterns)
**Value**: HIGH (major UX improvement for HR workflows)

**Recommendation**: Proceed with Phase 1 (Leave Request Integration) immediately as it provides the highest value with lowest risk.
