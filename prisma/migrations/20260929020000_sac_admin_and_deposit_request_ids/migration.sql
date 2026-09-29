DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM pg_enum e
		JOIN pg_type t ON t.oid = e.enumtypid
		WHERE t.typname = 'UserRole' AND e.enumlabel = 'STAFF'
	) AND NOT EXISTS (
		SELECT 1 FROM pg_enum e
		JOIN pg_type t ON t.oid = e.enumtypid
		WHERE t.typname = 'UserRole' AND e.enumlabel = 'SAC_ADMIN'
	) THEN
		ALTER TYPE "UserRole" RENAME VALUE 'STAFF' TO 'SAC_ADMIN';
	END IF;
END $$;

ALTER TABLE "CashDeposit" ADD COLUMN IF NOT EXISTS "requestId" TEXT;
UPDATE "CashDeposit" SET "requestId" = gen_random_uuid()::TEXT WHERE "requestId" IS NULL;
ALTER TABLE "CashDeposit" ALTER COLUMN "requestId" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "CashDeposit_requestId_key" ON "CashDeposit"("requestId");