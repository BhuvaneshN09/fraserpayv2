import Link from "next/link";
import { signOut } from "@/auth";

export function AdminNav({ email, active }: { email: string | null; active: "transfer" | "monitor" }) {
  return (
    <>
      <header className="topbar">
        <Link className="wordmark" href="/admin/transfer" aria-label="SAC Admin home">
          <span className="brand-mark">S</span>
          <span>SAC <span className="wordmark-light">accounts</span></span>
        </Link>
        <div className="admin-nav">
          <span className="admin-identity">{email}</span>
          <form action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}>
            <button className="signout-button" type="submit">Sign out</button>
          </form>
        </div>
      </header>
      <nav className="admin-tabs" aria-label="SAC administration">
        <Link className={active === "transfer" ? "active" : ""} href="/admin/transfer">Transfer / Add</Link>
        <Link className={active === "monitor" ? "active" : ""} href="/admin/monitor">Monitor</Link>
      </nav>
    </>
  );
}
