import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { UpdateAutopilotConfigDto } from "./dto/update-config.dto";
import { ActionQueryDto } from "./dto/action-query.dto";
import {
  AutopilotConfig,
  AutopilotAction,
  AutopilotSummary,
  AutopilotActionType,
  AutopilotActionStatus,
  BillStatus,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// Time estimates for each action type (in minutes)
const TIME_ESTIMATES = {
  CATEGORIZE_TRANSACTION: 1,
  CREATE_INVOICE: 5,
  SEND_REMINDER: 2,
  RECONCILE_TRANSACTION: 3,
  EXTRACT_RECEIPT: 4,
  PAY_BILL: 3,
  FILE_EXPENSE: 2,
  CREATE_CLIENT: 4,
  MATCH_PAYMENT: 2,
};

@Injectable()
export class AutopilotService {
  private readonly logger = new Logger(AutopilotService.name);

  constructor(private prisma: PrismaService) {}

  // ============================================================================
  // CONFIGURATION METHODS
  // ============================================================================

  async getConfig(organisationId: string): Promise<AutopilotConfig> {
    let config = await this.prisma.autopilotConfig.findUnique({
      where: { organisationId },
    });

    // Create default config if it doesn't exist
    if (!config) {
      config = await this.prisma.autopilotConfig.create({
        data: {
          organisationId,
          enabled: false,
        },
      });
    }

    return config;
  }

  async updateConfig(
    organisationId: string,
    dto: UpdateAutopilotConfigDto,
  ): Promise<AutopilotConfig> {
    // Ensure config exists first
    await this.getConfig(organisationId);

    return this.prisma.autopilotConfig.update({
      where: { organisationId },
      data: {
        ...dto,
        maxAutoAmount: dto.maxAutoAmount
          ? new Decimal(dto.maxAutoAmount)
          : undefined,
      },
    });
  }

  async enableAutopilot(organisationId: string): Promise<AutopilotConfig> {
    return this.updateConfig(organisationId, { enabled: true });
  }

  async disableAutopilot(organisationId: string): Promise<AutopilotConfig> {
    return this.updateConfig(organisationId, { enabled: false });
  }

  // ============================================================================
  // ACTION PROCESSING METHODS
  // ============================================================================

  async processQueue(organisationId: string): Promise<void> {
    const config = await this.getConfig(organisationId);

    if (!config.enabled) {
      return;
    }

    // Get all approved actions that haven't been executed
    const actions = await this.prisma.autopilotAction.findMany({
      where: {
        organisationId,
        status: AutopilotActionStatus.APPROVED,
        executedAt: null,
      },
      orderBy: { createdAt: "asc" },
    });

    // Execute each action
    for (const action of actions) {
      try {
        await this.executeAction(action.id);
      } catch (error) {
        this.logger.error(`Failed to execute action ${action.id}:`, error instanceof Error ? error.stack : String(error));
      }
    }
  }

  async executeAction(actionId: string): Promise<AutopilotAction> {
    const action = await this.prisma.autopilotAction.findUnique({
      where: { id: actionId },
    });

    if (!action) {
      throw new NotFoundException("Action not found");
    }

    if (action.status !== AutopilotActionStatus.APPROVED) {
      throw new BadRequestException("Action must be approved before execution");
    }

    try {
      this.logger.log(
        `Executing autopilot action ${actionId} of type ${action.type}`,
      );

      // Route to appropriate handler based on action type
      switch (action.type) {
        case AutopilotActionType.CATEGORIZE_TRANSACTION:
          await this.executeCategorizeTransaction(action);
          break;

        case AutopilotActionType.CREATE_INVOICE:
          await this.executeCreateInvoice(action);
          break;

        case AutopilotActionType.SEND_REMINDER:
          await this.executeSendReminder(action);
          break;

        case AutopilotActionType.RECONCILE_TRANSACTION:
          await this.executeReconcileTransaction(action);
          break;

        case AutopilotActionType.EXTRACT_RECEIPT:
          await this.executeExtractReceipt(action);
          break;

        case AutopilotActionType.PAY_BILL:
          await this.executePayBill(action);
          break;

        default:
          throw new BadRequestException(
            `Unsupported action type: ${action.type}`,
          );
      }

      // Mark action as executed
      await this.prisma.autopilotAction.update({
        where: { id: actionId },
        data: {
          status: AutopilotActionStatus.EXECUTED,
          executedAt: new Date(),
        },
      });

      this.logger.log(`Successfully executed autopilot action ${actionId}`);

      return await this.prisma.autopilotAction.findUnique({
        where: { id: actionId },
      });
    } catch (error) {
      this.logger.error(
        `Failed to execute autopilot action ${actionId}: ${error.message}`,
        error.stack,
      );

      await this.prisma.autopilotAction.update({
        where: { id: actionId },
        data: {
          status: AutopilotActionStatus.FAILED,
          error: error.message,
        },
      });

      throw error;
    }
  }

  async approveAction(
    actionId: string,
    userId: string,
  ): Promise<AutopilotAction> {
    const action = await this.prisma.autopilotAction.findUnique({
      where: { id: actionId },
    });

    if (!action) {
      throw new NotFoundException("Action not found");
    }

    if (action.status !== AutopilotActionStatus.PENDING) {
      throw new BadRequestException("Only pending actions can be approved");
    }

    return this.prisma.autopilotAction.update({
      where: { id: actionId },
      data: {
        status: AutopilotActionStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: userId,
      },
    });
  }

  async rejectAction(
    actionId: string,
    userId: string,
    reason: string,
  ): Promise<AutopilotAction> {
    const action = await this.prisma.autopilotAction.findUnique({
      where: { id: actionId },
    });

    if (!action) {
      throw new NotFoundException("Action not found");
    }

    if (action.status !== AutopilotActionStatus.PENDING) {
      throw new BadRequestException("Only pending actions can be rejected");
    }

    return this.prisma.autopilotAction.update({
      where: { id: actionId },
      data: {
        status: AutopilotActionStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedReason: reason,
      },
    });
  }

  // ============================================================================
  // ACTION EXECUTION HANDLERS
  // ============================================================================

  private async executeCategorizeTransaction(
    action: AutopilotAction,
  ): Promise<void> {
    if (!action.entityId) {
      throw new BadRequestException(
        "Transaction ID is required for CATEGORIZE_TRANSACTION action",
      );
    }

    const newValue = action.newValue as any;
    if (!newValue?.category) {
      throw new BadRequestException(
        "Category is required in newValue for CATEGORIZE_TRANSACTION action",
      );
    }

    this.logger.log(
      `Categorizing transaction ${action.entityId} as ${newValue.category}`,
    );

    // Update the bank transaction's category
    await this.prisma.bankTransaction.update({
      where: { id: action.entityId },
      data: {
        category: newValue.category,
      },
    });

    this.logger.log(`Successfully categorized transaction ${action.entityId}`);
  }

  private async executeCreateInvoice(action: AutopilotAction): Promise<void> {
    // TODO: Wire up InvoicesService to create invoice from action data
    // This will require injecting InvoicesService and implementing invoice creation logic
    this.logger.warn(
      `CREATE_INVOICE action not yet implemented - action ID: ${action.id}`,
    );
    this.logger.debug(`Action details: ${JSON.stringify(action)}`);
    throw new BadRequestException(
      "CREATE_INVOICE action is not yet implemented",
    );
  }

  private async executeSendReminder(action: AutopilotAction): Promise<void> {
    // TODO: Wire up NotificationsService to send payment reminder
    // This will require injecting NotificationsService and implementing reminder logic
    this.logger.warn(
      `SEND_REMINDER action not yet implemented - action ID: ${action.id}`,
    );
    this.logger.debug(`Action details: ${JSON.stringify(action)}`);
    throw new BadRequestException(
      "SEND_REMINDER action is not yet implemented",
    );
  }

  private async executeReconcileTransaction(
    action: AutopilotAction,
  ): Promise<void> {
    if (!action.entityId) {
      throw new BadRequestException(
        "Transaction ID is required for RECONCILE_TRANSACTION action",
      );
    }

    const newValue = action.newValue as any;

    this.logger.log(`Reconciling transaction ${action.entityId}`);

    // Update the bank transaction to mark it as reconciled
    await this.prisma.bankTransaction.update({
      where: { id: action.entityId },
      data: {
        isReconciled: true,
      },
    });

    // If there's an invoice ID in the newValue, create a payment allocation
    if (newValue?.invoiceId) {
      this.logger.log(
        `Creating payment allocation for invoice ${newValue.invoiceId}`,
      );

      // Get the transaction to get amount details
      const transaction = await this.prisma.bankTransaction.findUnique({
        where: { id: action.entityId },
      });

      if (!transaction) {
        throw new NotFoundException(`Transaction ${action.entityId} not found`);
      }

      // Create the payment allocation
      await this.prisma.paymentAllocation.create({
        data: {
          invoiceId: newValue.invoiceId,
          transactionId: action.entityId,
          orgId: action.organisationId,
          amount: transaction.amount,
          currency: transaction.currency,
          allocatedBy: "AUTOPILOT",
          matchMethod: "AUTOPILOT",
          confidence: action.confidence ? action.confidence / 100 : null,
        },
      });

      this.logger.log(
        `Successfully created payment allocation for invoice ${newValue.invoiceId}`,
      );
    }

    this.logger.log(`Successfully reconciled transaction ${action.entityId}`);
  }

  private async executeExtractReceipt(action: AutopilotAction): Promise<void> {
    // TODO: Wire up ReceiptScannerService to extract receipt data
    // This will require injecting ReceiptScannerService and implementing extraction logic
    this.logger.warn(
      `EXTRACT_RECEIPT action not yet implemented - action ID: ${action.id}`,
    );
    this.logger.debug(`Action details: ${JSON.stringify(action)}`);
    throw new BadRequestException(
      "EXTRACT_RECEIPT action is not yet implemented",
    );
  }

  private async executePayBill(action: AutopilotAction): Promise<void> {
    // TODO: Wire up PaymentService to initiate bill payment
    // This will require injecting a payment service (e.g., TrueLayer, Stripe, etc.)
    // and implementing payment initiation logic
    this.logger.warn(
      `PAY_BILL action not yet implemented - action ID: ${action.id}`,
    );
    this.logger.debug(`Action details: ${JSON.stringify(action)}`);
    throw new BadRequestException("PAY_BILL action is not yet implemented");
  }

  // ============================================================================
  // AUTO-DETECTION METHODS
  // ============================================================================

  async detectCategorizableTransactions(organisationId: string): Promise<void> {
    const config = await this.getConfig(organisationId);

    if (!config.enabled || !config.autoCategorizeTx) {
      return;
    }

    // Find uncategorized bank transactions from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const uncategorizedTransactions =
      await this.prisma.bankTransaction.findMany({
        where: {
          category: null,
          date: {
            gte: thirtyDaysAgo,
          },
          bankAccount: {
            orgId: organisationId,
          },
        },
        include: {
          bankAccount: true,
        },
        orderBy: {
          date: "desc",
        },
      });

    // Create CATEGORIZE_TRANSACTION actions for each transaction
    for (const transaction of uncategorizedTransactions) {
      // Check if an action already exists for this transaction
      const existingAction = await this.prisma.autopilotAction.findFirst({
        where: {
          organisationId,
          type: AutopilotActionType.CATEGORIZE_TRANSACTION,
          entityType: "BankTransaction",
          entityId: transaction.id,
          status: {
            in: [AutopilotActionStatus.PENDING, AutopilotActionStatus.APPROVED],
          },
        },
      });

      // Skip if action already exists
      if (existingAction) {
        continue;
      }

      // Create a readable description
      const description = `Categorize transaction: ${transaction.description} - ${transaction.currency} ${transaction.amount.toString()}`;

      // Create the autopilot action
      await this.prisma.autopilotAction.create({
        data: {
          organisationId,
          type: AutopilotActionType.CATEGORIZE_TRANSACTION,
          entityType: "BankTransaction",
          entityId: transaction.id,
          description,
          status: AutopilotActionStatus.PENDING,
          requiresApproval: true,
        },
      });
    }
  }

  async detectInvoiceOpportunities(organisationId: string): Promise<void> {
    const config = await this.getConfig(organisationId);

    if (!config.enabled || !config.autoCreateInvoices) {
      return;
    }

    this.logger.log(
      `Detecting invoice opportunities for org ${organisationId}`,
    );

    // Calculate date range - last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      // Find approved time entries from the last 30 days that don't have invoices
      // We'll group by employee to create one action per employee with unbilled hours
      const unbilledTimeEntries = await this.prisma.timeEntry.findMany({
        where: {
          employee: {
            orgId: organisationId,
          },
          status: "APPROVED", // Only approved time entries
          date: {
            gte: thirtyDaysAgo,
          },
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          date: "asc",
        },
      });

      // Group time entries by employee
      const entriesByEmployee = new Map<
        string,
        {
          employeeId: string;
          employeeName: string;
          totalHours: number;
          entries: any[];
        }
      >();

      for (const entry of unbilledTimeEntries) {
        const key = entry.employeeId;
        if (!entriesByEmployee.has(key)) {
          entriesByEmployee.set(key, {
            employeeId: entry.employeeId,
            employeeName: `${entry.employee.firstName} ${entry.employee.lastName}`,
            totalHours: 0,
            entries: [],
          });
        }

        const group = entriesByEmployee.get(key)!;
        group.totalHours += Number(entry.totalHours);
        group.entries.push(entry);
      }

      this.logger.log(
        `Found ${entriesByEmployee.size} employees with unbilled time entries`,
      );

      // Create autopilot actions for each employee with unbilled hours
      for (const group of Array.from(entriesByEmployee.values())) {
        if (group.totalHours === 0) {
          continue;
        }

        const description = `Create invoice for ${group.employeeName} - ${group.totalHours.toFixed(2)} hours unbilled`;

        // Check if we already have a pending action for this employee
        const existingAction = await this.prisma.autopilotAction.findFirst({
          where: {
            organisationId,
            type: AutopilotActionType.CREATE_INVOICE,
            entityType: "TimeEntry",
            entityId: group.employeeId,
            status: {
              in: [
                AutopilotActionStatus.PENDING,
                AutopilotActionStatus.APPROVED,
              ],
            },
          },
        });

        // Skip if duplicate action exists
        if (existingAction) {
          this.logger.debug(
            `Skipping duplicate action for employee ${group.employeeId}`,
          );
          continue;
        }

        // Create the autopilot action
        await this.prisma.autopilotAction.create({
          data: {
            organisationId,
            type: AutopilotActionType.CREATE_INVOICE,
            entityType: "TimeEntry",
            entityId: group.employeeId,
            description,
            status: AutopilotActionStatus.PENDING,
            newValue: {
              employeeName: group.employeeName,
              totalHours: group.totalHours,
              entryCount: group.entries.length,
              dateRange: {
                from: group.entries[0].date,
                to: group.entries[group.entries.length - 1].date,
              },
            },
          },
        });

        this.logger.log(
          `Created invoice action for ${group.employeeName}: ${group.totalHours} hours`,
        );
      }

      // Additionally, find clients with unbilled work (mileage entries)
      const unbilledMileageEntries = await this.prisma.mileageEntry.findMany({
        where: {
          organisationId,
          clientId: { not: null },
          reimbursed: false, // Not yet reimbursed/invoiced
          date: {
            gte: thirtyDaysAgo,
          },
        },
      });

      // Group mileage by client
      const mileageByClient = new Map<
        string,
        {
          clientId: string;
          clientName: string;
          totalKm: number;
          entries: any[];
        }
      >();

      // Get unique client IDs and fetch client data
      const clientIds = Array.from(
        new Set(
          unbilledMileageEntries.map((e) => e.clientId).filter(Boolean),
        ),
      );
      const clients = await this.prisma.client.findMany({
        where: { id: { in: clientIds as string[] } },
        select: { id: true, name: true },
      });
      const clientMap = new Map(clients.map((c) => [c.id, c.name]));

      for (const entry of unbilledMileageEntries) {
        if (!entry.clientId) continue;

        const key = entry.clientId;
        if (!mileageByClient.has(key)) {
          mileageByClient.set(key, {
            clientId: entry.clientId,
            clientName: clientMap.get(entry.clientId) || "Unknown Client",
            totalKm: 0,
            entries: [],
          });
        }

        const group = mileageByClient.get(key)!;
        group.totalKm += Number(entry.distanceKm || 0);
        group.entries.push(entry);
      }

      this.logger.log(
        `Found ${mileageByClient.size} clients with unbilled mileage`,
      );

      // Create autopilot actions for each client with unbilled mileage
      for (const group of Array.from(mileageByClient.values())) {
        if (group.totalKm === 0) {
          continue;
        }

        const description = `Create invoice for ${group.clientName} - ${group.totalKm.toFixed(2)} km unbilled mileage`;

        // Check for duplicate action
        const existingAction = await this.prisma.autopilotAction.findFirst({
          where: {
            organisationId,
            type: AutopilotActionType.CREATE_INVOICE,
            entityType: "Client",
            entityId: group.clientId,
            status: {
              in: [
                AutopilotActionStatus.PENDING,
                AutopilotActionStatus.APPROVED,
              ],
            },
          },
        });

        if (existingAction) {
          this.logger.debug(
            `Skipping duplicate action for client ${group.clientId}`,
          );
          continue;
        }

        // Create the autopilot action
        await this.prisma.autopilotAction.create({
          data: {
            organisationId,
            type: AutopilotActionType.CREATE_INVOICE,
            entityType: "Client",
            entityId: group.clientId,
            description,
            status: AutopilotActionStatus.PENDING,
            newValue: {
              clientName: group.clientName,
              totalKm: group.totalKm,
              entryCount: group.entries.length,
              dateRange: {
                from: group.entries[0].date,
                to: group.entries[group.entries.length - 1].date,
              },
            },
          },
        });

        this.logger.log(
          `Created invoice action for ${group.clientName}: ${group.totalKm} km`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to detect invoice opportunities: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async detectOverdueInvoices(organisationId: string): Promise<void> {
    const config = await this.getConfig(organisationId);

    if (!config.enabled || !config.autoSendReminders) {
      return;
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find invoices that are overdue
    const overdueInvoices = await this.prisma.invoice.findMany({
      where: {
        orgId: organisationId,
        status: {
          in: ["SENT", "OVERDUE"],
        },
        dueDate: {
          lt: now,
        },
      },
      include: {
        paymentReminders: {
          where: {
            sentAt: {
              gte: sevenDaysAgo,
            },
          },
          orderBy: {
            sentAt: "desc",
          },
          take: 1,
        },
      },
    });

    // Filter out invoices that had a reminder in the last 7 days
    const invoicesNeedingReminders = overdueInvoices.filter(
      (invoice) => invoice.paymentReminders.length === 0,
    );

    // Create autopilot actions for each invoice
    for (const invoice of invoicesNeedingReminders) {
      // Calculate days overdue
      const daysOverdue = Math.floor(
        (now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Format amount with currency
      const amount = `${invoice.currency} ${invoice.totalAmount.toString()}`;

      const description = `Send payment reminder for Invoice #${invoice.number} - ${amount} overdue by ${daysOverdue} days`;

      // Check if an action already exists for this invoice
      const existingAction = await this.prisma.autopilotAction.findFirst({
        where: {
          organisationId,
          type: AutopilotActionType.SEND_REMINDER,
          entityType: "Invoice",
          entityId: invoice.id,
          status: {
            in: [AutopilotActionStatus.PENDING, AutopilotActionStatus.APPROVED],
          },
        },
      });

      // Skip if action already exists
      if (existingAction) {
        continue;
      }

      // Create new autopilot action
      await this.prisma.autopilotAction.create({
        data: {
          organisationId,
          type: AutopilotActionType.SEND_REMINDER,
          status: AutopilotActionStatus.PENDING,
          description,
          entityType: "Invoice",
          entityId: invoice.id,
          requiresApproval: true,
          newValue: {
            invoiceNumber: invoice.number,
            customerName: invoice.customerName,
            customerEmail: invoice.customerEmail,
            amount: invoice.totalAmount.toString(),
            currency: invoice.currency,
            dueDate: invoice.dueDate.toISOString(),
            daysOverdue,
          },
        },
      });

      this.logger.log(
        `Created SEND_REMINDER action for overdue invoice ${invoice.number} (${daysOverdue} days overdue)`,
      );
    }
  }

  async detectReconciliationMatches(organisationId: string): Promise<void> {
    const config = await this.getConfig(organisationId);

    if (!config.enabled || !config.autoReconcile) {
      return;
    }

    this.logger.log(
      `Detecting reconciliation matches for organisation ${organisationId}`,
    );

    // Find unreconciled bank transactions from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get bank accounts for this organisation
    const bankAccounts = await this.prisma.bankAccount.findMany({
      where: { orgId: organisationId },
      select: { id: true },
    });

    const bankAccountIds = bankAccounts.map((ba) => ba.id);

    if (bankAccountIds.length === 0) {
      this.logger.log(
        `No bank accounts found for organisation ${organisationId}`,
      );
      return; // No bank accounts, nothing to reconcile
    }

    // Find unreconciled transactions
    const unreconciledTransactions = await this.prisma.bankTransaction.findMany(
      {
        where: {
          bankAccountId: { in: bankAccountIds },
          isReconciled: false,
          date: {
            gte: thirtyDaysAgo,
          },
        },
        orderBy: { date: "desc" },
      },
    );

    this.logger.log(
      `Found ${unreconciledTransactions.length} unreconciled transactions`,
    );

    // Get unpaid/overdue invoices to match against
    const invoices = await this.prisma.invoice.findMany({
      where: {
        orgId: organisationId,
        status: {
          in: ["SENT", "OVERDUE"],
        },
      },
      select: {
        id: true,
        number: true,
        totalAmount: true,
        currency: true,
        customerName: true,
      },
    });

    this.logger.log(
      `Found ${invoices.length} unpaid invoices to match against`,
    );

    let matchesCreated = 0;

    // Process each transaction and try to find matches
    for (const transaction of unreconciledTransactions) {
      // Check if we already have a pending/approved action for this transaction
      const existingAction = await this.prisma.autopilotAction.findFirst({
        where: {
          organisationId,
          type: AutopilotActionType.RECONCILE_TRANSACTION,
          entityType: "BankTransaction",
          entityId: transaction.id,
          status: {
            in: [AutopilotActionStatus.PENDING, AutopilotActionStatus.APPROVED],
          },
        },
      });

      if (existingAction) {
        continue; // Skip if we already have an action for this transaction
      }

      // Only match credit transactions (incoming payments)
      if (transaction.type !== "credit") {
        continue;
      }

      // Try to find matching invoices
      const potentialMatches = [];

      for (const invoice of invoices) {
        // Skip if currencies don't match
        if (invoice.currency !== transaction.currency) {
          continue;
        }

        const invoiceAmount = Number(invoice.totalAmount);
        const transactionAmount = Math.abs(Number(transaction.amount));

        // Calculate amount tolerance (1%)
        const tolerance = invoiceAmount * 0.01;
        const amountMatches =
          Math.abs(invoiceAmount - transactionAmount) <= tolerance;

        // Check for reference match
        const referenceText =
          `${transaction.description} ${transaction.reference || ""} ${transaction.bookingText || ""}`.toLowerCase();
        const invoiceNumber = invoice.number.toLowerCase();
        const referenceMatches = referenceText.includes(invoiceNumber);

        if (amountMatches || referenceMatches) {
          // Calculate confidence score
          let confidence = 0;

          if (referenceMatches && amountMatches) {
            confidence = 95; // High confidence - both match
          } else if (referenceMatches) {
            confidence = 85; // Good confidence - reference matches
          } else if (amountMatches) {
            confidence = 70; // Medium confidence - only amount matches
          }

          potentialMatches.push({
            invoice,
            confidence,
          });
        }
      }

      // If we found matches, create an action for the best one
      if (potentialMatches.length > 0) {
        // Sort by confidence (highest first)
        potentialMatches.sort((a, b) => b.confidence - a.confidence);
        const bestMatch = potentialMatches[0];

        this.logger.log(
          `Creating reconciliation action for transaction ${transaction.id} -> Invoice #${bestMatch.invoice.number} (confidence: ${bestMatch.confidence})`,
        );

        // Create the autopilot action
        await this.prisma.autopilotAction.create({
          data: {
            organisationId,
            type: AutopilotActionType.RECONCILE_TRANSACTION,
            entityType: "BankTransaction",
            entityId: transaction.id,
            description: `Match transaction ${transaction.currency} ${Number(transaction.amount).toFixed(2)} to Invoice #${bestMatch.invoice.number}`,
            confidence: bestMatch.confidence,
            status: AutopilotActionStatus.PENDING,
            newValue: JSON.stringify({
              invoiceId: bestMatch.invoice.id,
              invoiceNumber: bestMatch.invoice.number,
              amount: Number(transaction.amount),
              currency: transaction.currency,
            }),
          },
        });

        matchesCreated++;
      }
    }

    this.logger.log(
      `Created ${matchesCreated} reconciliation match actions for organisation ${organisationId}`,
    );
  }

  async detectUnprocessedReceipts(organisationId: string): Promise<void> {
    const config = await this.getConfig(organisationId);

    if (!config.enabled || !config.autoExtractReceipts) {
      return;
    }

    this.logger.log(
      `Detecting unprocessed receipts for org ${organisationId}`,
    );

    // Calculate date range - last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      // Find documents that appear to be receipts but haven't been processed
      // Look for documents with receipt-related types or names
      const unprocessedDocuments = await this.prisma.document.findMany({
        where: {
          orgId: organisationId,
          createdAt: {
            gte: thirtyDaysAgo,
          },
          OR: [
            // Documents tagged as receipts
            { type: { contains: 'receipt', mode: 'insensitive' } },
            { type: { contains: 'expense', mode: 'insensitive' } },
            // Documents with receipt-like names
            { name: { contains: 'receipt', mode: 'insensitive' } },
            { name: { contains: 'quittung', mode: 'insensitive' } }, // German for receipt
            { name: { contains: 'beleg', mode: 'insensitive' } }, // German for voucher/receipt
            { name: { contains: 'kassenbon', mode: 'insensitive' } }, // German for cash register receipt
          ],
          // Not already linked to an expense
          expenseId: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      this.logger.log(
        `Found ${unprocessedDocuments.length} unprocessed receipt documents`,
      );

      // Create autopilot actions for each unprocessed receipt
      for (const document of unprocessedDocuments) {
        // Check if an action already exists for this document
        const existingAction = await this.prisma.autopilotAction.findFirst({
          where: {
            organisationId,
            type: AutopilotActionType.EXTRACT_RECEIPT,
            entityType: 'Document',
            entityId: document.id,
            status: {
              in: [AutopilotActionStatus.PENDING, AutopilotActionStatus.APPROVED],
            },
          },
        });

        // Skip if action already exists
        if (existingAction) {
          continue;
        }

        // Create a readable description
        const description = `Extract receipt data from: ${document.name}`;

        // Create the autopilot action
        await this.prisma.autopilotAction.create({
          data: {
            organisationId,
            type: AutopilotActionType.EXTRACT_RECEIPT,
            entityType: 'Document',
            entityId: document.id,
            description,
            status: AutopilotActionStatus.PENDING,
            requiresApproval: false, // Receipt extraction is safe to auto-execute
            newValue: {
              documentName: document.name,
              documentType: document.type,
              fileUrl: document.fileUrl,
              uploadedAt: document.createdAt,
            },
          },
        });

        this.logger.log(
          `Created EXTRACT_RECEIPT action for document ${document.name}`,
        );
      }

      // Also check for email attachments that look like receipts
      const emailAttachments = await this.prisma.emailAttachment.findMany({
        where: {
          email: {
            emailAccount: {
              orgId: organisationId,
            },
          },
          createdAt: {
            gte: thirtyDaysAgo,
          },
          OR: [
            { fileName: { contains: 'receipt', mode: 'insensitive' } },
            { fileName: { contains: 'invoice', mode: 'insensitive' } },
            { fileName: { contains: 'rechnung', mode: 'insensitive' } }, // German for invoice
            { fileName: { contains: 'quittung', mode: 'insensitive' } },
            { mimeType: { equals: 'application/pdf' } },
            { mimeType: { startsWith: 'image/' } },
          ],
          // Not already processed
          processedAt: null,
        },
        include: {
          email: {
            select: {
              subject: true,
              from: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      this.logger.log(
        `Found ${emailAttachments.length} unprocessed email attachments`,
      );

      // Create autopilot actions for email attachments
      for (const attachment of emailAttachments) {
        // Check if an action already exists
        const existingAction = await this.prisma.autopilotAction.findFirst({
          where: {
            organisationId,
            type: AutopilotActionType.EXTRACT_RECEIPT,
            entityType: 'EmailAttachment',
            entityId: attachment.id,
            status: {
              in: [AutopilotActionStatus.PENDING, AutopilotActionStatus.APPROVED],
            },
          },
        });

        if (existingAction) {
          continue;
        }

        const description = `Extract receipt from email attachment: ${attachment.fileName} (from: ${attachment.email.from})`;

        await this.prisma.autopilotAction.create({
          data: {
            organisationId,
            type: AutopilotActionType.EXTRACT_RECEIPT,
            entityType: 'EmailAttachment',
            entityId: attachment.id,
            description,
            status: AutopilotActionStatus.PENDING,
            requiresApproval: false,
            newValue: {
              fileName: attachment.fileName,
              mimeType: attachment.mimeType,
              fileSize: attachment.fileSize,
              emailSubject: attachment.email.subject,
              emailFrom: attachment.email.from,
            },
          },
        });

        this.logger.log(
          `Created EXTRACT_RECEIPT action for email attachment ${attachment.fileName}`,
        );
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Failed to detect unprocessed receipts: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  async detectPayableBills(organisationId: string): Promise<void> {
    const config = await this.getConfig(organisationId);

    if (!config.enabled || !config.autoPayBills) {
      return;
    }

    // Calculate date range: next 7 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Find bills that are due within the next 7 days
    const bills = await this.prisma.bill.findMany({
      where: {
        organisationId,
        status: {
          in: [BillStatus.PENDING, BillStatus.APPROVED],
        },
        dueDate: {
          gte: today,
          lte: sevenDaysFromNow,
        },
        // Only include bills under the max auto amount threshold
        totalAmount: config.maxAutoAmount
          ? {
              lte: config.maxAutoAmount,
            }
          : undefined,
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    // Create autopilot actions for each payable bill
    for (const bill of bills) {
      // Check if an action already exists for this bill
      const existingAction = await this.prisma.autopilotAction.findFirst({
        where: {
          organisationId,
          type: AutopilotActionType.PAY_BILL,
          entityType: "Bill",
          entityId: bill.id,
          status: {
            in: [AutopilotActionStatus.PENDING, AutopilotActionStatus.APPROVED],
          },
        },
      });

      // Skip if action already exists
      if (existingAction) {
        continue;
      }

      // Format the due date for display
      const dueDateStr = bill.dueDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      // Create the autopilot action
      await this.prisma.autopilotAction.create({
        data: {
          organisationId,
          type: AutopilotActionType.PAY_BILL,
          entityType: "Bill",
          entityId: bill.id,
          description: `Pay bill to ${bill.vendorName} - ${bill.currency} ${bill.totalAmount.toString()} due ${dueDateStr}`,
          requiresApproval: true, // Always require approval for payments
          status: AutopilotActionStatus.PENDING,
        },
      });
    }
  }

  // ============================================================================
  // ACTION LISTING & QUERYING
  // ============================================================================

  async listActions(organisationId: string, query: ActionQueryDto) {
    const { type, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { organisationId };
    if (type) where.type = type;
    if (status) where.status = status;

    const [actions, total] = await Promise.all([
      this.prisma.autopilotAction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.autopilotAction.count({ where }),
    ]);

    return {
      data: actions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPendingActions(organisationId: string) {
    return this.prisma.autopilotAction.findMany({
      where: {
        organisationId,
        status: AutopilotActionStatus.PENDING,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // ============================================================================
  // SUMMARY METHODS
  // ============================================================================

  async generateDailySummary(
    organisationId: string,
    date: Date,
  ): Promise<AutopilotSummary> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all actions for the day
    const actions = await this.prisma.autopilotAction.findMany({
      where: {
        organisationId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Calculate stats
    const actionsCompleted = actions.filter(
      (a) => a.status === AutopilotActionStatus.EXECUTED,
    ).length;
    const actionsPending = actions.filter(
      (a) => a.status === AutopilotActionStatus.PENDING,
    ).length;
    const actionsRejected = actions.filter(
      (a) => a.status === AutopilotActionStatus.REJECTED,
    ).length;

    const transactionsCategorized = actions.filter(
      (a) =>
        a.type === AutopilotActionType.CATEGORIZE_TRANSACTION &&
        a.status === AutopilotActionStatus.EXECUTED,
    ).length;
    const receiptsProcessed = actions.filter(
      (a) =>
        a.type === AutopilotActionType.EXTRACT_RECEIPT &&
        a.status === AutopilotActionStatus.EXECUTED,
    ).length;
    const invoicesCreated = actions.filter(
      (a) =>
        a.type === AutopilotActionType.CREATE_INVOICE &&
        a.status === AutopilotActionStatus.EXECUTED,
    ).length;
    const remindersSent = actions.filter(
      (a) =>
        a.type === AutopilotActionType.SEND_REMINDER &&
        a.status === AutopilotActionStatus.EXECUTED,
    ).length;
    const reconciliationsCompleted = actions.filter(
      (a) =>
        a.type === AutopilotActionType.RECONCILE_TRANSACTION &&
        a.status === AutopilotActionStatus.EXECUTED,
    ).length;

    // Calculate time saved
    const timeSavedMinutes = actions
      .filter((a) => a.status === AutopilotActionStatus.EXECUTED)
      .reduce((total, action) => total + TIME_ESTIMATES[action.type], 0);

    // TODO: Generate AI summary of the day's activities
    // Use: import { DAILY_SUMMARY_SYSTEM_PROMPT, buildDailySummaryPrompt } from './prompts/daily-summary.prompt';
    // 1. Prepare summary data with all metrics and action details
    // 2. Build prompt using buildDailySummaryPrompt(summaryData)
    // 3. Call Claude API with DAILY_SUMMARY_SYSTEM_PROMPT and built prompt
    // 4. Store the AI-generated summary in the aiSummary field below

    // Upsert summary
    return this.prisma.autopilotSummary.upsert({
      where: {
        organisationId_date: {
          organisationId,
          date: startOfDay,
        },
      },
      create: {
        organisationId,
        date: startOfDay,
        actionsCompleted,
        actionsPending,
        actionsRejected,
        transactionsCategorized,
        receiptsProcessed,
        invoicesCreated,
        remindersSent,
        reconciliationsCompleted,
        timeSavedMinutes,
      },
      update: {
        actionsCompleted,
        actionsPending,
        actionsRejected,
        transactionsCategorized,
        receiptsProcessed,
        invoicesCreated,
        remindersSent,
        reconciliationsCompleted,
        timeSavedMinutes,
      },
    });
  }

  async getDailySummary(
    organisationId: string,
    date: Date,
  ): Promise<AutopilotSummary | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    return this.prisma.autopilotSummary.findUnique({
      where: {
        organisationId_date: {
          organisationId,
          date: startOfDay,
        },
      },
    });
  }

  async getWeeklySummary(organisationId: string) {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const summaries = await this.prisma.autopilotSummary.findMany({
      where: {
        organisationId,
        date: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: { date: "desc" },
    });

    // Aggregate weekly stats
    const totalActionsCompleted = summaries.reduce(
      (sum, s) => sum + s.actionsCompleted,
      0,
    );
    const totalActionsPending = summaries.reduce(
      (sum, s) => sum + s.actionsPending,
      0,
    );
    const totalActionsRejected = summaries.reduce(
      (sum, s) => sum + s.actionsRejected,
      0,
    );
    const totalTimeSavedMinutes = summaries.reduce(
      (sum, s) => sum + s.timeSavedMinutes,
      0,
    );

    return {
      summaries,
      weeklyStats: {
        totalActionsCompleted,
        totalActionsPending,
        totalActionsRejected,
        totalTimeSavedMinutes,
        totalTimeSavedHours: Math.round(totalTimeSavedMinutes / 60),
      },
    };
  }

  // ============================================================================
  // STATS METHODS
  // ============================================================================

  async getStats(organisationId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [config, todayActions, pendingActions, todaySummary] =
      await Promise.all([
        this.getConfig(organisationId),
        this.prisma.autopilotAction.count({
          where: {
            organisationId,
            createdAt: {
              gte: today,
              lt: tomorrow,
            },
          },
        }),
        this.prisma.autopilotAction.count({
          where: {
            organisationId,
            status: AutopilotActionStatus.PENDING,
          },
        }),
        this.getDailySummary(organisationId, today),
      ]);

    return {
      enabled: config.enabled,
      actionsToday: todayActions,
      pendingApproval: pendingActions,
      timeSavedToday: todaySummary?.timeSavedMinutes || 0,
      summary: todaySummary,
    };
  }
}
