CREATE TABLE "WalletTransfer" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransfer_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WalletTransfer_amount_positive" CHECK ("amount" > 0),
    CONSTRAINT "WalletTransfer_distinct_users" CHECK ("senderId" <> "recipientId"),
    CONSTRAINT "WalletTransfer_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WalletTransfer_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "WalletTransfer_senderId_createdAt_idx" ON "WalletTransfer"("senderId", "createdAt");
CREATE INDEX "WalletTransfer_recipientId_createdAt_idx" ON "WalletTransfer"("recipientId", "createdAt");