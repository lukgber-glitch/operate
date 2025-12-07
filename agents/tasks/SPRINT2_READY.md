# Sprint 2: Chatbot Connectivity - READY TO LAUNCH

**Status:** PENDING (awaiting Sprint 1 completion)
**Estimated Start:** After S1-02 completes
**Owner:** ORACLE + BRIDGE
**Dependencies:** S1-02 (TenantGuard) must be complete

## Tasks

### S2-01: Inject TinkService into Chatbot [4h] - BRIDGE
- **File:** apps/api/src/modules/chatbot/chatbot.module.ts
- **Change:** Import TinkModule, inject TinkService
- **Test:** Chatbot can query bank accounts

### S2-02: Inject StripeService into Chatbot [4h] - BRIDGE
- **File:** apps/api/src/modules/chatbot/chatbot.module.ts
- **Change:** Import StripeModule, inject StripeService
- **Test:** Chatbot can execute Stripe payments

### S2-03: Create BankingContextProvider [6h] - BRIDGE
- **File:** apps/api/src/modules/chatbot/context/providers/banking-context.provider.ts (CREATE)
- **Change:** Provide account balances, recent transactions to chat
- **Test:** Chat shows real bank data
- **Depends:** S2-01

### S2-04: Create search-documents.handler.ts [3h] - ORACLE
- **File:** apps/api/src/modules/chatbot/actions/handlers/search-documents.handler.ts (CREATE)
- **Change:** Natural language document search via chat
- **Test:** "Find invoices from Q3" returns results

### S2-05: Create reduce-expenses.handler.ts [4h] - ORACLE
- **File:** apps/api/src/modules/chatbot/actions/handlers/reduce-expenses.handler.ts (CREATE)
- **Change:** AI expense analysis and reduction recommendations
- **Test:** "Where can I reduce spending?" returns insights

### S2-06: Create tax-consultation.handler.ts [4h] - ORACLE
- **File:** apps/api/src/modules/chatbot/actions/handlers/tax-consultation.handler.ts (CREATE)
- **Change:** Interactive tax questions via chat
- **Test:** "Can I deduct this purchase?" returns answer

### S2-07: Create create-customer.handler.ts [3h] - ORACLE
- **File:** apps/api/src/modules/chatbot/actions/handlers/create-customer.handler.ts (CREATE)
- **Change:** Create customers via chat
- **Test:** "Create customer Acme Corp" works

### S2-08: Update ActionType Enum [1h] - ORACLE
- **File:** apps/api/src/modules/chatbot/actions/action.types.ts
- **Change:** Add SEARCH_DOCUMENTS, REDUCE_EXPENSES, CONSULT_TAXES, CREATE_CUSTOMER
- **Test:** All new actions registered

## Sprint 2 Total: 29h

## Parallel Execution Plan

**Wave 1 (Parallel):**
- S2-01: Inject TinkService (BRIDGE)
- S2-02: Inject StripeService (BRIDGE)
- S2-04: search-documents.handler (ORACLE)
- S2-05: reduce-expenses.handler (ORACLE)
- S2-06: tax-consultation.handler (ORACLE)
- S2-07: create-customer.handler (ORACLE)
- S2-08: Update ActionType Enum (ORACLE)

**Wave 2 (Sequential):**
- S2-03: BankingContextProvider (after S2-01)

## Agent Launch Commands

When Sprint 1 completes, launch these 7 agents in parallel:
1. BRIDGE agent for S2-01 (TinkService)
2. BRIDGE agent for S2-02 (StripeService)
3. ORACLE agent for S2-04 (search-documents)
4. ORACLE agent for S2-05 (reduce-expenses)
5. ORACLE agent for S2-06 (tax-consultation)
6. ORACLE agent for S2-07 (create-customer)
7. ORACLE agent for S2-08 (ActionType enum)

Then S2-03 after S2-01 completes.

---

## Files to Modify (Chatbot Module)

Current chatbot.module.ts imports:
- BankIntelligenceModule ✓
- EmailIntelligenceModule ✓
- InvoicesModule ✓
- ExpensesModule ✓
- BillsModule ✓
- HrModule ✓

Missing (to add in Sprint 2):
- TinkModule (for direct bank queries)
- StripeModule (for payment execution)
- ContactsModule (for customer creation)
- DocumentsModule (for document search)
