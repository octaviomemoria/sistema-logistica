/*
  Warnings:

  - The `status` column on the `Maintenance` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `tenantId` on the `PersonPersonType` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[document,tenantId]` on the table `Person` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('AVAILABLE', 'RENTED', 'MAINTENANCE', 'LOST', 'RETIRED');

-- CreateEnum
CREATE TYPE "MaintenanceExecutor" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "MaintenanceApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('OPEN', 'WAITING_PARTS', 'WAITING_SERVICE', 'COMPLETED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "PersonPersonType" DROP CONSTRAINT "PersonPersonType_tenantId_fkey";

-- DropIndex
DROP INDEX "Person_document_key";

-- DropIndex
DROP INDEX "PersonType_name_key";

-- AlterTable
ALTER TABLE "ContractTemplate" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "status" "EquipmentStatus" NOT NULL DEFAULT 'AVAILABLE';

-- AlterTable
ALTER TABLE "Maintenance" ADD COLUMN     "approvalStatus" "MaintenanceApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "executorType" "MaintenanceExecutor" NOT NULL DEFAULT 'INTERNAL',
ADD COLUMN     "providerId" TEXT,
ADD COLUMN     "tenantId" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "MaintenanceStatus" NOT NULL DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "PersonPersonType" DROP COLUMN "tenantId";

-- AlterTable
ALTER TABLE "Rental" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "Route" ADD COLUMN     "tenantId" TEXT;

-- CreateIndex
CREATE INDEX "ContractTemplate_tenantId_idx" ON "ContractTemplate"("tenantId");

-- CreateIndex
CREATE INDEX "Equipment_tenantId_idx" ON "Equipment"("tenantId");

-- CreateIndex
CREATE INDEX "Maintenance_tenantId_idx" ON "Maintenance"("tenantId");

-- CreateIndex
CREATE INDEX "Payment_tenantId_idx" ON "Payment"("tenantId");

-- CreateIndex
CREATE INDEX "Person_tenantId_idx" ON "Person"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Person_document_tenantId_key" ON "Person"("document", "tenantId");

-- CreateIndex
CREATE INDEX "Rental_tenantId_idx" ON "Rental"("tenantId");

-- CreateIndex
CREATE INDEX "Route_tenantId_idx" ON "Route"("tenantId");

-- AddForeignKey
ALTER TABLE "ContractTemplate" ADD CONSTRAINT "ContractTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
