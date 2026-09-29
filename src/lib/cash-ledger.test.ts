import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  transaction,
  findUser,
  updateUser,
  updateUsers,
  createDeposit,
  findDeposit,
  findReversal,
  createReversal,
} = vi.hoisted(() => ({
  transaction: vi.fn(),
  findUser: vi.fn(),
  updateUser: vi.fn(),
  updateUsers: vi.fn(),
  createDeposit: vi.fn(),
  findDeposit: vi.fn(),
  findReversal: vi.fn(),
  createReversal: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { $transaction: transaction },
}));

import {
  CashLedgerError,
  isOverAlertThreshold,
  recordCashDeposit,
  reverseCashDeposit,
} from "@/lib/cash-ledger";

describe("school cash ledger", () => {
  beforeEach(() => {
    for (const mock of [findUser, updateUser, updateUsers, createDeposit, findDeposit, findReversal, createReversal]) {
      mock.mockReset();
    }
    transaction.mockReset().mockImplementation((callback) => callback({
      user: { findUnique: findUser, update: updateUser, updateMany: updateUsers },
      cashDeposit: { create: createDeposit, findUnique: findDeposit },
      cashDepositReversal: { create: createReversal, findUnique: findReversal },
    }));
  });

  it("flags amounts strictly above $50 and not $50 itself", () => {
    expect(isOverAlertThreshold("0.01")).toBe(false);
    expect(isOverAlertThreshold("49.99")).toBe(false);
    expect(isOverAlertThreshold("50.00")).toBe(false);
    expect(isOverAlertThreshold("50.01")).toBe(true);
  });

  it("records a deposit only after checking staff role and student identity", async () => {
    findUser.mockResolvedValueOnce({ role: "SAC_ADMIN" }).mockResolvedValueOnce({ id: "student-id", role: "STUDENT" });
    createDeposit.mockResolvedValue({ id: "deposit-id" });

    await expect(recordCashDeposit("staff-id", "00000000-0000-4000-8000-000000000001", " Student@PDSB.NET ", "Charity Week", "10.00"))
      .resolves.toEqual({ id: "deposit-id" });

    expect(updateUser.mock.calls[0][0].data.balance.increment.toString()).toBe("10");
    expect(createDeposit).toHaveBeenCalledWith({
      data: {
        requestId: "00000000-0000-4000-8000-000000000001",
        studentId: "student-id",
        staffId: "staff-id",
        eventName: "Charity Week",
        amount: expect.anything(),
      },
    });
    expect(transaction).toHaveBeenCalledOnce();
  });

  it("rejects students attempting to record a deposit", async () => {
    findUser.mockResolvedValue({ role: "STUDENT" });

    await expect(recordCashDeposit("student-id", "00000000-0000-4000-8000-000000000001", "other@pdsb.net", "Charity Week", "10.00"))
      .rejects.toBeInstanceOf(CashLedgerError);
    expect(updateUser).not.toHaveBeenCalled();
    expect(createDeposit).not.toHaveBeenCalled();
  });

  it("rejects non-school email domains before database access", async () => {
    await expect(recordCashDeposit("staff-id", "00000000-0000-4000-8000-000000000001", "student@gmail.com", "Charity Week", "10.00"))
      .rejects.toThrow("@pdsb.net");
    expect(transaction).not.toHaveBeenCalled();
  });

  it("rejects invalid amounts before database access", async () => {
    await expect(recordCashDeposit("staff-id", "00000000-0000-4000-8000-000000000001", "student@pdsb.net", "Charity Week", "1; DROP TABLE User"))
      .rejects.toBeInstanceOf(CashLedgerError);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("records reversals with a reason and debits the student's balance", async () => {
    findUser.mockResolvedValue({ role: "ADMIN" });
    findDeposit.mockResolvedValue({ id: "deposit-id", studentId: "student-id", amount: { toString: () => "10" } });
    findReversal.mockResolvedValue(null);
    updateUsers.mockResolvedValue({ count: 1 });
    createReversal.mockResolvedValue({ id: "reversal-id" });

    await expect(reverseCashDeposit("admin-id", "deposit-id", "Entered twice"))
      .resolves.toEqual({ id: "reversal-id" });
    expect(updateUsers).toHaveBeenCalledOnce();
    expect(createReversal).toHaveBeenCalledWith({
      data: { depositId: "deposit-id", staffId: "admin-id", reason: "Entered twice" },
    });
  });

  it("rejects a second reversal and never changes the balance twice", async () => {
    findUser.mockResolvedValue({ role: "SAC_ADMIN" });
    findDeposit.mockResolvedValue({ id: "deposit-id", studentId: "student-id", amount: { toString: () => "10" } });
    findReversal.mockResolvedValue({ id: "existing-reversal" });

    await expect(reverseCashDeposit("staff-id", "deposit-id", "Duplicate entry"))
      .rejects.toThrow("already been reversed");
    expect(updateUsers).not.toHaveBeenCalled();
    expect(createReversal).not.toHaveBeenCalled();
  });
});