-- CreateEnum
CREATE TYPE "BackupJobType" AS ENUM ('EXPORT', 'IMPORT', 'VALIDATE', 'RESET');

-- CreateEnum
CREATE TYPE "BackupJobStatus" AS ENUM ('PENDING', 'RUNNING', 'DONE', 'FAILED');

-- CreateEnum
CREATE TYPE "BackupFormat" AS ENUM ('XLSX', 'CSV_ZIP');

-- CreateTable
CREATE TABLE "BackupJob" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "type" "BackupJobType" NOT NULL,
    "format" "BackupFormat",
    "status" "BackupJobStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "options" JSONB,
    "fileName" TEXT,
    "filePath" TEXT,
    "fileSize" INTEGER,
    "report" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BackupJob_tenantId_createdAt_idx" ON "BackupJob"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "BackupJob_tenantId_status_idx" ON "BackupJob"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "BackupJob" ADD CONSTRAINT "BackupJob_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupJob" ADD CONSTRAINT "BackupJob_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
