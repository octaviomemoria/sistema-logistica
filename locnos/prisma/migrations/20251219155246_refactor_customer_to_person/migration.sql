/*
  Warnings:

  - You are about to drop the column `customerId` on the `Rental` table. All the data in the column will be lost.
  - The `Customer` table will be renamed to `Person`.
  - Added the required column `personId` to the `Rental` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Rename Customer table to Person (preserves all existing data)
ALTER TABLE "Customer" RENAME TO "Person";

-- Step 2: Rename the customerId column in Rental table to personId
ALTER TABLE "Rental" RENAME COLUMN "customerId" TO "personId";

-- Step 3: Rename the foreign key constraint
ALTER TABLE "Rental" RENAME CONSTRAINT "Rental_customerId_fkey" TO "Rental_personId_fkey";

-- Step 4: Create PersonType table
CREATE TABLE "PersonType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "system" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonType_pkey" PRIMARY KEY ("id")
);

-- Step 5: Create PersonPersonType junction table
CREATE TABLE "PersonPersonType" (
    "personId" TEXT NOT NULL,
    "personTypeId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonPersonType_pkey" PRIMARY KEY ("personId","personTypeId")
);

-- Step 6: Create indexes
CREATE UNIQUE INDEX "PersonType_name_key" ON "PersonType"("name");

-- Step 7: Add foreign keys for PersonPersonType
ALTER TABLE "PersonPersonType" ADD CONSTRAINT "PersonPersonType_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PersonPersonType" ADD CONSTRAINT "PersonPersonType_personTypeId_fkey" FOREIGN KEY ("personTypeId") REFERENCES "PersonType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 8: Insert default PersonTypes
INSERT INTO "PersonType" ("id", "name", "color", "system", "createdAt", "updatedAt") VALUES
  (gen_random_uuid()::text, 'Cliente', '#3B82F6', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Fornecedor', '#10B981', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Freteiro', '#F59E0B', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Funcionário', '#8B5CF6', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Parceiro', '#EC4899', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Locador', '#14B8A6', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Step 9: Assign 'Cliente' type to all existing persons
INSERT INTO "PersonPersonType" ("personId", "personTypeId", "assignedAt")
SELECT p.id, pt.id, CURRENT_TIMESTAMP
FROM "Person" p
CROSS JOIN "PersonType" pt
WHERE pt.name = 'Cliente';
