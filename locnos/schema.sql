-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('AVAILABLE', 'RENTED', 'MAINTENANCE', 'LOST', 'RETIRED');

-- CreateEnum
CREATE TYPE "RecurrenceType" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'MONTHLY_SAME_DAY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MaintenanceExecutor" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "MaintenanceApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('OPEN', 'WAITING_PARTS', 'WAITING_SERVICE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "PermissionAction" AS ENUM ('VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'EXPORT', 'MANAGE');

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
CREATE TYPE "TransactionOrigin" AS ENUM ('MANUAL', 'RENTAL', 'IMPORT_OFX', 'INTEGRATION_API', 'MAINTENANCE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "blockedAt" TIMESTAMP(3),
    "blockedReason" TEXT,
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "roleId" TEXT,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "system" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT,

    CONSTRAINT "PersonType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PF',
    "name" TEXT NOT NULL,
    "tradeName" TEXT,
    "document" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "documents" TEXT[],
    "references" JSONB,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonPersonType" (
    "personId" TEXT NOT NULL,
    "personTypeId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonPersonType_pkey" PRIMARY KEY ("personId","personTypeId")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subCategory" TEXT,
    "brand" TEXT,
    "description" TEXT,
    "purchasePrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "salePrice" DOUBLE PRECISION,
    "replacementValue" DOUBLE PRECISION DEFAULT 0,
    "suggestedDeposit" DOUBLE PRECISION,
    "tenantId" TEXT,
    "totalQty" INTEGER NOT NULL DEFAULT 1,
    "rentedQty" INTEGER NOT NULL DEFAULT 0,
    "rentalPeriods" JSONB,
    "specifications" JSONB,
    "externalLinks" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "equipmentId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "rentalId" TEXT,
    "maintenanceId" TEXT,
    "userId" TEXT,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

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
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceType" "RecurrenceType",
    "recurrenceInterval" INTEGER DEFAULT 1,
    "recurrenceEndDate" TIMESTAMP(3),
    "parentTaskId" TEXT,
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
    "reminderDateTime" TIMESTAMP(3),
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
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
CREATE TABLE "ContractTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Maintenance" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CORRECTIVE',
    "description" TEXT,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "executorType" "MaintenanceExecutor" NOT NULL DEFAULT 'INTERNAL',
    "providerId" TEXT,
    "approvalStatus" "MaintenanceApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'OPEN',
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "action" "PermissionAction" NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("userId","permissionId")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "success" BOOLEAN NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "reason" TEXT,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
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

    CONSTRAINT "FinancialMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankStatementItem" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "TransactionType" NOT NULL,
    "matched" BOOLEAN NOT NULL DEFAULT false,
    "matchedMovementId" TEXT,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankStatementItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rental" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "deliveryAddress" JSONB,
    "returnAddress" JSONB,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "rentalStartDate" TIMESTAMP(3) NOT NULL,
    "rentalEndDate" TIMESTAMP(3) NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "deposit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentMethod" TEXT,
    "deliveryDriverId" TEXT,
    "deliveryScheduledDate" TIMESTAMP(3),
    "deliveryCompletedDate" TIMESTAMP(3),
    "returnDriverId" TEXT,
    "returnScheduledDate" TIMESTAMP(3),
    "returnCompletedDate" TIMESTAMP(3),
    "notes" TEXT,
    "contractPdf" TEXT,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rental_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "serialNumber" TEXT,
    "qrCode" TEXT,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,
    "tenantId" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "warrantyExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalItem" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RentalItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalOccurrence" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "photos" TEXT[],

    CONSTRAINT "RentalOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "driverId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "totalDistance" DOUBLE PRECISION,
    "estimatedDuration" INTEGER,
    "actualDuration" INTEGER,
    "notes" TEXT,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteStop" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "address" JSONB NOT NULL,
    "estimatedArrival" TIMESTAMP(3),
    "actualArrival" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,

    CONSTRAINT "RouteStop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PersonType_name_tenantId_key" ON "PersonType"("name", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Person_document_tenantId_key" ON "Person"("document", "tenantId");

-- CreateIndex
CREATE INDEX "Person_tenantId_idx" ON "Person"("tenantId");

-- CreateIndex
CREATE INDEX "Equipment_tenantId_idx" ON "Equipment"("tenantId");

-- CreateIndex
CREATE INDEX "InventoryMovement_tenantId_equipmentId_idx" ON "InventoryMovement"("tenantId", "equipmentId");

-- CreateIndex
CREATE INDEX "Task_tenantId_idx" ON "Task"("tenantId");

-- CreateIndex
CREATE INDEX "Task_tenantId_status_idx" ON "Task"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ContractTemplate_tenantId_idx" ON "ContractTemplate"("tenantId");

-- CreateIndex
CREATE INDEX "Maintenance_tenantId_idx" ON "Maintenance"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_tenantId_key" ON "Role"("name", "tenantId");

-- CreateIndex
CREATE INDEX "Role_tenantId_idx" ON "Role"("tenantId");

-- CreateIndex
CREATE INDEX "Role_isActive_idx" ON "Role"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_name_key" ON "Resource"("name");

-- CreateIndex
CREATE INDEX "Resource_module_idx" ON "Resource"("module");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_resourceId_action_key" ON "Permission"("resourceId", "action");

-- CreateIndex
CREATE INDEX "Permission_resourceId_idx" ON "Permission"("resourceId");

-- CreateIndex
CREATE INDEX "RolePermission_roleId_idx" ON "RolePermission"("roleId");

-- CreateIndex
CREATE INDEX "UserPermission_userId_idx" ON "UserPermission"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_token_key" ON "UserSession"("token");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");

-- CreateIndex
CREATE INDEX "UserSession_token_idx" ON "UserSession"("token");

-- CreateIndex
CREATE INDEX "LoginAttempt_email_createdAt_idx" ON "LoginAttempt"("email", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_userId_idx" ON "LoginAttempt"("userId");

-- CreateIndex
CREATE INDEX "LoginAttempt_tenantId_idx" ON "LoginAttempt"("tenantId");

-- CreateIndex
CREATE INDEX "LoginAttempt_createdAt_idx" ON "LoginAttempt"("createdAt");

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
CREATE UNIQUE INDEX "Asset_qrCode_key" ON "Asset"("qrCode");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonType" ADD CONSTRAINT "PersonType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonPersonType" ADD CONSTRAINT "PersonPersonType_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonPersonType" ADD CONSTRAINT "PersonPersonType_personTypeId_fkey" FOREIGN KEY ("personTypeId") REFERENCES "PersonType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES "Maintenance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subtask" ADD CONSTRAINT "Subtask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subtask" ADD CONSTRAINT "Subtask_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractTemplate" ADD CONSTRAINT "ContractTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginAttempt" ADD CONSTRAINT "LoginAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginAttempt" ADD CONSTRAINT "LoginAttempt_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_deliveryDriverId_fkey" FOREIGN KEY ("deliveryDriverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_returnDriverId_fkey" FOREIGN KEY ("returnDriverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalItem" ADD CONSTRAINT "RentalItem_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalItem" ADD CONSTRAINT "RentalItem_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalOccurrence" ADD CONSTRAINT "RentalOccurrence_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteStop" ADD CONSTRAINT "RouteStop_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteStop" ADD CONSTRAINT "RouteStop_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
