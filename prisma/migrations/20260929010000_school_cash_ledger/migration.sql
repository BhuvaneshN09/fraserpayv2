CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'SAC_ADMIN', 'ADMIN');

ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'STUDENT';

CREATE TABLE "CashDeposit" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "eventName" VARCHAR(80) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashDeposit_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CashDeposit_amount_positive" CHECK ("amount" > 0),
    CONSTRAINT "CashDeposit_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CashDeposit_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "CashDepositReversal" (
    "id" TEXT NOT NULL,
    "depositId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "reason" VARCHAR(240) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashDepositReversal_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CashDepositReversal_depositId_fkey" FOREIGN KEY ("depositId") REFERENCES "CashDeposit"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CashDepositReversal_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "CashDepositReversal_depositId_key" ON "CashDepositReversal"("depositId");
CREATE UNIQUE INDEX "CashDeposit_requestId_key" ON "CashDeposit"("requestId");
CREATE INDEX "CashDeposit_studentId_createdAt_idx" ON "CashDeposit"("studentId", "createdAt");
CREATE INDEX "CashDeposit_staffId_createdAt_idx" ON "CashDeposit"("staffId", "createdAt");
CREATE INDEX "CashDeposit_eventName_createdAt_idx" ON "CashDeposit"("eventName", "createdAt");
CREATE INDEX "CashDepositReversal_staffId_createdAt_idx" ON "CashDepositReversal"("staffId", "createdAt");