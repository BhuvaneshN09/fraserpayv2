"use client";

import { useActionState } from "react";
import { recordDepositAction, reverseDepositAction, studentTransferAction } from "@/app/cash-ledger-actions";

export function StudentTransferForm() {
  const [state, action, pending] = useActionState(studentTransferAction, null);

  return (
    <form className="deposit-form" action={action}>
      <label htmlFor="recipientEmail">Recipient PDSB email</label>
      <input id="recipientEmail" name="recipientEmail" type="email" placeholder="student@pdsb.net" pattern=".+@pdsb\\.net" required />
      <label htmlFor="transferAmount">Amount (CAD)</label>
      <input id="transferAmount" name="amount" type="text" inputMode="decimal" pattern="(?:0|[1-9][0-9]{0,9})(?:\\.[0-9]{1,2})?" placeholder="0.00" required />
      {state && <p className={`transfer-message ${state.type}`} role={state.type === "error" ? "alert" : "status"}>{state.message}</p>}
      <button className="transfer-submit" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send to student"}
        <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}

export function CashDepositForm({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState(recordDepositAction, null);

  return (
    <form className="deposit-form" action={action}>
      <input type="hidden" name="requestId" value={requestId} />
      <label htmlFor="studentEmail">Student PDSB email</label>
      <input id="studentEmail" name="studentEmail" type="email" placeholder="student@pdsb.net" required />
      <label htmlFor="eventName">Event</label>
      <input id="eventName" name="eventName" placeholder="Charity Week" maxLength={80} required />
      <label htmlFor="amount">Cash received (CAD)</label>
      <input id="amount" name="amount" type="text" inputMode="decimal" pattern="(?:0|[1-9][0-9]{0,9})(?:\.[0-9]{1,2})?" placeholder="0.00" required />
      {state && <p className={`transfer-message ${state.type}`} role={state.type === "error" ? "alert" : "status"}>{state.message}</p>}
      <button className="transfer-submit" type="submit" disabled={pending}>
        {pending ? "Recording…" : "Record deposit"}
        <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}

export function ReverseDepositForm({ depositId }: { depositId: string }) {
  const [state, action, pending] = useActionState(reverseDepositAction, null);

  return (
    <form className="reverse-form" action={action}>
      <input type="hidden" name="depositId" value={depositId} />
      <input aria-label="Reason for reversing this deposit" name="reason" placeholder="Reason for reversal" minLength={5} maxLength={240} required />
      <button type="submit" disabled={pending}>{pending ? "Reversing…" : "Reverse"}</button>
      {state && <span className={`transfer-message ${state.type}`} role={state.type === "error" ? "alert" : "status"}>{state.message}</span>}
    </form>
  );
}