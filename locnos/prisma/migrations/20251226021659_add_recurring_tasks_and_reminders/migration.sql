/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Equipment` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Equipment` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "RecurrenceType" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'MONTHLY_SAME_DAY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "PermissionAction" AS ENUM ('VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'EXPORT', 'MANAGE');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('AVAILABLE', 'RENTED', 'MAINTENANCE', 'LOST', 'RETIRED');

-- AlterEnum
ALTER TYPE "TransactionOrigin" ADD VALUE 'MAINTENANCE';

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_tenantId_fkey";

-- AlterTable
ALTER TABLE "Equipment" DROP COLUMN "imageUrl",
DROP COLUMN "status";

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentTaskId" TEXT,
ADD COLUMN     "recurrenceEndDate" TIMESTAMP(3),
ADD COLUMN     "recurrenceInterval" INTEGER DEFAULT 1,
ADD COLUMN     "recurrenceType" "RecurrenceType",
ADD COLUMN     "reminderDateTime" TIMESTAMP(3),
ADD COLUMN     "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reminderSent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "blockedAt" TIMESTAMP(3),
ADD COLUMN     "blockedReason" TEXT,
ADD COLUMN     "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "lastLoginIp" TEXT,
ADD COLUMN     "passwordResetExpires" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "roleId" TEXT,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "tenantId" SET NOT NULL;

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
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "serialNumber" TEXT,
    "status" "AssetStatus" NOT NULL DEFAULT 'AVAILABLE',
    "condition" TEXT,
    "notes" TEXT,
    "equipmentId" TEXT NOT NULL,
    "currentRentalItemId" TEXT,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryMovement_tenantId_equipmentId_idx" ON "InventoryMovement"("tenantId", "equipmentId");

-- CreateIndex
CREATE INDEX "Role_tenantId_idx" ON "Role"("tenantId");

-- CreateIndex
CREATE INDEX "Role_isActive_idx" ON "Role"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_tenantId_key" ON "Role"("name", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_name_key" ON "Resource"("name");

-- CreateIndex
CREATE INDEX "Resource_module_idx" ON "Resource"("module");

-- CreateIndex
CREATE INDEX "Permission_resourceId_idx" ON "Permission"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_resourceId_action_key" ON "Permission"("resourceId", "action");

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
CREATE INDEX "Asset_tenantId_status_idx" ON "Asset"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_code_tenantId_key" ON "Asset"("code", "tenantId");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "Task" ADD CONSTRAINT "Task_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
