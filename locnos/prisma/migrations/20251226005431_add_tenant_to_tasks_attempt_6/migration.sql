/*
  Warnings:

  - A unique constraint covering the columns `[name,tenantId]` on the table `PersonType` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "PersonPersonType" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "PersonType" ADD COLUMN     "tenantId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PersonType_name_tenantId_key" ON "PersonType"("name", "tenantId");

-- AddForeignKey
ALTER TABLE "PersonType" ADD CONSTRAINT "PersonType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonPersonType" ADD CONSTRAINT "PersonPersonType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
