/*
  Warnings:

  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'FINANCIAL', 'AUDIT', 'OPERATOR');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "DreCategory" AS ENUM ('GROSS_REVENUE', 'TAXES', 'SERVICE_COST', 'GOODS_COST', 'MAINTENANCE_COST', 'ADMINISTRATIVE_EXPENSE', 'COMMERCIAL_EXPENSE', 'FINANCIAL_EXPENSE', 'PERSONNEL_EXPENSE', 'LOGISTICS_EXPENSE', 'PROFIT_DISTRIBUTION', 'INVESTMENT', 'LOAN_AMORTIZATION', 'ASSET_DEPRECIATION', 'OTHER');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "TitleStatus" AS ENUM ('OPEN', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransactionOrigin" AS ENUM ('MANUAL', 'RENTAL', 'IMPORT_OFX', 'INTEGRATION_API');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tenantId" TEXT,
DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'OPERATOR';

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "dueDate" TIMESTAMP(3),
    "responsibleId" TEXT,
    "createdById" TEXT,
    "tenantId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subtask" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "tenantId" TEXT,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subtask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" JSONB,
    "userId" TEXT,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChartOfAccount" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "nature" TEXT,
    "dreCategory" "DreCategory",
    "parentId" TEXT,
    "systemDefault" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChartOfAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bankName" TEXT,
    "bankCode" TEXT,
    "agency" TEXT,
    "accountNumber" TEXT,
    "type" TEXT NOT NULL DEFAULT 'CHECKING',
    "initialBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostCenter" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationConfig" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "apiSecret" TEXT,
    "environment" TEXT NOT NULL DEFAULT 'SANDBOX',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationLog" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "payload" JSONB,
    "response" JSONB,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialTitle" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "originalValue" DOUBLE PRECISION NOT NULL,
    "valueWithInterest" DOUBLE PRECISION,
    "balance" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "competenceDate" TIMESTAMP(3) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TitleStatus" NOT NULL,
    "origin" "TransactionOrigin" NOT NULL DEFAULT 'MANUAL',
    "accountId" TEXT NOT NULL,
    "costCenterId" TEXT,
    "rentalId" TEXT,
    "maintenanceId" TEXT,
    "billingId" TEXT,
    "billingUrl" TEXT,
    "billingStatus" TEXT,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialTitle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialMovement" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "TransactionType" NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "titleId" TEXT,
    "categoryId" TEXT,
    "conciliated" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankStatementItem" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "fitId" TEXT NOT NULL,
    "matchedMovementId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankStatementItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Task_tenantId_idx" ON "Task"("tenantId");

-- CreateIndex
CREATE INDEX "Task_tenantId_status_idx" ON "Task"("tenantId", "status");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_entityId_idx" ON "AuditLog"("tenantId", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "ChartOfAccount_code_tenantId_key" ON "ChartOfAccount"("code", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "CostCenter_code_tenantId_key" ON "CostCenter"("code", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConfig_provider_tenantId_key" ON "IntegrationConfig"("provider", "tenantId");

-- CreateIndex
CREATE INDEX "IntegrationLog_createdAt_idx" ON "IntegrationLog"("createdAt");

-- CreateIndex
CREATE INDEX "FinancialTitle_tenantId_status_idx" ON "FinancialTitle"("tenantId", "status");

-- CreateIndex
CREATE INDEX "FinancialTitle_tenantId_dueDate_idx" ON "FinancialTitle"("tenantId", "dueDate");

-- CreateIndex
CREATE INDEX "FinancialTitle_tenantId_competenceDate_idx" ON "FinancialTitle"("tenantId", "competenceDate");

-- CreateIndex
CREATE INDEX "FinancialMovement_tenantId_date_idx" ON "FinancialMovement"("tenantId", "date");

-- CreateIndex
CREATE INDEX "FinancialMovement_tenantId_bankAccountId_idx" ON "FinancialMovement"("tenantId", "bankAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "BankStatementItem_fitId_key" ON "BankStatementItem"("fitId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subtask" ADD CONSTRAINT "Subtask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subtask" ADD CONSTRAINT "Subtask_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChartOfAccount" ADD CONSTRAINT "ChartOfAccount_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ChartOfAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChartOfAccount" ADD CONSTRAINT "ChartOfAccount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostCenter" ADD CONSTRAINT "CostCenter_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationConfig" ADD CONSTRAINT "IntegrationConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationLog" ADD CONSTRAINT "IntegrationLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTitle" ADD CONSTRAINT "FinancialTitle_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ChartOfAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTitle" ADD CONSTRAINT "FinancialTitle_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "CostCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTitle" ADD CONSTRAINT "FinancialTitle_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTitle" ADD CONSTRAINT "FinancialTitle_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES "Maintenance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTitle" ADD CONSTRAINT "FinancialTitle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialMovement" ADD CONSTRAINT "FinancialMovement_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialMovement" ADD CONSTRAINT "FinancialMovement_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "FinancialTitle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialMovement" ADD CONSTRAINT "FinancialMovement_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ChartOfAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialMovement" ADD CONSTRAINT "FinancialMovement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankStatementItem" ADD CONSTRAINT "BankStatementItem_matchedMovementId_fkey" FOREIGN KEY ("matchedMovementId") REFERENCES "FinancialMovement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
