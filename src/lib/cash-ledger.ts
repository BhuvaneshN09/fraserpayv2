import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isValidSchoolEmail, normalizeSchoolEmail } from "@/lib/credentials";

export class CashLedgerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CashLedgerError";
  }
}

function parseAmount(value: string) {
  const normalized = value.trim();
  if (!/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(normalized)) {
    throw new CashLedgerError("Enter an amount from $0.01 to $9,999,999,999.99.");
  }
  const amount = new Prisma.Decimal(normalized);
  if (amount.lte(0)) throw new CashLedgerError("Enter an amount greater than zero.");
  return amount;
}

export function isOverAlertThreshold(amount: Prisma.Decimal | string) {
  return new Prisma.Decimal(amount).gt("50.00");
}

async function requireStaff(transaction: Prisma.TransactionClient, staffId: string) {
  const staff = await transaction.user.findUnique({
    where: { id: staffId },
    select: { role: true },
  });
  if (!staff || (staff.role !== "SAC_ADMIN" && staff.role !== "ADMIN")) {
    throw new CashLedgerError("You are not authorized to record cash deposits.");
  }
}

export async function recordCashDeposit(
  staffId: string,
  requestId: string,
  rawStudentEmail: string,
  rawEventName: string,
  rawAmount: string,
) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
    throw new CashLedgerError("Refresh the page and try again.");
  }
  const studentEmail = normalizeSchoolEmail(rawStudentEmail);
  if (!isValidSchoolEmail(studentEmail)) throw new CashLedgerError("Enter a valid @pdsb.net student email.");

  const eventName = rawEventName.trim();
  if (eventName.length < 2 || eventName.length > 80) {
    throw new CashLedgerError("Enter an event name between 2 and 80 characters.");
  }
  const amount = parseAmount(rawAmount);

  return prisma.$transaction(async (transaction) => {
    await requireStaff(transaction, staffId);
    const student = await transaction.user.findUnique({
      where: { email: studentEmail },
      select: { id: true, role: true },
    });
    if (!student || student.role !== "STUDENT") {
      throw new CashLedgerError("No student account was found for that school email.");
    }

    await transaction.user.update({
      where: { id: student.id },
      data: { balance: { increment: amount } },
    });
    return transaction.cashDeposit.create({
      data: { requestId, studentId: student.id, staffId, eventName, amount },
    });
  });
}

export async function reverseCashDeposit(staffId: string, depositId: string, rawReason: string) {
  const reason = rawReason.trim();
  if (reason.length < 5 || reason.length > 240) {
    throw new CashLedgerError("Enter a reversal reason between 5 and 240 characters.");
  }

  return prisma.$transaction(async (transaction) => {
    await requireStaff(transaction, staffId);
    const deposit = await transaction.cashDeposit.findUnique({
      where: { id: depositId },
      select: { id: true, studentId: true, amount: true },
    });
    if (!deposit) throw new CashLedgerError("That deposit could not be found.");

    const existingReversal = await transaction.cashDepositReversal.findUnique({
      where: { depositId },
      select: { id: true },
    });
    if (existingReversal) throw new CashLedgerError("That deposit has already been reversed.");

    const debit = await transaction.user.updateMany({
      where: { id: deposit.studentId, balance: { gte: deposit.amount } },
      data: { balance: { decrement: deposit.amount } },
    });
    if (debit.count !== 1) {
      throw new CashLedgerError("The balance is lower than this deposit; ask an administrator to reconcile it.");
    }

    return transaction.cashDepositReversal.create({
      data: { depositId, staffId, reason },
    });
  });
}

export async function sendStudentTransfer(
  senderId: string,
  rawRecipientEmail: string,
  rawAmount: string,
) {
  const recipientEmail = normalizeSchoolEmail(rawRecipientEmail);
  if (!isValidSchoolEmail(recipientEmail)) {
    throw new CashLedgerError("Enter a valid @pdsb.net recipient email.");
  }
  const amount = parseAmount(rawAmount);

  return prisma.$transaction(async (transaction) => {
    const sender = await transaction.user.findUnique({
      where: { id: senderId },
      select: { role: true },
    });
    if (!sender || sender.role !== "STUDENT") {
      throw new CashLedgerError("Only student accounts can send transfers.");
    }

    const recipient = await transaction.user.findUnique({
      where: { email: recipientEmail },
      select: { id: true, role: true },
    });
    if (!recipient || recipient.role !== "STUDENT") {
      throw new CashLedgerError("No student account was found for that school email.");
    }
    if (recipient.id === senderId) throw new CashLedgerError("You cannot send money to your own account.");

    const debit = await transaction.user.updateMany({
      where: { id: senderId, role: "STUDENT", balance: { gte: amount } },
      data: { balance: { decrement: amount } },
    });
    if (debit.count !== 1) throw new CashLedgerError("Your balance is too low for this transfer.");

    await transaction.user.update({
      where: { id: recipient.id },
      data: { balance: { increment: amount } },
    });

    return transaction.walletTransfer.create({
      data: { senderId, recipientId: recipient.id, amount },
    });
  });
}

export async function getStudentCashActivity(studentId: string) {
  return prisma.cashDeposit.findMany({
    where: { studentId },
    include: {
      student: { select: { name: true, email: true } },
      staff: { select: { name: true, email: true } },
      reversal: { select: { reason: true, createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}

export async function getRecentStaffDeposits() {
  return prisma.cashDeposit.findMany({
    include: {
      student: { select: { name: true, email: true } },
      staff: { select: { name: true, email: true } },
      reversal: { select: { reason: true, createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getRecentStudentTransfers(studentId: string) {
  return prisma.walletTransfer.findMany({
    where: { OR: [{ senderId: studentId }, { recipientId: studentId }] },
    include: {
      sender: { select: { name: true, email: true } },
      recipient: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}

export async function getMonitorData() {
  const threshold = new Prisma.Decimal("50.00");
  const [highBalanceStudents, recentDeposits, recentTransfers] = await prisma.$transaction([
    prisma.user.findMany({
      where: { role: "STUDENT", balance: { gt: threshold } },
      select: { id: true, name: true, email: true, balance: true },
      orderBy: [{ balance: "asc" }, { email: "asc" }],
      take: 100,
    }),
    prisma.cashDeposit.findMany({
      include: {
        student: { select: { name: true, email: true } },
        staff: { select: { name: true, email: true } },
        reversal: { select: { reason: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.walletTransfer.findMany({
      include: {
        sender: { select: { name: true, email: true } },
        recipient: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return { highBalanceStudents, recentDeposits, recentTransfers };
}