import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDashboardUser } from "@/lib/dashboard-user";
import { getMonitorData, isOverAlertThreshold } from "@/lib/cash-ledger";
import { ReverseDepositForm } from "@/app/cash-ledger-forms";
import { AdminNav } from "@/app/admin/admin-nav";

function formatBalance(balance: string) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(Number(balance));
}

export default async function AdminMonitorPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await getDashboardUser(session.user.id);
  if (!user) redirect("/login");
  if (user.role !== "SAC_ADMIN" && user.role !== "ADMIN") redirect("/");

  const { highBalanceStudents, recentDeposits, recentTransfers } = await getMonitorData();
  const transactionCount = recentDeposits.length + recentTransfers.length;
  const largeTransactionCount = [...recentDeposits, ...recentTransfers]
    .filter((transaction) => isOverAlertThreshold(transaction.amount)).length;

  return (
    <div className="dashboard-shell">
      <AdminNav email={user.email} active="monitor" />
      <main className="dashboard-content admin-content" aria-labelledby="monitor-heading">
        <p className="eyebrow">STUDENT ACTIVITIES COUNCIL <span>·</span> ACCOUNT MONITOR</p>
        <h1 id="monitor-heading">Monitor</h1>
        <p className="account-email">Alerts show balances and transactions over $50.</p>

        <section className="monitor-section" aria-labelledby="high-balance-heading">
          <div className="activity-heading">
            <h2 id="high-balance-heading">Accounts over $50</h2>
            <span>{highBalanceStudents.length} accounts over $50</span>
          </div>
          {highBalanceStudents.length ? (
            <ul className="activity-list">
              {highBalanceStudents.map((student) => (
                <li className="activity-row" key={student.id}>
                  <div className="activity-description">
                    <span className="alert-icon" aria-hidden="true">!</span>
                    <span>
                      <strong>{student.name || student.email}</strong>
                      <time>{student.email}</time>
                    </span>
                  </div>
                  <strong className="activity-amount alert-amount">{formatBalance(student.balance.toString())}</strong>
                </li>
              ))}
            </ul>
          ) : <p className="activity-empty">No student accounts are over $50.</p>}
        </section>

        <section className="monitor-section" aria-labelledby="small-transaction-heading">
          <div className="activity-heading">
            <h2 id="small-transaction-heading">Recent transactions</h2>
            <span>{largeTransactionCount} over-$50 alerts · {transactionCount} entries</span>
          </div>
          {[...recentDeposits.map((deposit) => ({
            id: `deposit-${deposit.id}`,
            createdAt: deposit.createdAt,
            amount: deposit.amount,
            alert: isOverAlertThreshold(deposit.amount),
            title: `${deposit.student.name || deposit.student.email} · ${deposit.eventName}`,
            detail: `Cash added by ${deposit.staff.name || deposit.staff.email}${deposit.reversal ? ` · Reversed: ${deposit.reversal.reason}` : ""}`,
            reversed: Boolean(deposit.reversal),
            depositId: deposit.id,
          })), ...recentTransfers.map((transfer) => ({
            id: `transfer-${transfer.id}`,
            createdAt: transfer.createdAt,
            amount: transfer.amount,
            alert: isOverAlertThreshold(transfer.amount),
            title: `${transfer.sender.name || transfer.sender.email} → ${transfer.recipient.name || transfer.recipient.email}`,
            detail: "Student-to-student transfer",
            reversed: false,
            depositId: null,
          }))]
            .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
            .map((entry) => (
              <article className="monitor-transaction" key={entry.id}>
                <span className={entry.alert ? "alert-icon" : "activity-icon received"} aria-hidden="true">{entry.alert ? "!" : "↔"}</span>
                <div className="monitor-transaction-main">
                  <strong>{entry.title}</strong>
                  <span>{entry.alert ? "OVER $50 ALERT · " : ""}{entry.detail}</span>
                  <time dateTime={entry.createdAt.toISOString()}>{new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short" }).format(entry.createdAt)}</time>
                </div>
                <strong className={`activity-amount ${entry.reversed ? "sent" : "received"}`}>
                  {entry.reversed ? "Reversed" : formatBalance(entry.amount.toString())}
                </strong>
                {entry.depositId && !entry.reversed && <ReverseDepositForm depositId={entry.depositId} />}
              </article>
            ))}
          {!recentDeposits.length && !recentTransfers.length && (
            <p className="activity-empty">No recent transactions.</p>
          )}
        </section>
      </main>
    </div>
  );
}