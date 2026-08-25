-- CreateEnum
CREATE TYPE "Department" AS ENUM ('SPIELWAREN', 'SCHREIBWAREN', 'HAUSHALT', 'SCHULRANZEN', 'SCHULBUECHER');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "department" "Department";

-- CreateIndex
CREATE INDEX "Order_department_idx" ON "Order"("department");
