import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDashboardUser } from "@/lib/dashboard-user";
import { CashDepositForm } from "@/app/cash-ledger-forms";
import { AdminNav } from "@/app/admin/admin-nav";

export default async function AdminTransferPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await getDashboardUser(session.user.id);
  if (!user) redirect("/login");
  if (user.role !== "SAC_ADMIN" && user.role !== "ADMIN") redirect("/");

  return (
    <div className="dashboard-shell">
      <AdminNav email={user.email} active="transfer" />
      <main className="dashboard-content admin-content" aria-labelledby="admin-heading">
        <p className="eyebrow">STUDENT ACTIVITIES COUNCIL <span>·</span> CASH REGISTER</p>
        <h1 id="admin-heading">Transfer / Add</h1>
        <p className="account-email">Record cash received at a school event into a student account.</p>
        <section className="deposit-panel" aria-labelledby="deposit-heading">
          <div className="section-heading">
            <div>
              <p className="section-kicker">SAC ADMIN · {user.role === "ADMIN" ? "ADMINISTRATOR" : "CASH DESK"}</p>
              <h2 id="deposit-heading">Add cash to a student account</h2>
            </div>
          </div>
          <CashDepositForm requestId={randomUUID()} />
        </section>
      </main>
    </div>
  );
}