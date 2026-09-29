import { beforeEach, describe, expect, it, vi } from "vitest";

const { transaction, findUser, debitUser, creditUser, createTransfer } = vi.hoisted(() => ({
  transaction: vi.fn(),
  findUser: vi.fn(),
  debitUser: vi.fn(),
  creditUser: vi.fn(),
  createTransfer: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { $transaction: transaction },
}));

import { CashLedgerError, sendStudentTransfer } from "@/lib/cash-ledger";

describe("student transfers", () => {
  beforeEach(() => {
    for (const mock of [findUser, debitUser, creditUser, createTransfer]) mock.mockReset();
    transaction.mockReset().mockImplementation((callback) => callback({
      user: { findUnique: findUser, updateMany: debitUser, update: creditUser },
      walletTransfer: { create: createTransfer },
    }));
  });

  it("debits, credits, and records a PDSB student transfer atomically", async () => {
    findUser.mockResolvedValueOnce({ role: "STUDENT" }).mockResolvedValueOnce({ id: "recipient-id", role: "STUDENT" });
    debitUser.mockResolvedValue({ count: 1 });
    createTransfer.mockResolvedValue({ id: "transfer-id" });

    await expect(sendStudentTransfer("sender-id", " Recipient@PDSB.NET ", "12.50"))
      .resolves.toEqual({ id: "transfer-id" });

    expect(transaction).toHaveBeenCalledOnce();
    expect(findUser).toHaveBeenNthCalledWith(2, {
      where: { email: "recipient@pdsb.net" },
      select: { id: true, role: true },
    });
    expect(debitUser.mock.calls[0][0].where.balance.gte.toString()).toBe("12.5");
    expect(creditUser.mock.calls[0][0].data.balance.increment.toString()).toBe("12.5");
    expect(createTransfer).toHaveBeenCalledWith({
      data: { senderId: "sender-id", recipientId: "recipient-id", amount: expect.anything() },
    });
  });

  it("rejects non-PDSB recipient emails before accessing the database", async () => {
    await expect(sendStudentTransfer("sender-id", "student@gmail.com", "10.00"))
      .rejects.toThrow("@pdsb.net");
    expect(transaction).not.toHaveBeenCalled();
  });

  it("rejects a sender who is not a student", async () => {
    findUser.mockResolvedValue({ role: "SAC_ADMIN" });

    await expect(sendStudentTransfer("staff-id", "student@pdsb.net", "10.00"))
      .rejects.toThrow("Only student accounts");
    expect(debitUser).not.toHaveBeenCalled();
    expect(createTransfer).not.toHaveBeenCalled();
  });

  it("rejects sending to the same account", async () => {
    findUser.mockResolvedValueOnce({ role: "STUDENT" }).mockResolvedValueOnce({ id: "sender-id", role: "STUDENT" });

    await expect(sendStudentTransfer("sender-id", "sender@pdsb.net", "10.00"))
      .rejects.toThrow("own account");
    expect(debitUser).not.toHaveBeenCalled();
  });

  it("prevents overdrafts and skips recipient credit and ledger entry", async () => {
    findUser.mockResolvedValueOnce({ role: "STUDENT" }).mockResolvedValueOnce({ id: "recipient-id", role: "STUDENT" });
    debitUser.mockResolvedValue({ count: 0 });

    await expect(sendStudentTransfer("sender-id", "recipient@pdsb.net", "55.00"))
      .rejects.toBeInstanceOf(CashLedgerError);
    expect(creditUser).not.toHaveBeenCalled();
    expect(createTransfer).not.toHaveBeenCalled();
  });
});