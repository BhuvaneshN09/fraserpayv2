import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { getDashboardUser } from "@/lib/dashboard-user";
import { getRecentStudentTransfers } from "@/lib/cash-ledger";
import { getStudentCashActivity } from "@/lib/cash-ledger";
import { StudentTransferForm } from "@/app/cash-ledger-forms";

function formatBalance(balance: string) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(Number(balance));
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getDashboardUser(session.user.id);
  if (!user) redirect("/login");
  if (user.role === "SAC_ADMIN" || user.role === "ADMIN") redirect("/admin");
  const [deposits, transfers] = await Promise.all([
    getStudentCashActivity(user.id),
    getRecentStudentTransfers(user.id),
  ]);

  return (
    <div className="dashboard-shell">
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="FraserPay home">
          <span className="brand-mark">F</span>
          <span>fraser<span className="wordmark-light">pay</span></span>
        </Link>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button className="signout-button" type="submit">Sign out</button>
        </form>
      </header>

      <main className="dashboard-content" aria-labelledby="welcome-heading">
        <p className="eyebrow">STUDENT ACCOUNT · CHARITY WEEK</p>
        <h1 id="welcome-heading">Hello{user.name ? `, ${user.name.split(" ")[0]}` : ""}.</h1>
        <p className="account-email">{user.email}</p>

        <section className="balance-panel" aria-labelledby="balance-heading">
          <div className="balance-topline">
            <h2 id="balance-heading">Account balance</h2>
            <span className="balance-indicator"><span /> Student account</span>
          </div>
          <p className="balance-amount">{formatBalance(user.balance.toString())}</p>
          <p className="balance-note">Cash deposits recorded by SAC administrators</p>
          <div className="panel-rule" />
          <div className="account-reference">
            <span>ACCOUNT HOLDER</span>
            <strong>{user.name || user.email}</strong>
          </div>
        </section>

        <section className="deposit-panel student-transfer-panel" aria-labelledby="transfer-heading">
          <div className="section-heading">
            <div>
              <p className="section-kicker">STUDENT TRANSFER</p>
              <h2 id="transfer-heading">Send to another student</h2>
            </div>
          </div>
          <p className="balance-note">Send only to another PDSB student account. Transfers cannot be cancelled once sent.</p>
          <StudentTransferForm />
        </section>

        <section className="activity-section" aria-labelledby="transfer-history-heading">
          <div className="activity-heading">
            <h2 id="transfer-history-heading">Transfers</h2>
            <span>{transfers.length} recent {transfers.length === 1 ? "transfer" : "transfers"}</span>
          </div>
          {transfers.length ? (
            <ul className="activity-list">
              {transfers.map((transfer) => {
                const sent = transfer.senderId === user.id;
                const other = sent ? transfer.recipient : transfer.sender;
                return (
                  <li className="activity-row" key={transfer.id}>
                    <div className="activity-description">
                      <span className={`activity-icon ${sent ? "sent" : "received"}`} aria-hidden="true">{sent ? "↗" : "↙"}</span>
                      <span>
                        <strong>{sent ? "Sent to" : "Received from"} {other.name || other.email}</strong>
                        <time dateTime={transfer.createdAt.toISOString()}>{new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short" }).format(transfer.createdAt)}</time>
                      </span>
                    </div>
                    <strong className={`activity-amount ${sent ? "sent" : "received"}`}>
                      {sent ? "−" : "+"}{formatBalance(transfer.amount.toString())}
                    </strong>
                  </li>
                );
              })}
            </ul>
          ) : <p className="activity-empty">Your student-to-student transfers will appear here.</p>}
        </section>

        <section className="activity-section" aria-labelledby="activity-heading">
          <div className="activity-heading">
            <h2 id="activity-heading">Deposit history</h2>
            <span>{deposits.length} recent {deposits.length === 1 ? "entry" : "entries"}</span>
          </div>
          {deposits.length ? (
            <ul className="activity-list">
              {deposits.map((deposit) => (
                <li className="activity-row" key={deposit.id}>
                  <div className="activity-description">
                    <span className={`activity-icon ${deposit.reversal ? "sent" : "received"}`} aria-hidden="true">
                      {deposit.reversal ? "−" : "+"}
                    </span>
                    <span>
                      <strong>
                        {deposit.eventName}
                      </strong>
                      <time dateTime={deposit.createdAt.toISOString()}>
                        {`Recorded by SAC · `}
                        {new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short" }).format(deposit.createdAt)}
                      </time>
                    </span>
                  </div>
                  <div className="activity-trailing">
                    <strong className={`activity-amount ${deposit.reversal ? "sent" : "received"}`}>
                      {deposit.reversal ? "Reversed" : `+${formatBalance(deposit.amount.toString())}`}
                    </strong>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="activity-empty">Your event deposits will appear here.</p>
          )}
        </section>

        <footer className="dashboard-footer">
          <span>FraserPay V2</span>
          <span>PDSB student account</span>
        </footer>
      </main>
    </div>
  );
}