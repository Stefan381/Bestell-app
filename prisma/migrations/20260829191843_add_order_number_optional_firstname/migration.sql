-- Vorname is no longer required
ALTER TABLE "Customer" ALTER COLUMN "firstName" DROP NOT NULL;

-- Vorgangsnummer: add nullable, backfill existing rows with a random
-- 6-digit number, then enforce NOT NULL + UNIQUE. Collisions among the
-- small number of pre-existing rows are practically impossible (900,000
-- possible values), so a single backfill pass is sufficient here.
ALTER TABLE "Order" ADD COLUMN "orderNumber" TEXT;

UPDATE "Order"
SET "orderNumber" = lpad(floor(random() * 900000 + 100000)::text, 6, '0')
WHERE "orderNumber" IS NULL;

ALTER TABLE "Order" ALTER COLUMN "orderNumber" SET NOT NULL;

CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
