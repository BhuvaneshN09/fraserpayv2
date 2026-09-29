"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  CashLedgerError,
  recordCashDeposit,
  reverseCashDeposit,
  sendStudentTransfer,
} from "@/lib/cash-ledger";

export type CashLedgerActionState = { type: "error" | "success"; message: string } | null;

export async function recordDepositAction(
  _previousState: CashLedgerActionState,
  formData: FormData,
): Promise<CashLedgerActionState> {
  const session = await auth();
  if (!session?.user?.id) return { type: "error", message: "Sign in again to continue." };

  const studentEmail = formData.get("studentEmail");
  const requestId = formData.get("requestId");
  const eventName = formData.get("eventName");
  const amount = formData.get("amount");
  if (
    typeof studentEmail !== "string" || typeof requestId !== "string" ||
    typeof eventName !== "string" || typeof amount !== "string"
  ) {
    return { type: "error", message: "Complete all deposit fields." };
  }

  try {
    await recordCashDeposit(session.user.id, requestId, studentEmail, eventName, amount);
    revalidatePath("/");
    return { type: "success", message: "Cash deposit recorded." };
  } catch (error) {
    if (error instanceof CashLedgerError) return { type: "error", message: error.message };
    console.error("Cash deposit failed.", { errorType: error instanceof Error ? error.name : "UnknownError" });
    return { type: "error", message: "The deposit could not be recorded. No balance change was made." };
  }
}

export async function reverseDepositAction(
  _previousState: CashLedgerActionState,
  formData: FormData,
): Promise<CashLedgerActionState> {
  const session = await auth();
  if (!session?.user?.id) return { type: "error", message: "Sign in again to continue." };

  const depositId = formData.get("depositId");
  const reason = formData.get("reason");
  if (typeof depositId !== "string" || typeof reason !== "string") {
    return { type: "error", message: "Complete the reversal reason." };
  }

  try {
    await reverseCashDeposit(session.user.id, depositId, reason);
    revalidatePath("/");
    return { type: "success", message: "Deposit reversed." };
  } catch (error) {
    if (error instanceof CashLedgerError) return { type: "error", message: error.message };
    console.error("Cash deposit reversal failed.", { errorType: error instanceof Error ? error.name : "UnknownError" });
    return { type: "error", message: "The reversal could not be recorded. No balance change was made." };
  }
}

export async function studentTransferAction(
  _previousState: CashLedgerActionState,
  formData: FormData,
): Promise<CashLedgerActionState> {
  const session = await auth();
  if (!session?.user?.id) return { type: "error", message: "Sign in again to continue." };

  const recipientEmail = formData.get("recipientEmail");
  const amount = formData.get("amount");
  if (typeof recipientEmail !== "string" || typeof amount !== "string") {
    return { type: "error", message: "Enter a recipient email and amount." };
  }

  try {
    await sendStudentTransfer(session.user.id, recipientEmail, amount);
    revalidatePath("/");
    revalidatePath("/admin/monitor");
    return { type: "success", message: "Transfer sent." };
  } catch (error) {
    if (error instanceof CashLedgerError) return { type: "error", message: error.message };
    console.error("Student transfer failed.", { errorType: error instanceof Error ? error.name : "UnknownError" });
    return { type: "error", message: "The transfer could not be completed. No balance change was made." };
  }
}