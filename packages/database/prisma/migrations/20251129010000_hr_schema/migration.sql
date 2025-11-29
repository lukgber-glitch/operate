-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'TERMINATED', 'PENDING');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('PERMANENT', 'FIXED_TERM', 'PART_TIME', 'MINIJOB', 'MIDIJOB', 'FREELANCE', 'INTERNSHIP', 'APPRENTICESHIP');

-- CreateEnum
CREATE TYPE "SalaryPeriod" AS ENUM ('HOURLY', 'MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('ANNUAL', 'SICK', 'PARENTAL', 'UNPAID', 'SPECIAL', 'TRAINING');

-- CreateEnum
CREATE TYPE "LeaveRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TimeEntryStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('OPEN', 'PROCESSING', 'COMPLETED', 'LOCKED');

-- CreateEnum
CREATE TYPE "SocialSecurityType" AS ENUM ('HEALTH', 'PENSION', 'UNEMPLOYMENT', 'ACCIDENT', 'CARE');

-- CreateEnum
CREATE TYPE "SSRegistrationStatus" AS ENUM ('PENDING', 'SUBMITTED', 'CONFIRMED', 'REJECTED', 'TERMINATED');

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT,
    "employeeNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" "Gender",
    "nationality" TEXT,
    "street" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "countryCode" TEXT NOT NULL,
    "taxId" TEXT,
    "taxClass" TEXT,
    "churchTax" BOOLEAN NOT NULL DEFAULT false,
    "bankName" TEXT,
    "iban" TEXT,
    "bic" TEXT,
    "status" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "hireDate" TIMESTAMP(3) NOT NULL,
    "terminationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmploymentContract" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "contractType" "ContractType" NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "probationEnd" TIMESTAMP(3),
    "salaryAmount" DECIMAL(10,2) NOT NULL,
    "salaryCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "salaryPeriod" "SalaryPeriod" NOT NULL,
    "weeklyHours" DECIMAL(4,1) NOT NULL,
    "workingDays" TEXT[],
    "benefits" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmploymentContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveEntitlement" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "totalDays" DECIMAL(4,1) NOT NULL,
    "usedDays" DECIMAL(4,1) NOT NULL DEFAULT 0,
    "carriedOver" DECIMAL(4,1) NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveEntitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalDays" DECIMAL(4,1) NOT NULL,
    "reason" TEXT,
    "status" "LeaveRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeEntry" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "totalHours" DECIMAL(4,2) NOT NULL,
    "overtimeHours" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "projectCode" TEXT,
    "description" TEXT,
    "status" "TimeEntryStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollPeriod" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" "PayrollStatus" NOT NULL DEFAULT 'OPEN',
    "processedAt" TIMESTAMP(3),
    "processedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payslip" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "payrollPeriodId" TEXT NOT NULL,
    "grossSalary" DECIMAL(10,2) NOT NULL,
    "netSalary" DECIMAL(10,2) NOT NULL,
    "deductions" JSONB NOT NULL,
    "additions" JSONB,
    "paidAt" TIMESTAMP(3),
    "paymentRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payslip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialSecurityRegistration" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "type" "SocialSecurityType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "SSRegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialSecurityRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrAuditLog" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "employeeId" TEXT,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HrAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Employee_orgId_idx" ON "Employee"("orgId");

-- CreateIndex
CREATE INDEX "Employee_userId_idx" ON "Employee"("userId");

-- CreateIndex
CREATE INDEX "Employee_email_idx" ON "Employee"("email");

-- CreateIndex
CREATE INDEX "Employee_status_idx" ON "Employee"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_orgId_employeeNumber_key" ON "Employee"("orgId", "employeeNumber");

-- CreateIndex
CREATE INDEX "EmploymentContract_employeeId_idx" ON "EmploymentContract"("employeeId");

-- CreateIndex
CREATE INDEX "EmploymentContract_isActive_idx" ON "EmploymentContract"("isActive");

-- CreateIndex
CREATE INDEX "LeaveEntitlement_employeeId_idx" ON "LeaveEntitlement"("employeeId");

-- CreateIndex
CREATE INDEX "LeaveEntitlement_year_idx" ON "LeaveEntitlement"("year");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveEntitlement_employeeId_year_leaveType_key" ON "LeaveEntitlement"("employeeId", "year", "leaveType");

-- CreateIndex
CREATE INDEX "LeaveRequest_employeeId_idx" ON "LeaveRequest"("employeeId");

-- CreateIndex
CREATE INDEX "LeaveRequest_status_idx" ON "LeaveRequest"("status");

-- CreateIndex
CREATE INDEX "LeaveRequest_startDate_endDate_idx" ON "LeaveRequest"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "TimeEntry_employeeId_date_idx" ON "TimeEntry"("employeeId", "date");

-- CreateIndex
CREATE INDEX "TimeEntry_status_idx" ON "TimeEntry"("status");

-- CreateIndex
CREATE INDEX "PayrollPeriod_orgId_idx" ON "PayrollPeriod"("orgId");

-- CreateIndex
CREATE INDEX "PayrollPeriod_status_idx" ON "PayrollPeriod"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollPeriod_orgId_year_month_key" ON "PayrollPeriod"("orgId", "year", "month");

-- CreateIndex
CREATE INDEX "Payslip_employeeId_idx" ON "Payslip"("employeeId");

-- CreateIndex
CREATE INDEX "Payslip_payrollPeriodId_idx" ON "Payslip"("payrollPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "Payslip_employeeId_payrollPeriodId_key" ON "Payslip"("employeeId", "payrollPeriodId");

-- CreateIndex
CREATE INDEX "SocialSecurityRegistration_employeeId_idx" ON "SocialSecurityRegistration"("employeeId");

-- CreateIndex
CREATE INDEX "SocialSecurityRegistration_countryCode_idx" ON "SocialSecurityRegistration"("countryCode");

-- CreateIndex
CREATE INDEX "SocialSecurityRegistration_status_idx" ON "SocialSecurityRegistration"("status");

-- CreateIndex
CREATE INDEX "HrAuditLog_orgId_idx" ON "HrAuditLog"("orgId");

-- CreateIndex
CREATE INDEX "HrAuditLog_employeeId_idx" ON "HrAuditLog"("employeeId");

-- CreateIndex
CREATE INDEX "HrAuditLog_userId_idx" ON "HrAuditLog"("userId");

-- CreateIndex
CREATE INDEX "HrAuditLog_createdAt_idx" ON "HrAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "HrAuditLog_entityType_entityId_idx" ON "HrAuditLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentContract" ADD CONSTRAINT "EmploymentContract_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveEntitlement" ADD CONSTRAINT "LeaveEntitlement_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollPeriod" ADD CONSTRAINT "PayrollPeriod_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "PayrollPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialSecurityRegistration" ADD CONSTRAINT "SocialSecurityRegistration_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
